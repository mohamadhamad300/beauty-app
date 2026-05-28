import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Scan, Video, Palette, User } from 'lucide-react-native';
import { colors } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import VideoScannerScreen from '../screens/VideoScannerScreen';
import ARMakeupScreen from '../screens/ARMakeupScreen';
import ProductMatchScreen from '../screens/ProductMatchScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import type { RootStackParamList, TabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.background,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 64 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: 'System',
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={SkinAnalysisScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => <Scan color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="VideoTab"
        component={VideoScannerScreen}
        options={{
          tabBarLabel: 'Video',
          tabBarIcon: ({ color, size }) => <Video color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ARTab"
        component={ARMakeupScreen}
        options={{
          tabBarLabel: 'AR Makeup',
          tabBarIcon: ({ color, size }) => <Palette color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen
          name="SkinAnalysis"
          component={SkinAnalysisScreen}
          options={{
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProductMatch"
          component={ProductMatchScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ScanHistory"
          component={ScanHistoryScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="VideoScanner"
          component={VideoScannerScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ARMakeup"
          component={ARMakeupScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
