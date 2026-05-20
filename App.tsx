import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { DatabaseLoader } from './src/components/DatabaseLoader';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseLoader>
          <AppNavigator />
        </DatabaseLoader>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
