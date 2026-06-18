import { AudioObserver } from './AudioObserver';
import type { IAudioService, SoundEffect } from '../../application/ports/IAudioService';
import { PlayerMovedEvent } from '../../domain/events/PlayerMovedEvent';
import { LevelCompletedEvent } from '../../domain/events/LevelCompletedEvent';
import { GameOverEvent } from '../../domain/events/GameOverEvent';
import { TapOutcome } from '../../domain/entities/GameStatus';

class RecordingEngine implements IAudioService {
  readonly effects: SoundEffect[] = [];
  playEffect(effect: SoundEffect): void {
    this.effects.push(effect);
  }
  startMusic(): void {}
  stopMusic(): void {}
}

describe('AudioObserver', () => {
  it('should_play_the_escape_sound_when_an_arrow_escapes', () => {
    const engine = new RecordingEngine();
    new AudioObserver(engine).notify(new PlayerMovedEvent(TapOutcome.Escaped, 3, 2));
    expect(engine.effects).toEqual(['ESCAPE']);
  });

  it('should_play_the_blocked_sound_when_a_tap_is_blocked', () => {
    const engine = new RecordingEngine();
    new AudioObserver(engine).notify(new PlayerMovedEvent(TapOutcome.Blocked, 2, 3));
    expect(engine.effects).toEqual(['BLOCKED']);
  });

  it('should_play_the_victory_sound_when_the_level_is_completed', () => {
    const engine = new RecordingEngine();
    new AudioObserver(engine).notify(new LevelCompletedEvent(5));
    expect(engine.effects).toEqual(['VICTORY']);
  });

  it('should_play_the_defeat_sound_on_game_over', () => {
    const engine = new RecordingEngine();
    new AudioObserver(engine).notify(new GameOverEvent(7));
    expect(engine.effects).toEqual(['DEFEAT']);
  });
});
