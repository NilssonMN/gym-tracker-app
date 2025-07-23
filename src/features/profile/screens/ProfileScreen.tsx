import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Colors } from '../../../constants/Colors';

export default function ProfileScreen() {
  const { theme, defaultWeightUnit, setTheme, setDefaultWeightUnit, toggleTheme } = useSettingsStore();
  const colors = Colors[theme];

  const handleUnitChange = (unit: 'kg' | 'lbs') => {
    setDefaultWeightUnit(unit);
    Alert.alert('Unit Changed', `Default weight unit set to ${unit.toUpperCase()}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>⚙️ Settings</Text>
      
      {/* Theme Setting */}
      <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
        <View style={styles.settingHeader}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>🌙 Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={theme === 'dark' ? colors.surface : colors.background}
          />
        </View>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Toggle between light and dark theme
        </Text>
      </View>

      {/* Default Weight Unit Setting */}
      <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>⚖️ Default Weight Unit</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Choose your preferred weight unit for new exercises
        </Text>
        
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[
              styles.unitButton,
              { backgroundColor: colors.background, borderColor: colors.border },
              defaultWeightUnit === 'kg' && { backgroundColor: colors.primary }
            ]}
            onPress={() => handleUnitChange('kg')}
          >
            <Text style={[
              styles.unitButtonText,
              { color: colors.text },
              defaultWeightUnit === 'kg' && { color: colors.surface }
            ]}>
              KG
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.unitButton,
              { backgroundColor: colors.background, borderColor: colors.border },
              defaultWeightUnit === 'lbs' && { backgroundColor: colors.primary }
            ]}
            onPress={() => handleUnitChange('lbs')}
          >
            <Text style={[
              styles.unitButtonText,
              { color: colors.text },
              defaultWeightUnit === 'lbs' && { color: colors.surface }
            ]}>
              LBS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>📱 About</Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          Gym Tracker App v1.0{'\n'}
          Track your workouts and progress with ease
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  unitSelector: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  unitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 