import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ForceGraph, type ForceGraphHandle } from '../graph/ForceGraph';
import { WordDetail } from '../components/WordDetail';
import { useWordGraph } from '../hooks/useWordGraph';
import { useWordDetail } from '../hooks/useWordDetail';
import { useSettings } from '../hooks/useSettings';
import { toggleFavorite, isFavorited } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

type Props = NativeStackScreenProps<RootStackParamList, 'Graph'>;

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    backBtn: { padding: 4 },
    backText: { color: t.accent, fontSize: 22 },
    navWord: { color: t.textPrimary, fontSize: 18, fontWeight: 'bold' },
    navPos: { color: t.textSecondary, fontSize: 14 },
    graphArea: { flex: 1 },
    sheetBg: { backgroundColor: t.card },
    sheetHandle: { backgroundColor: t.accent },
    notFound: { color: t.textSecondary, fontSize: 15, textAlign: 'center', margin: 32 },
  });
}

export function GraphScreen({ route, navigation }: Props) {
  const { word: initialWord } = route.params;
  const [currentWord, setCurrentWord] = useState(initialWord);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(false);

  const graphRef = useRef<ForceGraphHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const { settings } = useSettings();
  const { graphData, loading: graphLoading } = useWordGraph(currentWord, settings);
  const { detail, loading: detailLoading } = useWordDetail(currentWord);
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  useEffect(() => {
    isFavorited(currentWord).then(setFavorited);
  }, [currentWord]);

  useEffect(() => {
    if (graphData) {
      graphRef.current?.loadGraph({ ...graphData, mode: settings.graphMode });
    }
  }, [graphData, settings.graphMode]);

  const handleNodeTap = useCallback((word: string) => {
    setHistoryStack((prev) => [...prev, currentWord]);
    setCurrentWord(word);
    sheetRef.current?.snapToIndex(0);
  }, [currentWord]);

  const handleBack = useCallback(() => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((s) => s.slice(0, -1));
      setCurrentWord(prev);
    } else {
      navigation.goBack();
    }
  }, [historyStack, navigation]);

  const handleToggleFavorite = useCallback(async () => {
    const isNowFavorited = await toggleFavorite(currentWord);
    setFavorited(isNowFavorited);
  }, [currentWord]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navWord}>{currentWord}</Text>
        {detail && <Text style={styles.navPos}>{detail.pos}</Text>}
      </View>

      <View style={styles.graphArea}>
        {graphLoading && (
          <ActivityIndicator style={StyleSheet.absoluteFill} color={t.accent} />
        )}
        <ForceGraph ref={graphRef} onNodeTap={handleNodeTap} />
      </View>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={['30%', '85%']}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView>
          {detail ? (
            <WordDetail
              detail={detail}
              isFavorited={favorited}
              onToggleFavorite={handleToggleFavorite}
              onWordPress={handleNodeTap}
            />
          ) : detailLoading ? (
            <ActivityIndicator style={{ margin: 32 }} color={t.accent} />
          ) : (
            <Text style={styles.notFound}>"{currentWord}" not found</Text>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
