import "global.css"
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getUnreadCount } from '@/redux/slices/notificationSlice';

export default function TabLayout() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state?.auth || {});
  const { token } = authState;
  const { unreadCount } = useSelector((state) => state?.notification || { unreadCount: 0 });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
    }
  }, [token, router]);

  // Fetch unread count on mount
  useEffect(() => {
    if (token) {
      dispatch(getUnreadCount());
      
      // Refresh unread count every 10 seconds to stay in sync
      const interval = setInterval(() => {
        dispatch(getUnreadCount());
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [token, dispatch]);

  // Setup push notifications for authenticated users
  usePushNotifications();

  if (!token) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 70,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
          fontFamily: 'Outfit_SemiBold',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications" size={size} color={color} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: -4,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize:9,
                      fontWeight: 'bold',
                      fontFamily: 'Outfit_Bold',
                    }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
