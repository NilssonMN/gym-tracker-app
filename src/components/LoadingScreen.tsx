import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Colors } from '../constants/Colors';

interface LoadingScreenProps {
  error?: string | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error }) => {
  const theme = useSettingsStore(state => state.theme);
  const colors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Gym Tracker
            </Text>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              The app will continue with offline data.
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator 
              size="large" 
              color={colors.primary} 
              style={styles.spinner}
            />
            <Text style={[styles.title, { color: colors.text }]}>
              Gym Tracker
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Loading your data...
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
}); 