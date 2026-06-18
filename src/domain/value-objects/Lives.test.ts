import { Lives } from './Lives';
import { InvalidLivesError, NoLivesRemainingError } from '../errors';

describe('Lives', () => {
  it('should_start_with_three_when_created_as_initial', () => {
    // Act
    const lives = Lives.initial();

    // Assert
    expect(lives.count).toBe(3);
    expect(lives.isZero()).toBe(false);
  });

  it('should_return_a_new_lives_with_one_fewer_when_decremented', () => {
    // Arrange
    const lives = Lives.of(2);

    // Act
    const result = lives.decrement();

    // Assert
    expect(result.count).toBe(1);
    expect(lives.count).toBe(2); // original unchanged (immutable)
  });

  it('should_report_zero_when_last_life_is_lost', () => {
    // Arrange
    const lives = Lives.of(1);

    // Act
    const result = lives.decrement();

    // Assert
    expect(result.isZero()).toBe(true);
  });

  it('should_throw_NoLivesRemainingError_when_decrementing_zero', () => {
    // Arrange
    const lives = Lives.of(0);

    // Act / Assert
    expect(() => lives.decrement()).toThrow(NoLivesRemainingError);
  });

  it('should_throw_InvalidLivesError_when_count_is_negative_or_fractional', () => {
    // Act / Assert
    expect(() => Lives.of(-1)).toThrow(InvalidLivesError);
    expect(() => Lives.of(1.5)).toThrow(InvalidLivesError);
  });
});
