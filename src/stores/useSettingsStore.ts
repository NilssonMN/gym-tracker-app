import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsService } from '../lib/database';

export type Theme = 'light' | 'dark';
export type WeightUnit = 'kg' | 'lbs';

interface SettingsStore {
  theme: Theme;
  defaultWeightUnit: WeightUnit;
  isLoading: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setDefaultWeightUnit: (unit: WeightUnit) => Promise<void>;
  toggleTheme: () => Promise<void>;
  
  // Local-only actions (for offline support)
  setThemeLocal: (theme: Theme) => void;
  setDefaultWeightUnitLocal: (unit: WeightUnit) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      defaultWeightUnit: 'kg',
      isLoading: false,
      
      loadSettings: async () => {
        set({ isLoading: true });
        try {
          const settings = await settingsService.getSettings();
          if (settings.theme || settings.default_weight_unit) {
            set({ 
              theme: settings.theme || 'light',
              defaultWeightUnit: settings.default_weight_unit || 'kg',
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
          // Keep existing settings on error
          set({ isLoading: false });
        }
      },
      
      setTheme: async (theme) => {
        const { defaultWeightUnit } = get();
        try {
          const success = await settingsService.updateSettings({
            theme,
            defaultWeightUnit
          });
          if (success) {
            set({ theme });
          } else {
            // Fallback to local update if database fails
            set({ theme });
          }
        } catch (error) {
          console.error('Failed to update theme:', error);
          // Fallback to local update
          set({ theme });
        }
      },
      
      setDefaultWeightUnit: async (unit) => {
        const { theme } = get();
        try {
          const success = await settingsService.updateSettings({
            theme,
            defaultWeightUnit: unit
          });
          if (success) {
            set({ defaultWeightUnit: unit });
          } else {
            // Fallback to local update if database fails
            set({ defaultWeightUnit: unit });
          }
        } catch (error) {
          console.error('Failed to update weight unit:', error);
          // Fallback to local update
          set({ defaultWeightUnit: unit });
        }
      },
      
      toggleTheme: async () => {
        const { theme, setTheme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        await setTheme(newTheme);
      },
      
      // Local-only actions
      setThemeLocal: (theme) => set({ theme }),
      setDefaultWeightUnitLocal: (unit) => set({ defaultWeightUnit: unit }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 