/** Central color and spacing tokens for the UI. */
export const theme = {
  colors: {
    background: '#0F1226',
    surface: '#1B1F3B',
    surfaceAlt: '#252A52',
    primary: '#4F7CFF',
    primaryText: '#FFFFFF',
    text: '#F2F4FF',
    muted: '#9AA0C7',
    arrow: '#6FE3C4',
    wall: '#3A3F63',
    exit: '#FFD166',
    danger: '#FF6B6B',
    success: '#6FE3C4',
    locked: '#3A3F63',
  },
  radius: 12,
  spacing: (n: number) => n * 8,
} as const;

export const difficultyColor: Record<string, string> = {
  EASY: '#6FE3C4',
  MEDIUM: '#FFD166',
  HARD: '#FF6B6B',
};
