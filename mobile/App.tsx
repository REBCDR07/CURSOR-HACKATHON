import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { BlackOpsOne_400Regular } from '@expo-google-fonts/black-ops-one';
import { Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureNotifications } from './src/lib/notifications';
import { applyGlobalTypographyDefaults } from './src/theme/fonts';
import { LoadingScreen } from './src/components/LoadingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    BlackOpsOne_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalTypographyDefaults();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen label="Chargement des ressources..." />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
