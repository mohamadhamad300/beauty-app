import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Scan, Video, Palette, Wifi } from 'lucide-react-native';
import { colors } from '../constants/theme';
import { AuthProvider } from '../contexts/AuthContext';
import AuthMenu from '../components/AuthMenu';
import HomeScreen from '../screens/HomeScreen';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import VideoScannerScreen from '../screens/VideoScannerScreen';
import ARMakeupScreen from '../screens/ARMakeupScreen';
import ARStreamScreen from '../screens/ARStreamScreen';
import ProductMatchScreen from '../screens/ProductMatchScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import SignInScreen from '../screens/SignInScreen';
import RegisterScreen from '../screens/RegisterScreen';
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
        name="ARStreamTab"
        component={ARStreamScreen}
        options={{
          tabBarLabel: 'AR Stream',
          tabBarIcon: ({ color, size }) => <Wifi color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MainLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AuthMenu />
      <TabNavigator />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={MainLayout} />
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
          <Stack.Screen
            name="ARStream"
            component={ARStreamScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
