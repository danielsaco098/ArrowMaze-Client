import { StandardScoringStrategy } from './StandardScoringStrategy';

describe('StandardScoringStrategy', () => {
  const strategy = new StandardScoringStrategy();

  it('should_award_a_higher_base_for_harder_difficulty_given_equal_play', () => {
    // Arrange
    const play = { moves: 5, elapsedMs: 10_000 };

    // Act
    const easy = strategy.score({ ...play, difficulty: 'EASY' });
    const hard = strategy.score({ ...play, difficulty: 'HARD' });

    // Assert
    expect(hard.points).toBeGreaterThan(easy.points);
  });

  it('should_subtract_move_and_time_penalties_from_the_base', () => {
    // Arrange: EASY base 1000, 5 moves * 10 + 12s * 5 = 50 + 60 = 110 penalty
    // Act
    const score = strategy.score({ moves: 5, elapsedMs: 12_000, difficulty: 'EASY' });

    // Assert
    expect(score.points).toBe(890);
  });

  it('should_add_a_bonus_per_collected_star', () => {
    // Arrange: EASY base 1000, no penalties, 2 stars * 50 = +100
    // Act
    const score = strategy.score({ moves: 0, elapsedMs: 0, difficulty: 'EASY', collectibles: 2 });

    // Assert
    expect(score.points).toBe(1100);
  });

  it('should_not_drop_below_the_minimum_score', () => {
    // Arrange: huge move/time penalty would go negative
    // Act
    const score = strategy.score({ moves: 1000, elapsedMs: 600_000, difficulty: 'EASY' });

    // Assert
    expect(score.points).toBe(100);
  });

  it('should_honor_a_custom_configuration', () => {
    // Arrange
    const custom = new StandardScoringStrategy({
      baseByDifficulty: { EASY: 500, MEDIUM: 500, HARD: 500 },
      movePenalty: 0,
      timePenaltyPerSecond: 0,
      minimumScore: 0,
    });

    // Act
    const score = custom.score({ moves: 50, elapsedMs: 99_000, difficulty: 'EASY' });

    // Assert: penalties disabled → exactly the base
    expect(score.points).toBe(500);
  });
});
