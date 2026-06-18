import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';

/**
 * Placeholder audio engine used until real sound assets are bundled.
 *
 * It honours the {@link IAudioService} contract so the rest of the audio system
 * (mute, observer wiring) is fully functional today; swapping in an asset-backed
 * implementation (e.g. expo-audio) later is a one-line change at the composition
 * root. In development it traces what *would* play.
 */
export class NoopAudioService implements IAudioService {
  playEffect(effect: SoundEffect): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(`[audio] effect: ${effect}`);
    }
  }

  startMusic(): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[audio] music: start');
    }
  }

  stopMusic(): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[audio] music: stop');
    }
  }
}
