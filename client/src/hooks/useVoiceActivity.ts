import { useEffect, useState, useRef, useCallback } from "react";

const VOICE_THRESHOLD = 15; // Audio level threshold for detecting speech
const SMOOTHING_FACTOR = 0.8; // Smoothing for audio level changes
const DEBOUNCE_MS = 200; // Debounce for speaking state changes

interface UseVoiceActivityOptions {
  enabled?: boolean;
  threshold?: number;
}

/**
 * Hook to detect voice activity from a MediaStream
 * Returns whether the stream is currently "speaking"
 */
export function useVoiceActivity(
  stream: MediaStream | null | undefined,
  options: UseVoiceActivityOptions = {}
): boolean {
  const { enabled = true, threshold = VOICE_THRESHOLD } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeakingRef = useRef(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!stream || !enabled) {
      cleanup();
      setIsSpeaking(false);
      return;
    }

    // Check if stream has audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      setIsSpeaking(false);
      return;
    }

    // Create audio context and analyser
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = SMOOTHING_FACTOR;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        const currentlySpeaking = average > threshold;

        // Debounce the speaking state to avoid flickering
        if (currentlySpeaking !== lastSpeakingRef.current) {
          lastSpeakingRef.current = currentlySpeaking;

          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }

          debounceTimeoutRef.current = setTimeout(() => {
            setIsSpeaking(currentlySpeaking);
          }, currentlySpeaking ? 0 : DEBOUNCE_MS);
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      // Start monitoring
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    } catch (error) {
      console.error("Error setting up voice activity detection:", error);
    }

    return cleanup;
  }, [stream, enabled, threshold, cleanup]);

  return isSpeaking;
}

export default useVoiceActivity;
