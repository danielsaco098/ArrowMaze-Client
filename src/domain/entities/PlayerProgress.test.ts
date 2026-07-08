import { PlayerProgress } from './PlayerProgress';
import { Score } from '../value-objects/Score';

describe('PlayerProgress', () => {
  it('should_have_no_completed_levels_when_empty', () => {
    // Arrange / Act
    const progress = PlayerProgress.empty();

    // Assert
    expect(progress.completedCount()).toBe(0);
    expect(progress.isCompleted(1)).toBe(false);
  });

  it('should_keep_the_best_score_when_a_completion_is_recorded', () => {
    // Arrange
    const progress = PlayerProgress.empty();

    // Act
    const updated = progress.recordCompletion(1, Score.of(800));

    // Assert
    expect(updated.isCompleted(1)).toBe(true);
    expect(updated.bestScore(1)).toBe(800);
    expect(progress.isCompleted(1)).toBe(false); // original unchanged
  });

  it('should_keep_the_higher_score_when_a_level_is_completed_again', () => {
    // Arrange
    const progress = PlayerProgress.empty().recordCompletion(1, Score.of(800));

    // Act
    const lower = progress.recordCompletion(1, Score.of(500));
    const higher = progress.recordCompletion(1, Score.of(950));

    // Assert
    expect(lower.bestScore(1)).toBe(800);
    expect(higher.bestScore(1)).toBe(950);
  });

  it('should_unlock_the_next_level_when_the_previous_is_completed', () => {
    // Arrange
    const progress = PlayerProgress.empty();

    // Assert
    expect(progress.isUnlocked(1)).toBe(true);
    expect(progress.isUnlocked(2)).toBe(false);

    // Act
    const afterLevel1 = progress.recordCompletion(1, Score.of(700));

    // Assert
    expect(afterLevel1.isUnlocked(2)).toBe(true);
    expect(afterLevel1.isUnlocked(3)).toBe(false);
  });

  it('should_list_completed_ids_in_ascending_order_when_progress_is_queried', () => {
    // Arrange
    const progress = PlayerProgress.empty()
      .recordCompletion(3, Score.of(100))
      .recordCompletion(1, Score.of(100));

    // Act / Assert
    expect(progress.completedLevelIds()).toEqual([1, 3]);
  });
});
