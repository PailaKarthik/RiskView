import { View, Text, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthRestore } from '@/hooks/useAuthRestore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function SplashIndex() {
  const router = useRouter();
  const authState = useSelector((state) => state?.auth || {});
  const { token } = authState;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Restore auth on app launch
  useAuthRestore();
  usePushNotifications();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // If auth restored and token exists, go to home
      if (token) {
        router.replace('/(tabs)');
        return;
      }

      // Otherwise check if intro was seen
      try {
        const introSeen = await AsyncStorage.getItem('introSeen');
        if (introSeen === 'true') {
          router.replace('/auth/login');
        } else {
          router.replace('/intro');
        }
      } catch {
        router.replace('/intro');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [token, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#9333ea', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
          zIndex: 10,
        }}>
        <View style={{ marginBottom: 24, width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="shield-checkmark" size={56} color="white" />
        </View>
        <Text style={{ fontSize: 42, fontWeight: '900', color: 'white', marginBottom: 12 }}>
          RiskView
        </Text>
        <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 32 }}>
          Your Intelligent Travel Safety Companion
        </Text>
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim, position: 'absolute', bottom: 48 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 8, height: 8, backgroundColor: 'white', borderRadius: 4 }} />
          <View style={{ width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
          <View style={{ width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
        </View>
      </Animated.View>
    </View>
  );
}
