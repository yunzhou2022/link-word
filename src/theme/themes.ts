export interface Theme {
  id: string;
  label: string;
  // 背景层次
  bg: string;       // 主背景
  card: string;     // 卡片/次级背景
  cardAlt: string;  // 输入框/高亮区
  border: string;   // 分割线/边框
  // 文字
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  // 强调色
  accent: string;
  accentSoft: string;  // accent + 透明度
  // 图谱背景（保持深色保证节点可读性）
  graphBg: string;
  // 状态栏
  statusBar: 'dark-content' | 'light-content';
  // 色板预览色
  swatch: string;
}

export const THEMES: Record<string, Theme> = {
  'dark-purple': {
    id: 'dark-purple', label: '深紫', swatch: '#6c63ff',
    bg: '#0f0f1a', card: '#16213e', cardAlt: '#0f3460', border: '#0f3460',
    textPrimary: '#ffffff', textSecondary: '#aaaaaa', textDisabled: '#555555',
    accent: '#6c63ff', accentSoft: '#6c63ff22',
    graphBg: '#0f0f1a', statusBar: 'light-content',
  },
  'midnight-blue': {
    id: 'midnight-blue', label: '午夜蓝', swatch: '#3b82f6',
    bg: '#02060f', card: '#0d1526', cardAlt: '#0f1f3d', border: '#1a2f5a',
    textPrimary: '#e2e8f0', textSecondary: '#94a3b8', textDisabled: '#475569',
    accent: '#3b82f6', accentSoft: '#3b82f622',
    graphBg: '#02060f', statusBar: 'light-content',
  },
  'forest': {
    id: 'forest', label: '翠林', swatch: '#10b981',
    bg: '#071208', card: '#0d1f0e', cardAlt: '#122a14', border: '#1a3a1c',
    textPrimary: '#ecfdf5', textSecondary: '#86efac', textDisabled: '#4ade8066',
    accent: '#10b981', accentSoft: '#10b98122',
    graphBg: '#071208', statusBar: 'light-content',
  },
  'sunset': {
    id: 'sunset', label: '暖阳', swatch: '#f97316',
    bg: '#130a02', card: '#1f1205', cardAlt: '#2a1a08', border: '#3a2a10',
    textPrimary: '#fff7ed', textSecondary: '#fdba74', textDisabled: '#7c4f1a',
    accent: '#f97316', accentSoft: '#f9731622',
    graphBg: '#130a02', statusBar: 'light-content',
  },
  'light': {
    id: 'light', label: '浅色', swatch: '#ffffff',
    bg: '#f8fafc', card: '#ffffff', cardAlt: '#f1f5f9', border: '#e2e8f0',
    textPrimary: '#0f172a', textSecondary: '#475569', textDisabled: '#94a3b8',
    accent: '#6c63ff', accentSoft: '#6c63ff15',
    graphBg: '#f1f5f9', statusBar: 'dark-content',
  },
};

export const DEFAULT_THEME_ID = 'dark-purple';
