import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseStore } from '../../src/stores/useExerciseStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { Colors } from '../../src/constants/Colors';

export default function TabLayout() {
  const { selectedExercises } = useExerciseStore();
  const { theme } = useSettingsStore();
  const hasSelectedExercises = selectedExercises.length > 0;
  const colors = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          height: hasSelectedExercises ? 60 : 85,
          paddingBottom: hasSelectedExercises ? 8 : 15,
          paddingTop: hasSelectedExercises ? 4 : 8,
        },
        headerStyle: {
          backgroundColor: colors.tabBarBackground,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color }) => (
            <Ionicons name="fitness" size={hasSelectedExercises ? 20 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => (
            <Ionicons name="barbell" size={hasSelectedExercises ? 20 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <Ionicons name="analytics" size={hasSelectedExercises ? 20 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={hasSelectedExercises ? 20 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 