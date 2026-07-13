import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';
import { NoopAudioService } from './NoopAudioService';

/**
 * Singleton that owns the single audio engine instance and two independent mute
 * flags: one for sound effects and one for the background music.
 *
 * It implements {@link IAudioService} by delegating to an inner engine, but
 * suppresses each channel while its flag is set — combining the Singleton
 * pattern (one shared audio controller, as the brief suggests for AudioManager)
 * with per-channel mute handling.
 */
export class AudioManager implements IAudioService {
  private static instance: AudioManager | null = null;

  private engine: IAudioService = new NoopAudioService();
  private effectsMuted = false;
  private musicMuted = false;

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

  isEffectsMuted(): boolean {
    return this.effectsMuted;
  }

  isMusicMuted(): boolean {
    return this.musicMuted;
  }

  /** Flips the sound-effects mute and returns the new state. */
  toggleEffectsMuted(): boolean {
    this.effectsMuted = !this.effectsMuted;
    return this.effectsMuted;
  }

  /** Flips the music mute and returns the new state. */
  toggleMusicMuted(): boolean {
    this.musicMuted = !this.musicMuted;
    return this.musicMuted;
  }

  playEffect(effect: SoundEffect): void {
    if (!this.effectsMuted) {
      this.engine.playEffect(effect);
    }
  }

  startMusic(): void {
    if (!this.musicMuted) {
      this.engine.startMusic();
    }
  }

  stopMusic(): void {
    // Stopping is always allowed, even while music is not muted.
    this.engine.stopMusic();
  }

  /** Test helper: drops the singleton and resets state. */
  static resetForTests(): void {
    AudioManager.instance = null;
  }
}
