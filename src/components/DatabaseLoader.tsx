import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

const STATUS_TEXT: Record<string, string> = {
  checking:    '正在检查本地缓存...',
  downloading: '正在下载词库数据',
  extracting:  '正在解析词库，请稍候...',
  ready:       '加载完成',
  error:       '加载失败',
};

interface Props {
  children: React.ReactNode;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      width: '100%',
      maxWidth: 400,
      gap: 12,
    },
    icon: { fontSize: 48 },
    title: { color: t.textPrimary, fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: t.textSecondary, fontSize: 15, textAlign: 'center' },
    barBg: {
      width: '100%',
      height: 8,
      backgroundColor: t.cardAlt,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 8,
    },
    barFill: {
      height: '100%',
      backgroundColor: t.accent,
      borderRadius: 4,
    },
    progressText: { color: t.textSecondary, fontSize: 14 },
    pct: { color: t.accent, fontWeight: 'bold' },
    hint: { color: t.textDisabled, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  });
}

export function DatabaseLoader({ children }: Props) {
  const { ready, status, progress, loadedMB, totalMB, error } = useDatabase();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  if (ready) return <>{children}</>;

  const pct = Math.round(progress);
  const isDownloading = status === 'downloading';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 图标 */}
        <Text style={styles.icon}>📖</Text>
        <Text style={styles.title}>LinkWord</Text>
        <Text style={styles.subtitle}>
          {status === 'error' ? error : STATUS_TEXT[status] ?? '加载中...'}
        </Text>

        {/* 进度条 */}
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` as `${number}%` }]} />
        </View>

        {/* 进度数字 */}
        {isDownloading && (
          <Text style={styles.progressText}>
            {loadedMB.toFixed(1)} MB / {totalMB > 0 ? `${totalMB.toFixed(0)} MB` : '...'}
            {'  '}
            <Text style={styles.pct}>{pct}%</Text>
          </Text>
        )}

        {/* 首次提示 */}
        {isDownloading && (
          <Text style={styles.hint}>
            首次使用需下载约 74 MB 词库{'\n'}下载后永久缓存，无需重复下载
          </Text>
        )}
      </View>
    </View>
  );
}
