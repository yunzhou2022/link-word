import { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getFavorites, toggleFavorite } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

function createStyles(t: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    title: { color: t.textPrimary, fontSize: 28, fontWeight: 'bold', padding: 16 },
    list: { paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.card, borderRadius: 12, padding: 14, marginBottom: 8 },
    wordBtn: { flex: 1 },
    word: { color: t.textPrimary, fontSize: 16 },
    removeBtn: { padding: 4 },
    removeText: { color: t.textDisabled, fontSize: 16 },
    separator: { height: 0 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: t.textSecondary, fontSize: 18, marginBottom: 8 },
    emptyHint: { color: t.textDisabled, fontSize: 14 },
  });
}

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const refresh = useCallback(async () => {
    setFavorites(await getFavorites());
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleRemove = useCallback(async (word: string) => {
    await toggleFavorite(word);
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>收藏夹</Text>
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无收藏</Text>
          <Text style={styles.emptyHint}>在图谱页点击 ☆ 收藏单词</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.wordBtn}
                onPress={() => navigation.navigate('Graph', { word: item })}
              >
                <Text style={styles.word}>{item}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}
