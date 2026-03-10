import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ICON_COLORS = { purple: '#A855F7', blue: '#3B82F6', green: '#22C55E' };

function IntroSlide({ icon, title, description, iconColor }) {
  const bgColorClass = {
    purple: 'bg-purple-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
  }[iconColor];

  const iconColorValue = ICON_COLORS[iconColor];

  return (
    <View className="items-center px-8">
      <View className={`${bgColorClass} w-32 h-32 rounded-full items-center justify-center mb-8`}>
        <Ionicons name={icon} size={56} color={iconColorValue} />
      </View>
      <Text className="text-2xl font-bold text-center mb-4 text-gray-900">
        {title}
      </Text>
      <Text className="text-base text-center text-gray-600 leading-6">
        {description}
      </Text>
    </View>
  );
}

export default function IntroScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const SLIDES = [
    {
      icon: 'shield-checkmark',
      title: 'Stay Safe While Traveling',
      description: 'RiskView helps travelers discover nearby scam reports and danger alerts in real-time.',
      iconColor: 'purple',
    },
    {
      icon: 'people',
      title: 'Community Powered Safety',
      description: 'Travelers can report scams and unsafe places to help others stay informed and protected.',
      iconColor: 'blue',
    },
    {
      icon: 'sparkles',
      title: 'Smart Safety Insights',
      description: 'AI summarizes nearby reports and answers safety questions for your location.',
      iconColor: 'green',
    },
  ];

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const finishIntro = async () => {
    try {
      setIsNavigating(true);
      await AsyncStorage.setItem('introSeen', 'true');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error saving intro status:', error);
      setIsNavigating(false);
    }
  };

  const handleDotPress = (index) => {
    setCurrentSlide(index);
  };

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const currentSlideData = SLIDES[currentSlide];

  return (
    <View className="flex-1 bg-purple-50">
      {/* Header with Skip */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-end">
        {!isLastSlide && (
          <Pressable onPress={finishIntro} disabled={isNavigating} className="active:opacity-70 py-2 px-4">
            <Text className="text-purple-600 font-semibold text-base">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Main Content - Slide */}
      <View className="flex-1 justify-center px-4 py-12">
        <IntroSlide
          icon={currentSlideData.icon}
          title={currentSlideData.title}
          description={currentSlideData.description}
          iconColor={currentSlideData.iconColor}
        />
      </View>

      {/* Footer - Dots, Counter, Buttons */}
      <View className="px-6 pb-12 gap-6">
        {/* Progress Dots */}
        <View className="flex-row justify-center items-center gap-2">
          {SLIDES.map((_, index) => (
            <Pressable 
              key={index} 
              onPress={() => handleDotPress(index)} 
              className="active:opacity-70"
            >
              <View
                className={`h-2 rounded-full ${
                  index === currentSlide 
                    ? 'w-8 bg-purple-600' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            </Pressable>
          ))}
        </View>

        {/* Slide Counter */}
        <Text className="text-center text-gray-600 text-xs font-semibold">
          {currentSlide + 1} OF {SLIDES.length}
        </Text>

        {/* Buttons - Responsive Layout */}
        {!isLastSlide ? (
          <View className="flex-row gap-3">
            {currentSlide > 0 && (
              <Pressable
                onPress={handlePrevious}
                disabled={isNavigating}
                className="py-3 px-4 rounded-lg border-2 border-purple-300 active:bg-purple-100">
                <Ionicons name="chevron-back" size={24} color="#A855F7" />
              </Pressable>
            )}
            
            <Pressable
              onPress={handleNext}
              disabled={isNavigating}
              className="flex-1 py-3 px-4 rounded-lg bg-purple-600 active:bg-purple-700">
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-white font-bold">Next</Text>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={finishIntro}
            disabled={isNavigating}
            className="w-full py-4 px-6 rounded-lg bg-purple-600 active:bg-purple-700">
            <View className="flex-row items-center justify-center gap-3">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg">Get Started</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
