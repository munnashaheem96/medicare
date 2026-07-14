import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../services/auth';
import { DataProvider } from '../services/data';
import 'react-native-reanimated';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit: Outfit_400Regular,
    OutfitMedium: Outfit_500Medium,
    OutfitSemiBold: Outfit_600SemiBold,
    OutfitBold: Outfit_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <RootLayoutNav />
      </DataProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';

    if (!user && !inLogin) {
      // Redirect to the login screen if they are not signed in and not already on the login page
      router.replace('/login');
    } else if (user && inLogin) {
      // Redirect to the tabs group if they are signed in and currently on the login page
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="medicine-detail" options={{ 
        headerShown: true, 
        title: 'Prescription Details',
        headerTitleStyle: { fontFamily: 'OutfitBold', color: '#0F172A', fontSize: 18 },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTintColor: '#0EA5E9'
      }} />
      <Stack.Screen name="reminder-overlay" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}
