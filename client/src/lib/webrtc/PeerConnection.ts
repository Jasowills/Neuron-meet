export interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
}

// Get TURN server config from environment variables if available
const getTurnServers = (): RTCIceServer[] => {
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
  
  if (turnUrl && turnUsername && turnCredential) {
    return [
      { urls: turnUrl, username: turnUsername, credential: turnCredential },
      { urls: turnUrl.replace('turn:', 'turns:').replace(':3478', ':5349'), username: turnUsername, credential: turnCredential },
    ];
  }
  return [];
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // STUN servers (free, for NAT traversal discovery)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Add TURN servers from environment if available
  ...getTurnServers(),
];

export class PeerConnectionManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private config: PeerConnectionConfig;

  // Callbacks
  public onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void;
  public onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  public onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
  public onNegotiationNeeded?: (peerId: string) => void;

  constructor(config?: Partial<PeerConnectionConfig>) {
    this.config = {
      iceServers: config?.iceServers || DEFAULT_ICE_SERVERS,
    };
  }

  setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream;
    
    // Update tracks on existing connections
    if (stream) {
      this.peerConnections.forEach((pc) => {
        this.updateTracks(pc, stream);
      });
    }
  }

  setScreenStream(_stream: MediaStream | null): void {
    // Screen stream is managed by MediaManager
  }

  private updateTracks(pc: RTCPeerConnection, stream: MediaStream): void {
    const senders = pc.getSenders();
    
    stream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      } else {
        pc.addTrack(track, stream);
      }
    });
  }

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    // Close existing connection if any
    this.closePeerConnection(peerId);

    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(peerId, event.candidate);
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.onRemoteStream?.(peerId, stream);
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(peerId, pc.connectionState);
      
      // Clean up failed connections
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeerConnection(peerId);
      }
    };

    // Handle negotiation needed
    pc.onnegotiationneeded = () => {
      this.onNegotiationNeeded?.(peerId);
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit | null> {
    let pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      pc = await this.createPeerConnection(peerId);
    }

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }

  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    let pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      pc = await this.createPeerConnection(peerId);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      return null;
    }
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      console.error('No peer connection found for:', peerId);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    
    if (!pc) {
      console.error('No peer connection found for:', peerId);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        promises.push(sender.replaceTrack(newTrack));
      }
    });

    await Promise.all(promises);
  }

  closePeerConnection(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  closeAll(): void {
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
  }

  getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(peerId);
  }

  getPeerIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  getConnectionState(peerId: string): RTCPeerConnectionState | undefined {
    return this.peerConnections.get(peerId)?.connectionState;
  }
}
