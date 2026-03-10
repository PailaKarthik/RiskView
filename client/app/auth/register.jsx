import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '@/redux/slices/authSlice';

export default function RegisterScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const authState = useSelector((state) => state?.auth || {});
  const { loading, error } = authState;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleRegister = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const result = await dispatch(registerUser({ fullName: name, email, language, password }));

    if (registerUser.fulfilled.match(result)) {
      // Show success and navigate
      setTimeout(() => {
        router.replace('/auth/login');
      }, 500);
    } else if (registerUser.rejected.match(result)) {
      setFormErrors({ submit: result.payload });
    }
  };

  const inputClass = "bg-gray-100 rounded-lg px-4 py-3 flex-row items-center";
  const labelClass = "text-gray-900 font-semibold mb-2";
  const textInputClass = "flex-1 ml-3 text-gray-900";
  const errorClass = "text-red-600 text-xs mt-1";

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-white to-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="px-6 pt-4">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 mb-8">
          <Ionicons name="chevron-back" size={28} color="#A855F7" />
          <Text className="text-purple-600 font-outfit-semibold text-base">Back</Text>
        </Pressable>
        <Text className="text-4xl font-bold text-gray-900 mb-3 font-outfit-bold">
          Create Account
        </Text>
        <Text className="text-gray-600 text-base font-outfit-regular">Join millions of safe travelers</Text>
      </View>

      {/* Error */}
      {error && (
        <View className="mx-6 mt-6 p-4 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
          <View className="flex-row gap-3 items-start">
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text className="text-red-700 text-sm flex-1 font-outfit-semibold">{error}</Text>
          </View>
        </View>
      )}

      {/* Name */}
      <View className="mt-8 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Full Name</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="person" size={20} color="#A855F7" />
          <TextInput 
            value={name} 
            onChangeText={setName} 
            placeholder="Enter your full name" 
            placeholderTextColor="#D1D5DB" 
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg" 
            editable={!loading} 
          />
        </View>
        {formErrors.name && <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.name}</Text>}
      </View>

      {/* Email */}
      <View className="mt-6 px-6">
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
        {formErrors.email && <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.email}</Text>}
      </View>

      {/* Language */}
      <View className="mt-6 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Language</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="language" size={20} color="#A855F7" />
          <TextInput 
            value={language} 
            onChangeText={setLanguage} 
            placeholder="en" 
            placeholderTextColor="#D1D5DB" 
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg" 
            editable={!loading} 
          />
        </View>
        <Text className="text-gray-500 text-xs mt-2 font-outfit-light">e.g., en, es, fr, de, it</Text>
      </View>

      {/* Password */}
      <View className="mt-6 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Password</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="lock-closed" size={20} color="#A855F7" />
          <TextInput 
            value={password} 
            onChangeText={setPassword} 
            placeholder="enter password with min-8 characters" 
            placeholderTextColor="#D1D5DB" 
            secureTextEntry={!showPassword} 
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg" 
            editable={!loading} 
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
          </Pressable>
        </View>
        {formErrors.password && <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.password}</Text>}
      </View>

      {/* Confirm Password */}
      <View className="mt-6 px-6">
        <Text className="text-gray-900 font-semibold mb-3 text-sm font-outfit-semibold">Confirm Password</Text>
        <View className="bg-white rounded-2xl px-4 py-4 flex-row items-center border border-gray-200 shadow-sm">
          <Ionicons name="lock-closed" size={20} color="#A855F7" />
          <TextInput 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="enter the password again" 
            placeholderTextColor="#D1D5DB" 
            secureTextEntry={!showConfirm} 
            className="flex-1 ml-3 pl-3 text-gray-900 font-outfit-regular focus:outline-none p-1 rounded-lg" 
            editable={!loading} 
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
          </Pressable>
        </View>
        {formErrors.confirmPassword && <Text className="text-red-600 text-xs mt-2 font-outfit-regular">{formErrors.confirmPassword}</Text>}
      </View>

      

      {/* Register Button */}
      <View className="mt-10 px-6">
        <Pressable
          onPress={handleRegister}
          disabled={loading}
          className={`py-4 rounded-2xl items-center shadow-md active:shadow-sm ${
            loading ? 'bg-purple-500 opacity-70' : 'bg-gradient-to-r from-purple-600 to-purple-700'
          }`}
        >
          <Text className="text-white font-bold text-lg font-outfit-bold">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/login')} className="mt-6">
          <Text className="text-gray-600 text-center text-sm font-outfit-regular">
            Already have an account?{' '}
            <Text className="text-purple-600 font-outfit-semibold">Sign In</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
