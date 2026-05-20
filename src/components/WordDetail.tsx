import { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import type { WordDetailData } from '../db/types';
import { translateToZh } from '../utils/translate';

const POS_LABEL: Record<string, string> = { n: 'noun', v: 'verb', a: 'adj', r: 'adv' };

interface TranslationState {
  definition: string;
  examples: string[];
  loading: boolean;
}

interface Props {
  detail: WordDetailData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function WordDetail({ detail, isFavorited, onToggleFavorite }: Props) {
  const [senseIdx, setSenseIdx] = useState(0);
  const [translation, setTranslation] = useState<TranslationState>({ definition: '', examples: [], loading: false });

  const sense = detail.senses[senseIdx];

  useEffect(() => {
    setSenseIdx(0);
  }, [detail.lemma]);

  useEffect(() => {
    if (!sense) return;
    setTranslation({ definition: '', examples: [], loading: true });

    const texts = [sense.definition, ...sense.examples];
    Promise.all(texts.map(translateToZh)).then(([def, ...exs]) => {
      setTranslation({ definition: def, examples: exs, loading: false });
    });
  }, [sense?.synsetId]);

  const speak = useCallback(() => {
    Speech.speak(detail.lemma, { language: 'en-US', rate: 0.9 });
  }, [detail.lemma]);

  return (
    <View style={styles.container}>
      {/* 词头行 */}
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

      {/* 词义切换标签 */}
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

      {/* 定义 + 中文翻译 */}
      {sense && (
        <>
          <Text style={styles.definition}>{sense.definition}</Text>
          {translation.loading ? (
            <ActivityIndicator size="small" color="#6c63ff" style={{ marginBottom: 8, alignSelf: 'flex-start' }} />
          ) : translation.definition ? (
            <Text style={styles.definitionZh}>{translation.definition}</Text>
          ) : null}

          {/* 例句 + 中文翻译 */}
          {sense.examples.map((ex, i) => (
            <View key={i} style={styles.exampleBox}>
              <Text style={styles.exampleText}>"{ex}"</Text>
              {!translation.loading && translation.examples[i] ? (
                <Text style={styles.exampleZh}>{translation.examples[i]}</Text>
              ) : null}
            </View>
          ))}
        </>
      )}

      {/* 词族 */}
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

      {/* 搭配句型 */}
      {detail.collocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>搭配句型</Text>
          {detail.collocations.map((c, i) => (
            <Text key={i} style={styles.collocation}>• {c}</Text>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </View>
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
  definition: { color: '#ddd', fontSize: 15, lineHeight: 22, marginBottom: 4 },
  definitionZh: { color: '#6c63ff', fontSize: 14, lineHeight: 20, marginBottom: 10, opacity: 0.85 },
  exampleBox: { backgroundColor: '#0f3460', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6c63ff' },
  exampleText: { color: '#aaa', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  exampleZh: { color: '#6c63ff', fontSize: 12, lineHeight: 18, marginTop: 4, opacity: 0.8 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  familyTag: { flexDirection: 'row', backgroundColor: '#fa709a22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  familyText: { color: '#fa709a', fontSize: 13 },
  familyPos: { color: '#fa709a88', fontSize: 11 },
  collocation: { color: '#aaa', fontSize: 13, lineHeight: 22 },
});
