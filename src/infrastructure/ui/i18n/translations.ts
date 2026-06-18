export type Language = 'en' | 'es';

/** English is the source of truth; every other language must provide the same keys. */
const en = {
  'home.subtitle': 'Tap an arrow to slide it off the board.',
  'home.play': 'Play',
  'home.hint': '3 lives · clear every arrow to win',
  'common.back': '‹ Back',
  'common.levelSelect': 'Level select',
  'common.loading': 'Loading…',
  'levelSelect.title': 'Select a level',
  'difficulty.EASY': 'Easy',
  'difficulty.MEDIUM': 'Medium',
  'difficulty.HARD': 'Hard',
  'game.moves': 'Moves: {count}',
  'game.victoryTitle': 'You escaped!',
  'game.score': 'Score: {score}',
  'game.newBest': 'New best!',
  'game.next': 'Next level',
  'game.defeatTitle': 'Out of lives',
  'game.retry': 'Retry',
  'settings.languageShort': 'EN',
  'settings.soundOn': '🔊 Sound',
  'settings.soundOff': '🔇 Muted',
} as const;

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  'home.subtitle': 'Toca una flecha para deslizarla fuera del tablero.',
  'home.play': 'Jugar',
  'home.hint': '3 vidas · vacía el tablero para ganar',
  'common.back': '‹ Atrás',
  'common.levelSelect': 'Elegir nivel',
  'common.loading': 'Cargando…',
  'levelSelect.title': 'Elige un nivel',
  'difficulty.EASY': 'Fácil',
  'difficulty.MEDIUM': 'Medio',
  'difficulty.HARD': 'Difícil',
  'game.moves': 'Movimientos: {count}',
  'game.victoryTitle': '¡Escapaste!',
  'game.score': 'Puntos: {score}',
  'game.newBest': '¡Nuevo récord!',
  'game.next': 'Siguiente nivel',
  'game.defeatTitle': 'Sin vidas',
  'game.retry': 'Reintentar',
  'settings.languageShort': 'ES',
  'settings.soundOn': '🔊 Sonido',
  'settings.soundOff': '🔇 Silencio',
};

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = { en, es };

export type TranslationParams = Record<string, string | number>;

/**
 * Pure translation function: looks up a key for a language and interpolates
 * `{placeholders}`. Falls back to the key itself if it is missing, so a missing
 * translation is visible but never crashes. Framework-free, so it is unit-tested
 * in isolation.
 */
export function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = TRANSLATIONS[language][key] ?? key;
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
