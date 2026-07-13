import { useCallback, useState } from 'react';
import { AudioManager } from '../../audio/AudioManager';

/**
 * Exposes the two independent mute flags (sound effects and background music)
 * held by the {@link AudioManager} singleton, keeping local copies in sync so
 * the view re-renders when they change.
 */
export function useSound() {
  const [effectsMuted, setEffectsMuted] = useState<boolean>(() =>
    AudioManager.getInstance().isEffectsMuted(),
  );
  const [musicMuted, setMusicMuted] = useState<boolean>(() =>
    AudioManager.getInstance().isMusicMuted(),
  );

  const toggleEffects = useCallback(() => {
    setEffectsMuted(AudioManager.getInstance().toggleEffectsMuted());
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = AudioManager.getInstance();
    const nowMuted = audio.toggleMusicMuted();
    // The flag only gates FUTURE calls, so silence/resume the running music too.
    if (nowMuted) {
      audio.stopMusic();
    } else {
      audio.startMusic();
    }
    setMusicMuted(nowMuted);
  }, []);

  return { effectsMuted, musicMuted, toggleEffects, toggleMusic };
}
