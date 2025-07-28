import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from './useExerciseStore';
import { workoutService } from '../lib/database';

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

interface WorkoutStore {
  workouts: Workout[];
  currentWorkout: Workout | null;
  isLoading: boolean;
  
  loadWorkouts: () => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
  updateWorkout: (workoutId: string, updatedWorkout: Omit<Workout, 'id'>) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  setCurrentWorkout: (workout: Workout | null) => void;
  setLoading: (loading: boolean) => void;
  clearWorkouts: () => void;
  
  // Local-only actions (for offline support)
  setWorkouts: (workouts: Workout[]) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [],
      currentWorkout: null,
      isLoading: false,
      
      loadWorkouts: async () => {
        set({ isLoading: true });
        try {
          const workouts = await workoutService.getWorkouts();
          set({ workouts, isLoading: false });
        } catch (error) {
          console.error('Failed to load workouts:', error);
          // Keep existing workouts on error
          set({ isLoading: false });
        }
      },
      
      addWorkout: async (workout) => {
        try {
          const newWorkout = await workoutService.addWorkout(workout);
          if (newWorkout) {
            set((state) => ({
              workouts: [...state.workouts, newWorkout]
            }));
          } else {
            // Fallback to local storage if database fails
            set((state) => ({
              workouts: [
                ...state.workouts,
                { ...workout, id: Date.now().toString() }
              ]
            }));
          }
        } catch (error) {
          console.error('Failed to add workout:', error);
          // Fallback to local storage
          set((state) => ({
            workouts: [
              ...state.workouts,
              { ...workout, id: Date.now().toString() }
            ]
          }));
        }
      },
      
      updateWorkout: async (workoutId, updatedWorkout) => {
        try {
          const success = await workoutService.updateWorkout(workoutId, updatedWorkout);
          if (success) {
            set((state) => ({
              workouts: state.workouts.map(workout =>
                workout.id === workoutId
                  ? { ...updatedWorkout, id: workoutId }
                  : workout
              ),
              currentWorkout: state.currentWorkout?.id === workoutId
                ? { ...updatedWorkout, id: workoutId }
                : state.currentWorkout
            }));
          } else {
            // Fallback to local update if database fails
            set((state) => ({
              workouts: state.workouts.map(workout =>
                workout.id === workoutId
                  ? { ...updatedWorkout, id: workoutId }
                  : workout
              ),
              currentWorkout: state.currentWorkout?.id === workoutId
                ? { ...updatedWorkout, id: workoutId }
                : state.currentWorkout
            }));
          }
        } catch (error) {
          console.error('Failed to update workout:', error);
          // Fallback to local update
          set((state) => ({
            workouts: state.workouts.map(workout =>
              workout.id === workoutId
                ? { ...updatedWorkout, id: workoutId }
                : workout
            ),
            currentWorkout: state.currentWorkout?.id === workoutId
              ? { ...updatedWorkout, id: workoutId }
              : state.currentWorkout
          }));
        }
      },
      
      deleteWorkout: async (workoutId) => {
        try {
          const success = await workoutService.deleteWorkout(workoutId);
          if (success) {
            set((state) => ({
              workouts: state.workouts.filter(workout => workout.id !== workoutId),
              currentWorkout: state.currentWorkout?.id === workoutId ? null : state.currentWorkout
            }));
          } else {
            // Fallback to local delete if database fails
            set((state) => ({
              workouts: state.workouts.filter(workout => workout.id !== workoutId),
              currentWorkout: state.currentWorkout?.id === workoutId ? null : state.currentWorkout
            }));
          }
        } catch (error) {
          console.error('Failed to delete workout:', error);
          // Fallback to local delete
          set((state) => ({
            workouts: state.workouts.filter(workout => workout.id !== workoutId),
            currentWorkout: state.currentWorkout?.id === workoutId ? null : state.currentWorkout
          }));
        }
      },
      
      setCurrentWorkout: (workout) => 
        set({ currentWorkout: workout }),
      
      setLoading: (loading) => 
        set({ isLoading: loading }),
      
      clearWorkouts: () => 
        set({ workouts: [], currentWorkout: null }),
      
      // Local-only actions
      setWorkouts: (workouts) => set({ workouts }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 