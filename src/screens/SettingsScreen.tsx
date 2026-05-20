import { useMemo } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useSettings } from '../hooks/useSettings';
import { clearHistory } from '../storage/storage';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

function createStyles(t: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },
    title: { color: t.textPrimary, fontSize: 28, fontWeight: 'bold', padding: 16 },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionLabel: { color: t.textDisabled, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    card: { backgroundColor: t.card, borderRadius: 14, padding: 14 },
    modeRow: { flexDirection: 'row', gap: 12 },
    modeBtn: { flex: 1, backgroundColor: t.card, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
    modeBtnActive: { backgroundColor: t.accent },
    modeIcon: { fontSize: 22 },
    modeText: { color: t.textSecondary, fontSize: 13 },
    modeTextActive: { color: t.textPrimary, fontWeight: 'bold' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    rowLabel: { color: t.textPrimary, fontSize: 15 },
    rowValue: { color: t.accent, fontSize: 15 },
  });
}

export function SettingsScreen() {
  const { settings, update } = useSettings();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  const handleClearHistory = () => {
    Alert.alert('清除历史', '确认清空所有搜索历史？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <Text style={styles.title}>设置</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>图谱模式</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, settings.graphMode === 'force' && styles.modeBtnActive]}
              onPress={() => update({ graphMode: 'force' })}
            >
              <Text style={styles.modeIcon}>◉</Text>
              <Text style={[styles.modeText, settings.graphMode === 'force' && styles.modeTextActive]}>力导向</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, settings.graphMode === 'tree' && styles.modeBtnActive]}
              onPress={() => update({ graphMode: 'tree' })}
            >
              <Text style={styles.modeIcon}>🌿</Text>
              <Text style={[styles.modeText, settings.graphMode === 'tree' && styles.modeTextActive]}>层级树</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>外观</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>节点数量上限</Text>
              <Text style={styles.rowValue}>{settings.nodeLimit}</Text>
            </View>
            <Slider
              minimumValue={10}
              maximumValue={50}
              step={5}
              value={settings.nodeLimit}
              onSlidingComplete={(v) => update({ nodeLimit: v })}
              minimumTrackTintColor={t.accent}
              maximumTrackTintColor={t.border}
              thumbTintColor={t.accent}
            />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>深色模式</Text>
              <Switch
                value={settings.darkMode}
                onValueChange={(v) => update({ darkMode: v })}
                trackColor={{ true: t.accent }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>数据</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>WordNet 版本</Text>
              <Text style={styles.rowValue}>3.1</Text>
            </View>
            <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
              <Text style={[styles.rowLabel, { color: '#fa709a' }]}>清除搜索历史</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
