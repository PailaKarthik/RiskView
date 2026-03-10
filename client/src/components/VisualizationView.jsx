import { View, Text, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function VisualizationView({ reports, selectedLocation }) {
  // Compute distribution from actual reports
  const distribution = useMemo(() => {
    const list = reports || [];
    const scams = list.filter(
      (r) => r.category?.toLowerCase().includes('scam') || r.category?.toLowerCase().includes('fraud')
    ).length;
    const dangers = list.filter(
      (r) =>
        r.category?.toLowerCase().includes('danger') ||
        r.category?.toLowerCase().includes('robbery') ||
        r.category?.toLowerCase().includes('theft') ||
        r.category?.toLowerCase().includes('assault')
    ).length;
    const other = list.length - scams - dangers;
    const total = list.length || 1; // avoid division by zero
    return { scams, dangers, other, total: list.length };
  }, [reports]);

  const scamPct = distribution.total > 0 ? Math.round((distribution.scams / distribution.total) * 100) : 0;
  const dangerPct = distribution.total > 0 ? Math.round((distribution.dangers / distribution.total) * 100) : 0;
  const otherPct = 100 - scamPct - dangerPct;

  const insights = [
    {
      icon: 'alert-circle',
      title: 'Most Common Issue',
      description:
        distribution.scams >= distribution.dangers
          ? 'Scam alerts are the most frequently reported'
          : 'Danger alerts are the most frequently reported',
    },
    {
      icon: 'time',
      title: 'Peak Incident Time',
      description: 'Night hours (8 PM - 2 AM) see the most reports',
    },
  ];

  const suggestions = [
    'Be cautious during night hours',
    'Avoid unregistered taxis',
    'Keep valuables secure in crowded areas',
    'Verify prices before making purchases',
    'Share your location with trusted contacts',
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 py-4" showsVerticalScrollIndicator={false}>
      {/* Selected Location Header */}
      {selectedLocation && (
        <View className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-200">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="location" size={16} color="#A855F7" />
            <Text className="font-outfit-bold text-sm text-purple-900">{selectedLocation.name}</Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-xs text-purple-700 font-outfit-regular">
              Lat: {selectedLocation.latitude.toFixed(4)}
            </Text>
            <Text className="text-xs text-purple-700 font-outfit-regular">
              Lng: {selectedLocation.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
      )}

      {/* ─── Chart ─── */}
      <View
        className="bg-white rounded-2xl p-6"
        style={{ borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text className="font-outfit-semibold text-gray-900 mb-5">Report Distribution</Text>

        {distribution.total === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="pie-chart-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 font-outfit-regular text-sm mt-3">No report data available</Text>
          </View>
        ) : (
          <>
            {/* Simple visual pie representation */}
            <View className="items-center mb-6">
              <View className="w-40 h-40 rounded-full overflow-hidden relative" style={{ backgroundColor: '#E5E7EB' }}>
                {/* Scam segment (orange) */}
                {scamPct > 0 && (
                  <View
                    className="absolute"
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#F97316',
                      transform: [{ scale: 1 }],
                    }}
                  />
                )}
                {/* Danger segment (red) overlay */}
                {dangerPct > 0 && (
                  <View
                    className="absolute"
                    style={{
                      width: '100%',
                      height: `${dangerPct + otherPct}%`,
                      backgroundColor: '#EF4444',
                      bottom: 0,
                    }}
                  />
                )}
                {/* Other segment overlay */}
                {otherPct > 0 && (
                  <View
                    className="absolute"
                    style={{
                      width: '100%',
                      height: `${otherPct}%`,
                      backgroundColor: '#8B5CF6',
                      bottom: 0,
                    }}
                  />
                )}
                {/* Center circle for donut effect */}
                <View
                  className="absolute bg-white rounded-full items-center justify-center"
                  style={{ top: 30, left: 30, width: 100, height: 100 }}>
                  <Text className="font-outfit-bold text-2xl text-gray-900">{distribution.total}</Text>
                  <Text className="font-outfit-regular text-xs text-gray-500">Reports</Text>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View className="flex-row justify-center gap-5">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#F97316' }} />
                <Text className="font-outfit-medium text-sm text-gray-600">Scams {scamPct}%</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#EF4444' }} />
                <Text className="font-outfit-medium text-sm text-gray-600">Dangers {dangerPct}%</Text>
              </View>
              {otherPct > 0 && (
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: '#8B5CF6' }} />
                  <Text className="font-outfit-medium text-sm text-gray-600">Other {otherPct}%</Text>
                </View>
              )}
            </View>

            {/* Bar representation */}
            <View className="mt-5">
              <View className="flex-row rounded-full overflow-hidden h-4" style={{ backgroundColor: '#E5E7EB' }}>
                {scamPct > 0 && (
                  <View style={{ width: `${scamPct}%`, backgroundColor: '#F97316' }} className="h-full" />
                )}
                {dangerPct > 0 && (
                  <View style={{ width: `${dangerPct}%`, backgroundColor: '#EF4444' }} className="h-full" />
                )}
                {otherPct > 0 && (
                  <View style={{ width: `${otherPct}%`, backgroundColor: '#8B5CF6' }} className="h-full" />
                )}
              </View>
            </View>

            {/* Stats row */}
            <View className="flex-row mt-4 gap-2">
              <View className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: '#FFF7ED' }}>
                <Text className="font-outfit-bold text-lg text-orange-600">{distribution.scams}</Text>
                <Text className="font-outfit-regular text-xs text-gray-500">Scams</Text>
              </View>
              <View className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: '#FEF2F2' }}>
                <Text className="font-outfit-bold text-lg text-red-600">{distribution.dangers}</Text>
                <Text className="font-outfit-regular text-xs text-gray-500">Dangers</Text>
              </View>
              <View className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: '#F3E8FF' }}>
                <Text className="font-outfit-bold text-lg" style={{ color: '#6C5CE7' }}>{distribution.other}</Text>
                <Text className="font-outfit-regular text-xs text-gray-500">Other</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* ─── Insights ─── */}
      <View
        className="bg-white rounded-2xl p-6 mt-4"
        style={{ borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <Text className="font-outfit-semibold text-gray-900 mb-4">Risk Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} className="flex-row items-start mb-4">
            <View className="rounded-xl p-2.5" style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)' }}>
              <Ionicons name={insight.icon} size={20} color="#6C5CE7" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-outfit-medium text-gray-900 text-sm">{insight.title}</Text>
              <Text className="font-outfit-regular text-sm text-gray-500 mt-0.5">{insight.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ─── Safety Suggestions ─── */}
      <View
        className="bg-white rounded-2xl p-6 mt-4 mb-6"
        style={{ borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
        <View className="flex-row items-center mb-4">
          <Ionicons name="shield-checkmark" size={20} color="#6C5CE7" />
          <Text className="font-outfit-semibold text-gray-900 ml-2">Safety Suggestions</Text>
        </View>
        {suggestions.map((suggestion, index) => (
          <View key={index} className="flex-row items-start mb-3">
            <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: '#6C5CE7' }} />
            <Text className="font-outfit-regular text-sm text-gray-500 flex-1 ml-2.5">{suggestion}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
