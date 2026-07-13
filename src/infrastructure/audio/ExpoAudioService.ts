import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';

/* eslint-disable @typescript-eslint/no-var-requires */
const EFFECT_SOURCES: Record<SoundEffect, number> = {
  ESCAPE: require('../../../assets/audio/escape.wav'),
  BLOCKED: require('../../../assets/audio/blocked.wav'),
  VICTORY: require('../../../assets/audio/victory.wav'),
  DEFEAT: require('../../../assets/audio/defeat.wav'),
  COLLECT: require('../../../assets/audio/collect.wav'),
};
const MUSIC_SOURCE: number = require('../../../assets/audio/music.wav');

/**
 * Real audio engine backed by expo-audio. One pre-created player per effect
 * (rewound before each play so rapid taps always sound) and a looping player
 * for the background music. Plugged into the AudioManager singleton at app
 * startup; the manager's mute flag gates every call before it reaches here.
 * All failures are swallowed: audio must never break gameplay.
 */
export class ExpoAudioService implements IAudioService {
  private readonly effects = new Map<SoundEffect, AudioPlayer>();
  private music: AudioPlayer | null = null;

  playEffect(effect: SoundEffect): void {
    try {
      let player = this.effects.get(effect);
      if (!player) {
        player = createAudioPlayer(EFFECT_SOURCES[effect]);
        this.effects.set(effect, player);
      }
      void player.seekTo(0);
      player.play();
    } catch {
      // Never let audio break the game.
    }
  }

  startMusic(): void {
    try {
      if (!this.music) {
        this.music = createAudioPlayer(MUSIC_SOURCE);
        this.music.loop = true;
        this.music.volume = 0.5; // sits behind the effects
      }
      this.music.play();
    } catch {
      // Never let audio break the game.
    }
  }

  stopMusic(): void {
    try {
      this.music?.pause();
    } catch {
      // Never let audio break the game.
    }
  }
}
