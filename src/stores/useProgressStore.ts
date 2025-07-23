import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { progressService } from '../lib/database';

export interface ExerciseSession {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  sets: number;
  date: string;
  workoutId: string;
  workoutName: string;
}

export interface ProgressExercise {
  id: string;
  name: string;
  startingWeight: number;
  currentWeight: number;
  goalWeight: number;
  currentReps: number;
  targetReps: number;
  unit: 'kg' | 'lbs';
  dateAdded: string;
  lastUpdated: string;
  notes?: string;
  personalRecord?: number; // Highest weight achieved
  totalSessions?: number; // Total workout sessions
}

interface ProgressStore {
  progressExercises: ProgressExercise[];
  exerciseHistory: ExerciseSession[];
  workoutStreak: number;
  lastWorkoutDate: string | null;
  isLoading: boolean;
  
  // Actions
  loadProgressData: () => Promise<void>;
  addProgressExercise: (exercise: Omit<ProgressExercise, 'id' | 'dateAdded' | 'lastUpdated'>) => Promise<void>;
  updateProgressExercise: (id: string, updates: Partial<Omit<ProgressExercise, 'id' | 'dateAdded'>>) => Promise<void>;
  deleteProgressExercise: (id: string) => Promise<void>;
  getProgressExercise: (id: string) => ProgressExercise | undefined;
  
  // New workout completion actions
  recordWorkoutCompletion: (workoutId: string, workoutName: string, exercises: Array<{name: string, weight: number, reps: number, sets: number}>) => Promise<void>;
  getExerciseHistory: (exerciseName: string) => ExerciseSession[];
  updateWorkoutStreak: () => void;
  getWeeklyStats: () => { workouts: number, totalSets: number, totalReps: number };
  getMonthlyStats: () => { workouts: number, totalSets: number, totalReps: number };
  
