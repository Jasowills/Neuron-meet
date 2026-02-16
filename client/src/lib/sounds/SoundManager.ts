/**
 * Sound Manager for meeting notification sounds
 * Uses Web Audio API to generate subtle notification sounds
 */

type SoundType = 'join' | 'leave' | 'handRaise' | 'message' | 'mute' | 'unmute' | 'meetingEnd';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play a notification sound
   */
  play(type: SoundType): void {
    if (!this.enabled) return;

    try {
      switch (type) {
        case 'join':
          this.playJoinSound();
          break;
        case 'leave':
          this.playLeaveSound();
          break;
        case 'handRaise':
          this.playHandRaiseSound();
          break;
        case 'message':
          this.playMessageSound();
          break;
        case 'mute':
          this.playMuteSound();
          break;
        case 'unmute':
          this.playUnmuteSound();
          break;
        case 'meetingEnd':
          this.playMeetingEndSound();
          break;
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Pleasant ascending chime - someone joined
   */
  private playJoinSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Two-note ascending chime
    this.playTone(ctx, 523.25, now, 0.1, 0.15); // C5
    this.playTone(ctx, 659.25, now + 0.1, 0.15, 0.2); // E5
  }

  /**
   * Descending tone - someone left
   */
  private playLeaveSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Two-note descending
    this.playTone(ctx, 523.25, now, 0.1, 0.12); // C5
    this.playTone(ctx, 392.0, now + 0.1, 0.15, 0.15); // G4
  }

  /**
   * Attention-grabbing ding - hand raised
   */
  private playHandRaiseSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Bell-like sound
    this.playTone(ctx, 880, now, 0.08, 0.25, 'triangle'); // A5
    this.playTone(ctx, 1108.73, now + 0.05, 0.1, 0.2, 'triangle'); // C#6
  }

  /**
   * Soft pop - new message
   */
  private playMessageSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Quick soft pop
    this.playTone(ctx, 800, now, 0.05, 0.1, 'sine');
  }

  /**
   * Quick low beep - muted
   */
  private playMuteSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    this.playTone(ctx, 300, now, 0.08, 0.08, 'sine');
  }

  /**
   * Quick high beep - unmuted
   */
  private playUnmuteSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    this.playTone(ctx, 500, now, 0.08, 0.1, 'sine');
  }

  /**
   * Descending three-note chime - meeting ended
   */
  private playMeetingEndSound(): void {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Three-note descending melody
    this.playTone(ctx, 659.25, now, 0.12, 0.2); // E5
    this.playTone(ctx, 523.25, now + 0.12, 0.12, 0.18); // C5
    this.playTone(ctx, 392.0, now + 0.24, 0.2, 0.15); // G4
  }

  /**
   * Helper to play a single tone
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.2,
    type: OscillatorType = 'sine'
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Apply volume with fade out
    const adjustedVolume = volume * this.volume;
    gainNode.gain.setValueAtTime(adjustedVolume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
  }

  /**
   * Resume audio context (required for browsers that suspend it)
   */
  async resume(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();
