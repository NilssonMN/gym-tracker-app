import { supabase } from './supabase';
import { Exercise } from '../stores/useExerciseStore';
import { Workout, WorkoutExercise } from '../stores/useWorkoutStore';
import { ProgressExercise, ExerciseSession } from '../stores/useProgressStore';

// Temporary user ID until authentication is implemented
const TEMP_USER_ID = 'temp-user-123';

// Exercise Database Functions
export const exerciseService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscleGroup: exercise.muscle_group,
        equipment: exercise.equipment,
      }));
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  },

  async addExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: exercise.name,
          category: exercise.category,
          muscle_group: exercise.muscleGroup,
          equipment: exercise.equipment,
          user_id: TEMP_USER_ID,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        muscleGroup: data.muscle_group,
        equipment: data.equipment,
      };
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  },

  async deleteExercise(exerciseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)
        .eq('user_id', TEMP_USER_ID);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return false;
    }
  },
};

// Workout Database Functions
export const workoutService = {
  async getWorkouts(): Promise<Workout[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('user_id', TEMP_USER_ID)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.date,
        exercises: workout.workout_exercises.map((we: any) => ({
          exercise: {
            id: we.exercises.id,
            name: we.exercises.name,
            category: we.exercises.category,
            muscleGroup: we.exercises.muscle_group,
            equipment: we.exercises.equipment,
          },
          sets: we.sets,
          reps: we.reps,
          weight: we.weight,
          notes: we.notes,
        })),
      }));
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  },

  async addWorkout(workout: Omit<Workout, 'id'>): Promise<Workout | null> {
    try {
      // Create the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: workout.name,
          date: workout.date,
          user_id: TEMP_USER_ID,
        })
        .select()
        .single();
      
      if (workoutError) throw workoutError;
      
      // Add associated exercises to the workout
      const workoutExercises = workout.exercises.map(we => ({
        workout_id: workoutData.id,
        exercise_id: we.exercise.id,
        sets: we.sets,
        reps: we.reps,
        weight: we.weight,
        notes: we.notes,
      }));
      
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
      
      if (exercisesError) throw exercisesError;
      
      return {
        id: workoutData.id,
        name: workoutData.name,
        date: workoutData.date,
        exercises: workout.exercises,
      };
    } catch (error) {
      console.error('Error adding workout:', error);
      return null;
    }
  },

  async updateWorkout(workoutId: string, workout: Omit<Workout, 'id'>): Promise<boolean> {
    try {
      // Update workout metadata
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: workout.name,
          date: workout.date,
        })
        .eq('id', workoutId)
        .eq('user_id', TEMP_USER_ID);
      
      if (workoutError) throw workoutError;
      
      // Replace all workout exercises
      const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);
      
      if (deleteError) throw deleteError;
      
      const workoutExercises = workout.exercises.map(we => ({
        workout_id: workoutId,
        exercise_id: we.exercise.id,
        sets: we.sets,
        reps: we.reps,
        weight: we.weight,
        notes: we.notes,
      }));
      
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
      
      if (exercisesError) throw exercisesError;
      
      return true;
    } catch (error) {
      console.error('Error updating workout:', error);
      return false;
    }
  },

  async deleteWorkout(workoutId: string): Promise<boolean> {
    try {
      // Delete workout exercises first due to foreign key constraints
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workoutId);
      
      if (exercisesError) throw exercisesError;
      
      const { error: workoutError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', TEMP_USER_ID);
      
      if (workoutError) throw workoutError;
      
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  },
};