  // Local-only actions (for offline support)
  setProgressExercises: (exercises: ProgressExercise[]) => void;
  setExerciseHistory: (history: ExerciseSession[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progressExercises: [],
      exerciseHistory: [],
      workoutStreak: 0,
      lastWorkoutDate: null,
      isLoading: false,
      
      loadProgressData: async () => {
        set({ isLoading: true });
        try {
          const [progressExercises, exerciseHistory] = await Promise.all([
            progressService.getProgressExercises(),
            progressService.getExerciseHistory()
          ]);
          
          set({ 
            progressExercises, 
            exerciseHistory,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to load progress data:', error);
          // Keep existing data on error
          set({ isLoading: false });
        }
      },
      
      addProgressExercise: async (exercise) => {
        try {
          const newExercise = await progressService.addProgressExercise(exercise);
          if (newExercise) {
            set((state) => ({
              progressExercises: [...state.progressExercises, newExercise]
            }));
          } else {
            // Fallback to local storage if database fails
            set((state) => ({
              progressExercises: [
                ...state.progressExercises,
                {
                  ...exercise,
                  id: Date.now().toString(),
                  dateAdded: new Date().toLocaleDateString(),
                  lastUpdated: new Date().toLocaleDateString(),
                  personalRecord: exercise.currentWeight,
                  totalSessions: 0,
                }
              ]
            }));
          }
        } catch (error) {
          console.error('Failed to add progress exercise:', error);
          // Fallback to local storage
          set((state) => ({
            progressExercises: [
              ...state.progressExercises,
              {
                ...exercise,
                id: Date.now().toString(),
                dateAdded: new Date().toLocaleDateString(),
                lastUpdated: new Date().toLocaleDateString(),
                personalRecord: exercise.currentWeight,
                totalSessions: 0,
              }
            ]
          }));
        }
      },
      
      updateProgressExercise: async (id, updates) => {
        try {
          const success = await progressService.updateProgressExercise(id, updates);
          if (success) {
            set((state) => ({
              progressExercises: state.progressExercises.map(exercise =>
                exercise.id === id
                  ? { ...exercise, ...updates, lastUpdated: new Date().toLocaleDateString() }
                  : exercise
              )
            }));
          } else {
            // Fallback to local update if database fails
            set((state) => ({
              progressExercises: state.progressExercises.map(exercise =>
                exercise.id === id
                  ? { ...exercise, ...updates, lastUpdated: new Date().toLocaleDateString() }
                  : exercise
              )
            }));
          }
        } catch (error) {
          console.error('Failed to update progress exercise:', error);
          // Fallback to local update
          set((state) => ({
            progressExercises: state.progressExercises.map(exercise =>
              exercise.id === id
                ? { ...exercise, ...updates, lastUpdated: new Date().toLocaleDateString() }
                : exercise
            )
          }));
        }
      },
      
      deleteProgressExercise: async (id) => {
        try {
          const success = await progressService.deleteProgressExercise(id);
          if (success) {
            set((state) => ({
              progressExercises: state.progressExercises.filter(exercise => exercise.id !== id)
            }));
          } else {
            // Fallback to local delete if database fails
            set((state) => ({
              progressExercises: state.progressExercises.filter(exercise => exercise.id !== id)
            }));
          }
        } catch (error) {
          console.error('Failed to delete progress exercise:', error);
          // Fallback to local delete
          set((state) => ({
            progressExercises: state.progressExercises.filter(exercise => exercise.id !== id)
          }));
        }
      },
      
      getProgressExercise: (id) => {
        const { progressExercises } = get();
        return progressExercises.find(exercise => exercise.id === id);
      },

      recordWorkoutCompletion: async (workoutId, workoutName, exercises) => {
        try {
          const success = await progressService.recordWorkoutCompletion(workoutId, workoutName, exercises);
          if (success) {
            // Reload progress data to get updated values
            const [progressExercises, exerciseHistory] = await Promise.all([
              progressService.getProgressExercises(),
              progressService.getExerciseHistory()
            ]);
            
            set((state) => ({
              progressExercises,
              exerciseHistory,
              lastWorkoutDate: new Date().toLocaleDateString(),
            }));
          } else {
            // Fallback to local update
            set((state) => {
              const today = new Date().toLocaleDateString();
              const newSessions: ExerciseSession[] = exercises.map(ex => ({
                id: `${workoutId}-${ex.name}-${Date.now()}`,
                exerciseName: ex.name,
                weight: ex.weight,
                reps: ex.reps,
                sets: ex.sets,
                date: today,
                workoutId,
                workoutName,
              }));

              // Update progress exercises with new current weights and PRs
              const updatedProgressExercises = state.progressExercises.map(progressEx => {
                const matchingExercise = exercises.find(ex => ex.name.toLowerCase() === progressEx.name.toLowerCase());
                if (matchingExercise) {
                  const newPR = Math.max(progressEx.personalRecord || 0, matchingExercise.weight);
                  return {
                    ...progressEx,
                    currentWeight: matchingExercise.weight,
                    currentReps: matchingExercise.reps,
                    personalRecord: newPR,
                    totalSessions: (progressEx.totalSessions || 0) + 1,
                    lastUpdated: today,
                  };
                }
                return progressEx;
              });

              return {
                exerciseHistory: [...state.exerciseHistory, ...newSessions],
                progressExercises: updatedProgressExercises,
                lastWorkoutDate: today,
              };
            });
          }
        } catch (error) {
          console.error('Failed to record workout completion:', error);
          // Fallback to local update
          set((state) => {
            const today = new Date().toLocaleDateString();
            const newSessions: ExerciseSession[] = exercises.map(ex => ({
              id: `${workoutId}-${ex.name}-${Date.now()}`,
              exerciseName: ex.name,
              weight: ex.weight,
              reps: ex.reps,
              sets: ex.sets,
              date: today,
              workoutId,
              workoutName,
            }));

            // Update progress exercises with new current weights and PRs
            const updatedProgressExercises = state.progressExercises.map(progressEx => {
              const matchingExercise = exercises.find(ex => ex.name.toLowerCase() === progressEx.name.toLowerCase());
              if (matchingExercise) {
                const newPR = Math.max(progressEx.personalRecord || 0, matchingExercise.weight);
                return {
                  ...progressEx,
                  currentWeight: matchingExercise.weight,
                  currentReps: matchingExercise.reps,
                  personalRecord: newPR,
                  totalSessions: (progressEx.totalSessions || 0) + 1,
                  lastUpdated: today,
                };
              }
              return progressEx;
            });

            return {
              exerciseHistory: [...state.exerciseHistory, ...newSessions],
              progressExercises: updatedProgressExercises,
              lastWorkoutDate: today,
            };
          });
        }
      },

      getExerciseHistory: (exerciseName) => {
        const { exerciseHistory } = get();
        return exerciseHistory.filter(session => 
          session.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      updateWorkoutStreak: () =>
        set((state) => {
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          
          const todayStr = today.toLocaleDateString();
          const yesterdayStr = yesterday.toLocaleDateString();
          
          if (state.lastWorkoutDate === todayStr) {
            // Already worked out today, keep streak
            return state;
          } else if (state.lastWorkoutDate === yesterdayStr) {
            // Worked out yesterday, increment streak
            return { workoutStreak: state.workoutStreak + 1 };
          } else if (state.lastWorkoutDate === null || state.lastWorkoutDate === todayStr) {
            // First workout or same day
            return { workoutStreak: 1 };
          } else {
            // Streak broken, reset
            return { workoutStreak: 1 };
          }
        }),

      getWeeklyStats: () => {
        const { exerciseHistory } = get();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weekSessions = exerciseHistory.filter(session => 
          new Date(session.date) >= oneWeekAgo
        );
        
        const uniqueWorkouts = new Set(weekSessions.map(s => s.workoutId)).size;
        const totalSets = weekSessions.reduce((sum, s) => sum + s.sets, 0);
        const totalReps = weekSessions.reduce((sum, s) => sum + (s.reps * s.sets), 0);
        
        return { workouts: uniqueWorkouts, totalSets, totalReps };
      },

      getMonthlyStats: () => {
        const { exerciseHistory } = get();
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
        
        const monthSessions = exerciseHistory.filter(session => 
          new Date(session.date) >= oneMonthAgo
        );
        
        const uniqueWorkouts = new Set(monthSessions.map(s => s.workoutId)).size;
        const totalSets = monthSessions.reduce((sum, s) => sum + s.sets, 0);
        const totalReps = monthSessions.reduce((sum, s) => sum + (s.reps * s.sets), 0);
        
        return { workouts: uniqueWorkouts, totalSets, totalReps };
      },
      
      // Local-only actions
      setProgressExercises: (exercises) => set({ progressExercises: exercises }),
      setExerciseHistory: (history) => set({ exerciseHistory: history }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 