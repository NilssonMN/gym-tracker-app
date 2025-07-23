import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppInitialization } from '../src/hooks/useAppInitialization';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { useSettingsStore } from '../src/stores/useSettingsStore';

export default function RootLayout() {
  const { isLoading, initializationError } = useAppInitialization();
  const theme = useSettingsStore(state => state.theme);

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen error={initializationError} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme === 'dark' ? '#000000' : '#1f2937',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'light'} />
    </>
  );
} 