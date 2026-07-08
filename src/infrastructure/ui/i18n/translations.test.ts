import { translate } from './translations';

describe('translate', () => {
  it('should_return_the_english_text_when_the_key_exists', () => {
    expect(translate('en', 'home.play')).toBe('Play');
  });

  it('should_return_the_spanish_text_when_the_key_exists', () => {
    expect(translate('es', 'home.play')).toBe('Jugar');
  });

  it('should_interpolate_named_parameters_when_the_text_has_placeholders', () => {
    expect(translate('en', 'game.moves', { count: 7 })).toBe('Moves: 7');
    expect(translate('es', 'game.score', { score: 990 })).toBe('Puntos: 990');
  });

  it('should_keep_unmatched_placeholders_when_a_param_is_missing', () => {
    expect(translate('en', 'game.score')).toBe('Score: {score}');
  });
});
