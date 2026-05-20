import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SearchScreen } from '../screens/SearchScreen';
import { GraphScreen } from '../screens/GraphScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';

export type RootStackParamList = {
  Tabs: undefined;
  Graph: { word: string };
};

export type TabParamList = {
  Search: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textDisabled,
      }}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌂</Text>, tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☆</Text>, tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙</Text>, tabBarLabel: '' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Graph" component={GraphScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
