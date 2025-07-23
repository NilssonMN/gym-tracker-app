import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseService } from '../lib/database';

export interface Exercise {
  id: string;
  name: string;
  category: 'push' | 'pull' | 'legs' | 'cardio' | 'core';
  muscleGroup: string;
  equipment?: string;
}

interface ExerciseStore {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  isLoading: boolean;
  
  // Actions
  loadExercises: () => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  toggleExerciseSelection: (exerciseId: string) => void;
  clearSelectedExercises: () => void;
  getExercisesByCategory: (category: Exercise['category']) => Exercise[];
  getSortedExercises: () => Exercise[];
  
  // Local-only actions (for offline support)
  setExercises: (exercises: Exercise[]) => void;
  setLoading: (loading: boolean) => void;
}

// Predefined exercises (fallback for offline mode)
const defaultExercises: Exercise[] = [
  // Push exercises
  { id: '1', name: 'Push-ups', category: 'push', muscleGroup: 'Chest, Triceps, Shoulders' },
  { id: '2', name: 'Bench Press', category: 'push', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: '3', name: 'Shoulder Press', category: 'push', muscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { id: '4', name: 'Tricep Dips', category: 'push', muscleGroup: 'Triceps' },
  
  // Pull exercises
  { id: '5', name: 'Pull-ups', category: 'pull', muscleGroup: 'Back, Biceps' },
  { id: '6', name: 'Bent-over Row', category: 'pull', muscleGroup: 'Back', equipment: 'Barbell' },
  { id: '7', name: 'Bicep Curls', category: 'pull', muscleGroup: 'Biceps', equipment: 'Dumbbells' },
  { id: '8', name: 'Lat Pulldowns', category: 'pull', muscleGroup: 'Back', equipment: 'Cable Machine' },
  
  // Leg exercises
  { id: '9', name: 'Squats', category: 'legs', muscleGroup: 'Quadriceps, Glutes' },
  { id: '10', name: 'Deadlifts', category: 'legs', muscleGroup: 'Hamstrings, Glutes', equipment: 'Barbell' },
  { id: '11', name: 'Lunges', category: 'legs', muscleGroup: 'Quadriceps, Glutes' },
  { id: '12', name: 'Calf Raises', category: 'legs', muscleGroup: 'Calves' },
  
  // Core exercises
  { id: '13', name: 'Plank', category: 'core', muscleGroup: 'Core' },
  { id: '14', name: 'Crunches', category: 'core', muscleGroup: 'Abs' },
  { id: '15', name: 'Russian Twists', category: 'core', muscleGroup: 'Obliques' },
];

export const useExerciseStore = create<ExerciseStore>()(
  persist(
    (set, get) => ({
      exercises: defaultExercises,
      selectedExercises: [],
      isLoading: false,
      
      loadExercises: async () => {
        set({ isLoading: true });
        try {
          const exercises = await exerciseService.getExercises();
          if (exercises.length > 0) {
            set({ exercises, isLoading: false });
          } else {
            // Fallback to default exercises if database is empty
            console.log('No exercises found in database, using default exercises');
            set({ exercises: defaultExercises, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load exercises:', error);
          // Keep existing exercises on error
          set({ isLoading: false });
        }
      },
      
      addExercise: async (exercise) => {
        try {
          const newExercise = await exerciseService.addExercise(exercise);
          if (newExercise) {
            set((state) => ({
              exercises: [...state.exercises, newExercise]
            }));
          } else {
            // Fallback to local storage if database fails
            set((state) => ({
              exercises: [
                ...state.exercises,
                { ...exercise, id: Date.now().toString() }
              ]
            }));
          }
        } catch (error) {
          console.error('Failed to add exercise:', error);
          // Fallback to local storage
          set((state) => ({
            exercises: [
              ...state.exercises,
              { ...exercise, id: Date.now().toString() }
            ]
          }));
        }
      },
      
      toggleExerciseSelection: (exerciseId) =>
        set((state) => {
          const exercise = state.exercises.find(e => e.id === exerciseId);
          if (!exercise) return state;
          
          const isSelected = state.selectedExercises.some(e => e.id === exerciseId);
          
          return {
            selectedExercises: isSelected
              ? state.selectedExercises.filter(e => e.id !== exerciseId)
              : [...state.selectedExercises, exercise]
          };
        }),
      
      clearSelectedExercises: () =>
        set({ selectedExercises: [] }),
      
      getExercisesByCategory: (category) => {
        const { exercises } = get();
        return exercises.filter(exercise => exercise.category === category);
      },
      
      getSortedExercises: () => {
        const { exercises } = get();
        // Define category order
        const categoryOrder: Exercise['category'][] = ['push', 'pull', 'legs', 'core', 'cardio'];
        
        // Sort exercises by category first, then alphabetically within each category
        return exercises.sort((a, b) => {
          const categoryIndexA = categoryOrder.indexOf(a.category);
          const categoryIndexB = categoryOrder.indexOf(b.category);
          
          // If categories are different, sort by category order
          if (categoryIndexA !== categoryIndexB) {
            return categoryIndexA - categoryIndexB;
          }
          
          // If same category, sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
      },
      
      // Local-only actions
      setExercises: (exercises) => set({ exercises }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'exercise-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 