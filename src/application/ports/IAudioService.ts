export type SoundEffect = 'ESCAPE' | 'BLOCKED' | 'VICTORY' | 'DEFEAT';

/**
 * Port for game audio. Use cases/observers depend on this abstraction; the
 * concrete engine (a real sound library, or a no-op while assets are pending)
 * lives in Layer 4 and can be swapped without touching the rest of the app.
 */
export interface IAudioService {
  playEffect(effect: SoundEffect): void;
  startMusic(): void;
  stopMusic(): void;
}
