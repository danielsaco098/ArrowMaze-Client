import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';
import { NoopAudioService } from './NoopAudioService';

/**
 * Singleton that owns the single audio engine instance and the global mute flag.
 *
 * It implements {@link IAudioService} by delegating to an inner engine, but
 * suppresses playback while muted — combining the Singleton pattern (one shared
 * audio controller, as the brief suggests for AudioManager) with mute handling.
 */
export class AudioManager implements IAudioService {
  private static instance: AudioManager | null = null;

  private engine: IAudioService = new NoopAudioService();
  private muted = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Swaps the underlying engine (e.g. plug an asset-backed service at startup). */
  useEngine(engine: IAudioService): void {
    this.engine = engine;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Flips mute and returns the new state. */
  toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  playEffect(effect: SoundEffect): void {
    if (!this.muted) {
      this.engine.playEffect(effect);
    }
  }

  startMusic(): void {
    if (!this.muted) {
      this.engine.startMusic();
    }
  }

  stopMusic(): void {
    // Stopping is always allowed, even while muted.
    this.engine.stopMusic();
  }

  /** Test helper: drops the singleton and resets state. */
  static resetForTests(): void {
    AudioManager.instance = null;
  }
}
