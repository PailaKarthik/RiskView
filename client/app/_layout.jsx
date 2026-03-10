import '../global.css';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { Slot } from 'expo-router';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

import store from '@/redux/store';
import { injectStore } from '@/api/axiosClient';

injectStore(store);

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Outfit_Light': Outfit_300Light,
    'Outfit_Regular': Outfit_400Regular,
    'Outfit_Medium': Outfit_500Medium,
    'Outfit_SemiBold': Outfit_600SemiBold,
    'Outfit_Bold': Outfit_700Bold,
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
    <Provider store={store}>
      <Slot />
    </Provider>
  );
}
