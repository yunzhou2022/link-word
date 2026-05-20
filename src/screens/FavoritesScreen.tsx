import { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getFavorites, toggleFavorite } from '../storage/storage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const [favorites, setFavorites] = useState<string[]>([]);

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', padding: 16 },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 8 },
  wordBtn: { flex: 1 },
  word: { color: 'white', fontSize: 16 },
  removeBtn: { padding: 4 },
  removeText: { color: '#555', fontSize: 16 },
  separator: { height: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: '#555', fontSize: 14 },
});
