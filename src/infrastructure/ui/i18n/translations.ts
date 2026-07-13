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
  'game.levelNumber': 'Level {id}',
  'game.allCompleted': '🎉 You beat every level — a true maze master!',
  'settings.languageShort': 'EN',
  'settings.effectsOn': '🔊 Effects',
  'settings.effectsOff': '🔇 Effects',
  'settings.musicOn': '🎵 Music',
  'settings.musicOff': '🔇 Music',
  'login.signIn': 'Sign in',
  'login.title': 'Sign in / Register',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.loginBtn': 'Sign in',
  'login.registerBtn': 'Create account',
  'login.signOut': 'Sign out',
  'login.signedInAs': 'Signed in as {username}',
  'login.errorInvalid': 'Invalid username or password.',
  'login.errorTaken': 'That username is already taken.',
  'login.errorNetwork': 'Could not reach the server. Is the backend running?',
  'login.errorValidation': 'Username must be 3-20 characters and the password at least 6.',
  'leaderboard.open': '🏆 Leaderboard',
  'leaderboard.title': 'Leaderboard — Level {level}',
  'leaderboard.empty': 'No scores yet. Be the first!',
  'leaderboard.error': 'Could not load the leaderboard (server offline?).',
  'leaderboard.signInRequired': 'Sign in to see the global leaderboard.',
  'leaderboard.titleTotal': 'Leaderboard — Total',
  'leaderboard.tabLevel': 'Level {level}',
  'leaderboard.tabTotal': 'Total',
  'leaderboard.levelsPlayed': '{count} levels',
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
  'game.levelNumber': 'Nivel {id}',
  'game.allCompleted': '🎉 ¡Completaste todos los niveles — leyenda del laberinto!',
  'settings.languageShort': 'ES',
  'settings.effectsOn': '🔊 Efectos',
  'settings.effectsOff': '🔇 Efectos',
  'settings.musicOn': '🎵 Música',
  'settings.musicOff': '🔇 Música',
  'login.signIn': 'Entrar',
  'login.title': 'Entrar / Registrarse',
  'login.username': 'Usuario',
  'login.password': 'Contraseña',
  'login.loginBtn': 'Entrar',
  'login.registerBtn': 'Crear cuenta',
  'login.signOut': 'Cerrar sesión',
  'login.signedInAs': 'Conectado como {username}',
  'login.errorInvalid': 'Usuario o contraseña incorrectos.',
  'login.errorTaken': 'Ese usuario ya está en uso.',
  'login.errorNetwork': 'No se pudo conectar con el servidor. ¿Está corriendo el backend?',
  'login.errorValidation': 'El usuario debe tener 3-20 caracteres y la contraseña al menos 6.',
  'leaderboard.open': '🏆 Clasificación',
  'leaderboard.title': 'Clasificación — Nivel {level}',
  'leaderboard.empty': 'Aún no hay puntajes. ¡Sé el primero!',
  'leaderboard.error': 'No se pudo cargar la clasificación (¿servidor apagado?).',
  'leaderboard.signInRequired': 'Inicia sesión para ver la clasificación global.',
  'leaderboard.titleTotal': 'Clasificación — Total',
  'leaderboard.tabLevel': 'Nivel {level}',
  'leaderboard.tabTotal': 'Total',
  'leaderboard.levelsPlayed': '{count} niveles',
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
