export interface MediaConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export class MediaManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  async getLocalStream(constraints?: MediaConstraints): Promise<MediaStream> {
    // Reuse existing stream if it's still active
    if (this.localStream && this.localStream.active) {
      const videoTracks = this.localStream.getVideoTracks();
      const audioTracks = this.localStream.getAudioTracks();
      // Check if we have working tracks
      if (videoTracks.length > 0 || audioTracks.length > 0) {
        return this.localStream;
      }
    }

    const defaultConstraints: MediaConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints,
      );
      return this.localStream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      throw error;
    }
  }

  async getAudioOnlyStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return this.localStream;
    } catch (error) {
      console.error("Error getting audio stream:", error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // Capturing system/tab audio is a frequent source of echo loops in calls.
        audio: false,
      });

      // Handle when user stops sharing via browser UI
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
        window.dispatchEvent(new CustomEvent("screenshare-ended"));
      };

      return this.screenStream;
    } catch (error) {
      if ((error as Error).name === "NotAllowedError") {
        throw new Error("Screen sharing permission denied");
      }
      throw error;
    }
  }

  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  stopAll(): void {
    this.stopLocalStream();
    this.stopScreenShare();
  }

  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  getScreenStreamRef(): MediaStream | null {
    return this.screenStream;
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const oldVideoTrack = this.localStream.getVideoTracks()[0];

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in stream
      this.localStream.removeTrack(oldVideoTrack);
      this.localStream.addTrack(newVideoTrack);

      // Stop old track
      oldVideoTrack.stop();
    } catch (error) {
      console.error("Error switching camera:", error);
      throw error;
    }
  }

  async switchMicrophone(deviceId: string): Promise<void> {
    if (!this.localStream) return;

    const oldAudioTrack = this.localStream.getAudioTracks()[0];

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      const newAudioTrack = newStream.getAudioTracks()[0];

      // Replace track in stream
      this.localStream.removeTrack(oldAudioTrack);
      this.localStream.addTrack(newAudioTrack);

      // Stop old track
      oldAudioTrack.stop();
    } catch (error) {
      console.error("Error switching microphone:", error);
      throw error;
    }
  }

  static async getDevices(): Promise<MediaDevice[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices
      .filter(
        (device) =>
          device.kind === "videoinput" ||
          device.kind === "audioinput" ||
          device.kind === "audiooutput",
      )
      .map((device) => ({
        deviceId: device.deviceId,
        label:
          device.label || `${device.kind} (${device.deviceId.slice(0, 8)})`,
        kind: device.kind,
      }));
  }

  static async getCameras(): Promise<MediaDevice[]> {
    const devices = await MediaManager.getDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }

  static async getMicrophones(): Promise<MediaDevice[]> {
    const devices = await MediaManager.getDevices();
    return devices.filter((d) => d.kind === "audioinput");
  }

  static async getSpeakers(): Promise<MediaDevice[]> {
    const devices = await MediaManager.getDevices();
    return devices.filter((d) => d.kind === "audiooutput");
  }

  static isScreenShareSupported(): boolean {
    return "getDisplayMedia" in navigator.mediaDevices;
  }
}

// Singleton instance
export const mediaManager = new MediaManager();
