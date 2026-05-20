import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import type { WordDetailData } from '../db/types';

const POS_LABEL: Record<string, string> = { n: 'noun', v: 'verb', a: 'adj', r: 'adv' };

interface Props {
  detail: WordDetailData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function WordDetail({ detail, isFavorited, onToggleFavorite }: Props) {
  const [senseIdx, setSenseIdx] = useState(0);

  const speak = useCallback(() => {
    Speech.speak(detail.lemma, { language: 'en-US', rate: 0.9 });
  }, [detail.lemma]);

  const sense = detail.senses[senseIdx];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={styles.lemmaGroup}>
          <Text style={styles.lemma}>{detail.lemma}</Text>
          <Text style={styles.pos}>{POS_LABEL[detail.pos] ?? detail.pos}</Text>
          {detail.phonetic ? <Text style={styles.phonetic}>/{detail.phonetic}/</Text> : null}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={speak} style={styles.iconBtn}>
            <Text style={styles.iconText}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.iconBtn}>
            <Text style={styles.iconText}>{isFavorited ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {detail.senses.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.senseTabs}>
          {detail.senses.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSenseIdx(i)}
              style={[styles.senseTab, senseIdx === i && styles.senseTabActive]}
            >
              <Text style={[styles.senseTabText, senseIdx === i && styles.senseTabTextActive]}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {sense && (
        <>
          <Text style={styles.definition}>{sense.definition}</Text>
          {sense.examples.map((ex, i) => (
            <View key={i} style={styles.exampleBox}>
              <Text style={styles.exampleText}>"{ex}"</Text>
            </View>
          ))}
        </>
      )}

      {detail.wordFamily.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>词族</Text>
          <View style={styles.tagRow}>
            {detail.wordFamily.map((w, i) => (
              <View key={i} style={styles.familyTag}>
                <Text style={styles.familyText}>{w.lemma}</Text>
                <Text style={styles.familyPos}> {POS_LABEL[w.pos] ?? w.pos}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {detail.collocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>搭配句型</Text>
          {detail.collocations.map((c, i) => (
            <Text key={i} style={styles.collocation}>• {c}</Text>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  lemmaGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  lemma: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  pos: { color: '#888', fontSize: 14 },
  phonetic: { color: '#6c63ff', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 20 },
  senseTabs: { flexDirection: 'row', marginBottom: 10 },
  senseTab: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0f3460',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  senseTabActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  senseTabText: { color: '#888', fontSize: 14 },
  senseTabTextActive: { color: 'white' },
  definition: { color: '#ddd', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  exampleBox: { backgroundColor: '#0f3460', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6c63ff' },
  exampleText: { color: '#aaa', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  familyTag: { flexDirection: 'row', backgroundColor: '#fa709a22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  familyText: { color: '#fa709a', fontSize: 13 },
  familyPos: { color: '#fa709a88', fontSize: 11 },
  collocation: { color: '#aaa', fontSize: 13, lineHeight: 22 },
});
