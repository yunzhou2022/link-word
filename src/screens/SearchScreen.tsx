import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SearchBar } from '../components/SearchBar';
import { getHistory, addToHistory, getFavorites } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

function createStyles(t: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    scroll: { flex: 1, padding: 16 },
    title: { color: t.textPrimary, fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
    section: { marginTop: 24 },
    sectionTitle: { color: t.textSecondary, fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    histTag: { backgroundColor: t.cardAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    histText: { color: t.accent, fontSize: 14 },
    favRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    favText: { flex: 1, color: t.textPrimary, fontSize: 15 },
    star: { color: '#f7971e', fontSize: 16 },
  });
}

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const refresh = useCallback(async () => {
    setHistory(await getHistory());
    setFavorites((await getFavorites()).slice(0, 5));
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const navigateToWord = useCallback(
    async (word: string) => {
      await addToHistory(word);
      navigation.navigate('Graph', { word });
      refresh();
    },
    [navigation, refresh],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>WordNet</Text>
        <SearchBar onSelectWord={navigateToWord} />

        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近搜索</Text>
            <View style={styles.tagRow}>
              {history.slice(0, 8).map((w) => (
                <TouchableOpacity key={w} style={styles.histTag} onPress={() => navigateToWord(w)}>
                  <Text style={styles.histText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>收藏夹</Text>
            {favorites.map((w) => (
              <TouchableOpacity key={w} style={styles.favRow} onPress={() => navigateToWord(w)}>
                <Text style={styles.favText}>{w}</Text>
                <Text style={styles.star}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
