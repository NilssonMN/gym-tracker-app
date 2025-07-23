import { useEffect, useState } from 'react';
import { useExerciseStore } from '../stores/useExerciseStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useProgressStore } from '../stores/useProgressStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { migrationService } from '../lib/migrations';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const loadExercises = useExerciseStore(state => state.loadExercises);
  const loadWorkouts = useWorkoutStore(state => state.loadWorkouts);
  const loadProgressData = useProgressStore(state => state.loadProgressData);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  
  const exerciseLoading = useExerciseStore(state => state.isLoading);
  const workoutLoading = useWorkoutStore(state => state.isLoading);
  const progressLoading = useProgressStore(state => state.isLoading);
  const settingsLoading = useSettingsStore(state => state.isLoading);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Run migrations first (populate default exercises if needed)
        console.log('Running migrations...');
        await migrationService.runMigrations();
        
        // Load all data in parallel
        console.log('Loading app data...');
        await Promise.all([
          loadExercises(),
          loadWorkouts(),
          loadProgressData(),
          loadSettings()
        ]);
        
        console.log('App initialization completed successfully!');
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Still set to true to allow app to work with local data
      }
    };

    initializeApp();
  }, [loadExercises, loadWorkouts, loadProgressData, loadSettings]);

  const isLoading = !isInitialized || exerciseLoading || workoutLoading || progressLoading || settingsLoading;

  return {
    isInitialized,
    isLoading,
    initializationError,
  };
}; 