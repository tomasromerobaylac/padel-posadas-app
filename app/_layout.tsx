import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!firebaseUser && !inAuthGroup) {
      router.replace('/login');
    } else if (firebaseUser && !appUser && segments[0] !== 'profile-setup') {
      router.replace('/profile-setup');
    } else if (firebaseUser && appUser && (inAuthGroup || segments[0] === 'profile-setup')) {
      router.replace('/');
    }
  }, [firebaseUser, appUser, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