// Progress Database Functions
export const progressService = {
  async getProgressExercises(): Promise<ProgressExercise[]> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .order('exercise_name');
      
      if (error) throw error;
      
      return data.map(progress => ({
        id: progress.id,
        name: progress.exercise_name,
        startingWeight: progress.starting_weight,
        currentWeight: progress.current_weight,
        goalWeight: progress.goal_weight,
        currentReps: progress.current_reps,
        targetReps: progress.target_reps,
        unit: progress.unit,
        dateAdded: progress.date_added,
        lastUpdated: progress.last_updated,
        notes: progress.notes,
        personalRecord: progress.personal_record,
        totalSessions: progress.total_sessions,
      }));
    } catch (error) {
      console.error('Error fetching progress exercises:', error);
      return [];
    }
  },

  async addProgressExercise(exercise: Omit<ProgressExercise, 'id' | 'dateAdded' | 'lastUpdated'>): Promise<ProgressExercise | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('progress')
        .insert({
          exercise_name: exercise.name,
          starting_weight: exercise.startingWeight,
          current_weight: exercise.currentWeight,
          goal_weight: exercise.goalWeight,
          current_reps: exercise.currentReps,
          target_reps: exercise.targetReps,
          unit: exercise.unit,
          date_added: now,
          last_updated: now,
          notes: exercise.notes,
          personal_record: exercise.currentWeight,
          total_sessions: 0,
          user_id: TEMP_USER_ID,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.exercise_name,
        startingWeight: data.starting_weight,
        currentWeight: data.current_weight,
        goalWeight: data.goal_weight,
        currentReps: data.current_reps,
        targetReps: data.target_reps,
        unit: data.unit,
        dateAdded: data.date_added,
        lastUpdated: data.last_updated,
        notes: data.notes,
        personalRecord: data.personal_record,
        totalSessions: data.total_sessions,
      };
    } catch (error) {
      console.error('Error adding progress exercise:', error);
      return null;
    }
  },

  async updateProgressExercise(id: string, updates: Partial<Omit<ProgressExercise, 'id' | 'dateAdded'>>): Promise<boolean> {
    try {
      const updateData: any = {
        last_updated: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) updateData.exercise_name = updates.name;
      if (updates.startingWeight !== undefined) updateData.starting_weight = updates.startingWeight;
      if (updates.currentWeight !== undefined) updateData.current_weight = updates.currentWeight;
      if (updates.goalWeight !== undefined) updateData.goal_weight = updates.goalWeight;
      if (updates.currentReps !== undefined) updateData.current_reps = updates.currentReps;
      if (updates.targetReps !== undefined) updateData.target_reps = updates.targetReps;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.personalRecord !== undefined) updateData.personal_record = updates.personalRecord;
      if (updates.totalSessions !== undefined) updateData.total_sessions = updates.totalSessions;
      
      const { error } = await supabase
        .from('progress')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', TEMP_USER_ID);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating progress exercise:', error);
      return false;
    }
  },

  async deleteProgressExercise(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('id', id)
        .eq('user_id', TEMP_USER_ID);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting progress exercise:', error);
      return false;
    }
  },

  async getExerciseHistory(): Promise<ExerciseSession[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(session => ({
        id: session.id,
        exerciseName: session.exercise_name,
        weight: session.weight,
        reps: session.reps,
        sets: session.sets,
        date: session.date,
        workoutId: session.workout_id,
        workoutName: session.workout_name,
      }));
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return [];
    }
  },

  async recordWorkoutCompletion(
    workoutId: string, 
    workoutName: string, 
    exercises: Array<{name: string, weight: number, reps: number, sets: number}>
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString();
      
      // Record exercise history for this workout session
      const historyEntries = exercises.map(ex => ({
        exercise_name: ex.name,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
        date: today,
        workout_id: workoutId,
        workout_name: workoutName,
        user_id: TEMP_USER_ID,
      }));
      
      const { error: historyError } = await supabase
        .from('exercise_history')
        .insert(historyEntries);
      
      if (historyError) throw historyError;
      
      // Update progress tracking for each exercise
      for (const exercise of exercises) {
        const { data: progressData, error: fetchError } = await supabase
          .from('progress')
          .select('*')
          .eq('exercise_name', exercise.name)
          .eq('user_id', TEMP_USER_ID)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching progress:', fetchError);
          continue;
        }
        
        if (progressData) {
          const newPR = Math.max(progressData.personal_record || 0, exercise.weight);
          const { error: updateError } = await supabase
            .from('progress')
            .update({
              current_weight: exercise.weight,
              current_reps: exercise.reps,
              personal_record: newPR,
              total_sessions: (progressData.total_sessions || 0) + 1,
              last_updated: today,
            })
            .eq('id', progressData.id);
          
          if (updateError) {
            console.error('Error updating progress:', updateError);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error recording workout completion:', error);
      return false;
    }
  },
};

// Settings Database Functions
export const settingsService = {
  async getSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', TEMP_USER_ID)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {};
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  },

  async updateSettings(settings: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: TEMP_USER_ID,
          theme: settings.theme,
          default_weight_unit: settings.defaultWeightUnit,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  },
}; 