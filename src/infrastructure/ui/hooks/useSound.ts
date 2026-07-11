import { useCallback, useState } from 'react';
import { AudioManager } from '../../audio/AudioManager';

/**
 * Exposes the global mute state and master volume (held by the
 * {@link AudioManager} singleton) to the UI, keeping local copies in sync so
 * the view re-renders.
 */
export function useSound() {
  const [muted, setMuted] = useState<boolean>(() => AudioManager.getInstance().isMuted());
  const [volume, setVolumeState] = useState<number>(() => AudioManager.getInstance().getVolume());

  const toggleMuted = useCallback(() => {
    const audio = AudioManager.getInstance();
    const nowMuted = audio.toggleMuted();
    // The flag only gates FUTURE calls, so silence/resume the running music too.
    if (nowMuted) {
      audio.stopMusic();
    } else {
      audio.startMusic();
    }
    setMuted(nowMuted);
  }, []);

  const setVolume = useCallback((value: number) => {
    const audio = AudioManager.getInstance();
    audio.setVolume(value);
    setVolumeState(audio.getVolume());
  }, []);

  return { muted, toggleMuted, volume, setVolume };
}
