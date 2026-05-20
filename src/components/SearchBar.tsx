import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, TextInput, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard,
} from 'react-native';
import { getDatabase } from '../db/database';
import { searchWords } from '../db/queries';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

const POS_LABEL: Record<string, string> = { n: 'n', v: 'v', a: 'adj', r: 'adv' };

interface Props {
  onSelectWord: (word: string) => void;
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { zIndex: 10 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.cardAlt, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    },
    icon: { fontSize: 16, marginRight: 8 },
    input: { flex: 1, color: t.textPrimary, fontSize: 16 },
    clear: { color: t.accent, fontSize: 16 },
    dropdown: {
      backgroundColor: t.card, borderRadius: 12, marginTop: 4,
      maxHeight: 280, borderWidth: 1, borderColor: t.border,
    },
    resultRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    lemma: { flex: 1, color: t.textPrimary, fontSize: 15 },
    posBadge: { backgroundColor: t.accentSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    posText: { color: t.accent, fontSize: 12 },
    separator: { height: 1, backgroundColor: t.border },
  });
}

export function SearchBar({ onSelectWord }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; lemma: string; pos: string }>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const db = await getDatabase();
        const rows = await searchWords(db, query.trim().toLowerCase(), 10);
        setResults(rows);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (word: string) => {
    setQuery('');
    setResults([]);
    Keyboard.dismiss();
    onSelectWord(word);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="搜索单词..."
          placeholderTextColor={t.textDisabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {results.length > 0 && (
        <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled">
          {results.map((item, idx) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item.lemma)}>
                <Text style={styles.lemma}>{item.lemma}</Text>
                <View style={styles.posBadge}>
                  <Text style={styles.posText}>{POS_LABEL[item.pos] ?? item.pos}</Text>
                </View>
              </TouchableOpacity>
              {idx < results.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
