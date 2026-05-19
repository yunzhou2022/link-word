import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Graph'>;

export function GraphScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Graph: {route.params.word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontSize: 18 },
});
