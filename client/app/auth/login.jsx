import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '@/redux/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state?.auth || {});
  const { loading, error } = authState;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleLogin = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      router.replace('/(tabs)');
    } else if (loginUser.rejected.match(result)) {
      Alert.alert('Login Failed', result.payload);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-white to-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-6 py-12">
        <View className="h-20 w-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl items-center justify-center self-center mb-8 shadow-lg">
          <Ionicons name="shield-checkmark" size={40} color="white" />
        </View>
        <Text className="text-4xl font-bold text-gray-900 text-center mb-2 font-outfit-bold">
          RiskView
        </Text>
        <Text className="text-gray-600 text-center text-base font-outfit-regular">
          Your intelligent travel risk companion
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-6 p-4 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
          <View className="flex-row gap-3 items-start">
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text className="text-red-700 text-sm flex-1 font-outfit-semibold">{error}</Text>
          </View>
        </View>
      )}

      {/* Email Input */}
      <View className="mt-8 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Email Address</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="mail" size={20} color="#A855F7" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#D1D5DB"
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg"
            editable={!loading}
          />
        </View>
        {formErrors.email && (
          <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.email}</Text>
        )}
      </View>

      {/* Password Input */}
      <View className="mt-6 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Password</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="lock-closed" size={20} color="#A855F7" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#D1D5DB"
            secureTextEntry={!showPassword}
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg"
            editable={!loading}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
          </Pressable>
        </View>
        {formErrors.password && (
          <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.password}</Text>
        )}
      </View>

      {/* Login Button */}
      <View className="mt-10 px-6">
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className={`py-4 rounded-2xl items-center shadow-md active:shadow-sm ${
            loading ? 'bg-purple-500 opacity-70' : 'bg-gradient-to-r from-purple-600 to-purple-700'
          }`}>
          <Text className="text-white font-bold text-lg font-outfit-bold">
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </Pressable>
      </View>

      {/* Register Link */}
      <View className="mt-8 flex-row justify-center">
        <Text className="text-gray-600 font-outfit-regular">Don't have an account? </Text>
        <Pressable onPress={() => router.push('/auth/register')}>
          <Text className="text-purple-600 font-outfit-semibold">Create one</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
