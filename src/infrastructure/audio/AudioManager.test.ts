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

  it('should_delegate_playback_to_the_engine_when_not_muted', () => {
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

  it('should_suppress_effects_and_music_when_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);
    manager.setMuted(true);

    // Act
    manager.playEffect('ESCAPE');
    manager.startMusic();

    // Assert
    expect(engine.effects).toEqual([]);
    expect(engine.music).toBe('none');
  });

  it('should_allow_stopping_music_when_muted', () => {
    // Arrange
    const engine = new RecordingEngine();
    const manager = AudioManager.getInstance();
    manager.useEngine(engine);
    manager.setMuted(true);

    // Act
    manager.stopMusic();

    // Assert
    expect(engine.music).toBe('stopped');
  });

  it('should_flip_and_report_the_mute_state_when_toggled', () => {
    // Arrange
    const manager = AudioManager.getInstance();

    // Act / Assert
    expect(manager.isMuted()).toBe(false);
    expect(manager.toggleMuted()).toBe(true);
    expect(manager.isMuted()).toBe(true);
    expect(manager.toggleMuted()).toBe(false);
  });
});
