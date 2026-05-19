import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const RELATION_COLORS: Record<string, string> = {
  center: '#6c63ff',
  synonym: '#6c63ff',
  hypernym: '#f7971e',
  hyponym: '#f7971e',
  antonym: '#43e97b',
  similar: '#4fc3f7',
  derivation: '#fa709a',
  meronym: '#a78bfa',
  holonym: '#a78bfa',
  default: '#888',
};

interface Props {
  label: string;
  type?: string;
  onPress?: () => void;
}

export function RelationTag({ label, type = 'default', onPress }: Props) {
  const color = RELATION_COLORS[type] ?? RELATION_COLORS.default;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tag, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  text: { fontSize: 13, fontWeight: '500' },
});
