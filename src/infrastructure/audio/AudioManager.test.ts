import { AudioManager } from './AudioManager';
import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';

class RecordingEngine implements IAudioService {
  readonly effects: SoundEffect[] = [];
  music: 'started' | 'stopped' | 'none' = 'none';
  playEffect(effect: SoundEffect): void {
    this.effects.push(effect);
  }
  startMusic(): void {
    this.music = 'started';
  }
  stopMusic(): void {
    this.music = 'stopped';
  }
}

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager.resetForTests();
  });

  it('should_return_the_same_instance_when_requested_repeatedly', () => {
    expect(AudioManager.getInstance()).toBe(AudioManager.getInstance());
  });

  it('should_delegate_both_channels_to_the_engine_when_nothing_is_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);

    // Act
    manager.playEffect('VICTORY');
    manager.startMusic();

    // Assert
    expect(engine.effects).toEqual(['VICTORY']);
    expect(engine.music).toBe('started');
  });

  it('should_suppress_only_effects_when_effects_are_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);
    manager.toggleEffectsMuted();

    // Act
    manager.playEffect('ESCAPE');
    manager.startMusic();

    // Assert: effects silenced, music still plays
    expect(engine.effects).toEqual([]);
    expect(engine.music).toBe('started');
  });

  it('should_suppress_only_music_when_music_is_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);
    manager.toggleMusicMuted();

    // Act
    manager.playEffect('ESCAPE');
    manager.startMusic();

    // Assert: music silenced, effects still play
    expect(engine.effects).toEqual(['ESCAPE']);
    expect(engine.music).toBe('none');
  });

  it('should_allow_stopping_music_even_when_music_is_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);
    manager.toggleMusicMuted();

    // Act
    manager.stopMusic();

    // Assert
    expect(engine.music).toBe('stopped');
  });

  it('should_flip_and_report_each_channel_independently_when_toggled', () => {
    // Arrange
    const manager = AudioManager.getInstance();

    // Act / Assert: effects and music mute are independent
    expect(manager.isEffectsMuted()).toBe(false);
    expect(manager.isMusicMuted()).toBe(false);

    expect(manager.toggleEffectsMuted()).toBe(true);
    expect(manager.isEffectsMuted()).toBe(true);
    expect(manager.isMusicMuted()).toBe(false); // music unaffected

    expect(manager.toggleMusicMuted()).toBe(true);
    expect(manager.isMusicMuted()).toBe(true);
    expect(manager.isEffectsMuted()).toBe(true); // effects unaffected
  });
});
