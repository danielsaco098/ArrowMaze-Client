import { useCallback, useState } from 'react';
import { AudioManager } from '../../audio/AudioManager';

/**
 * Exposes the global mute state (held by the {@link AudioManager} singleton) to
 * the UI, with a toggle that keeps a local copy in sync so the view re-renders.
 */
export function useSound() {
  const [muted, setMuted] = useState<boolean>(() => AudioManager.getInstance().isMuted());

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

  return { muted, toggleMuted };
}
