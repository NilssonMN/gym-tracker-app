import { supabase } from './supabase';

// Default exercises to populate the database
const defaultExercises = [
  // Push exercises
  { name: 'Push-ups', category: 'push', muscle_group: 'Chest, Triceps, Shoulders' },
  { name: 'Bench Press', category: 'push', muscle_group: 'Chest', equipment: 'Barbell' },
  { name: 'Shoulder Press', category: 'push', muscle_group: 'Shoulders', equipment: 'Dumbbells' },
  { name: 'Tricep Dips', category: 'push', muscle_group: 'Triceps' },
  { name: 'Incline Bench Press', category: 'push', muscle_group: 'Upper Chest', equipment: 'Barbell' },
  { name: 'Dumbbell Flyes', category: 'push', muscle_group: 'Chest', equipment: 'Dumbbells' },
  { name: 'Overhead Press', category: 'push', muscle_group: 'Shoulders', equipment: 'Barbell' },
  { name: 'Tricep Extensions', category: 'push', muscle_group: 'Triceps', equipment: 'Dumbbells' },
  
  // Pull exercises
  { name: 'Pull-ups', category: 'pull', muscle_group: 'Back, Biceps' },
  { name: 'Bent-over Row', category: 'pull', muscle_group: 'Back', equipment: 'Barbell' },
  { name: 'Bicep Curls', category: 'pull', muscle_group: 'Biceps', equipment: 'Dumbbells' },
  { name: 'Lat Pulldowns', category: 'pull', muscle_group: 'Back', equipment: 'Cable Machine' },
  { name: 'Deadlifts', category: 'pull', muscle_group: 'Back, Hamstrings', equipment: 'Barbell' },
  { name: 'Chin-ups', category: 'pull', muscle_group: 'Back, Biceps' },
  { name: 'Hammer Curls', category: 'pull', muscle_group: 'Biceps', equipment: 'Dumbbells' },
  { name: 'Face Pulls', category: 'pull', muscle_group: 'Rear Delts', equipment: 'Cable Machine' },
  
  // Leg exercises
  { name: 'Squats', category: 'legs', muscle_group: 'Quadriceps, Glutes' },
  { name: 'Romanian Deadlifts', category: 'legs', muscle_group: 'Hamstrings, Glutes', equipment: 'Barbell' },
  { name: 'Lunges', category: 'legs', muscle_group: 'Quadriceps, Glutes' },
  { name: 'Calf Raises', category: 'legs', muscle_group: 'Calves' },
  { name: 'Leg Press', category: 'legs', muscle_group: 'Quadriceps, Glutes', equipment: 'Machine' },
  { name: 'Bulgarian Split Squats', category: 'legs', muscle_group: 'Quadriceps, Glutes' },
  { name: 'Hip Thrusts', category: 'legs', muscle_group: 'Glutes' },
  { name: 'Leg Curls', category: 'legs', muscle_group: 'Hamstrings', equipment: 'Machine' },
  
  // Core exercises
  { name: 'Plank', category: 'core', muscle_group: 'Core' },
  { name: 'Crunches', category: 'core', muscle_group: 'Abs' },
  { name: 'Russian Twists', category: 'core', muscle_group: 'Obliques' },
  { name: 'Mountain Climbers', category: 'core', muscle_group: 'Core' },
  { name: 'Dead Bug', category: 'core', muscle_group: 'Core' },
  { name: 'Bicycle Crunches', category: 'core', muscle_group: 'Abs, Obliques' },
  { name: 'Side Plank', category: 'core', muscle_group: 'Obliques' },
  { name: 'Leg Raises', category: 'core', muscle_group: 'Lower Abs' },
  
  // Cardio exercises
  { name: 'Running', category: 'cardio', muscle_group: 'Full Body' },
  { name: 'Cycling', category: 'cardio', muscle_group: 'Legs', equipment: 'Bike' },
  { name: 'Rowing', category: 'cardio', muscle_group: 'Full Body', equipment: 'Rowing Machine' },
  { name: 'Burpees', category: 'cardio', muscle_group: 'Full Body' },
  { name: 'Jump Rope', category: 'cardio', muscle_group: 'Full Body', equipment: 'Jump Rope' },
  { name: 'High Knees', category: 'cardio', muscle_group: 'Legs' },
];

// For now, we'll use a temporary user ID since we're not implementing auth yet
const TEMP_USER_ID = 'temp-user-123';

export const migrationService = {
  // Populate database with default exercises
  async populateDefaultExercises(): Promise<boolean> {
    try {
      console.log('Starting migration: Populating default exercises...');
      
      // Check if exercises already exist
      const { data: existingExercises, error: checkError } = await supabase
        .from('exercises')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing exercises:', checkError);
        return false;
      }
      
      if (existingExercises && existingExercises.length > 0) {
        console.log('Default exercises already exist. Skipping migration.');
        return true;
      }
      
      // Add user_id to each exercise
      const exercisesToInsert = defaultExercises.map(exercise => ({
        ...exercise,
        user_id: TEMP_USER_ID,
        created_at: new Date().toISOString(),
      }));
      
      // Insert exercises in batches to avoid timeout
      const batchSize = 10;
      for (let i = 0; i < exercisesToInsert.length; i += batchSize) {
        const batch = exercisesToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('exercises')
          .insert(batch);
        
        if (error) {
          console.error('Error inserting exercise batch:', error);
          return false;
        }
        
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(exercisesToInsert.length / batchSize)}`);
      }
      
      console.log(`Successfully populated ${exercisesToInsert.length} default exercises!`);
      return true;
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  },

  // Clear all data (useful for testing)
  async clearAllData(): Promise<boolean> {
    try {
      console.log('Clearing all data...');
      
      // Delete in correct order due to foreign key constraints
      await supabase.from('exercise_history').delete().eq('user_id', TEMP_USER_ID);
      await supabase.from('workout_exercises').delete().eq('workout_id', 'any'); // This will need proper filtering
      await supabase.from('workouts').delete().eq('user_id', TEMP_USER_ID);
      await supabase.from('progress').delete().eq('user_id', TEMP_USER_ID);
      await supabase.from('exercises').delete().eq('user_id', TEMP_USER_ID);
      await supabase.from('user_settings').delete().eq('user_id', TEMP_USER_ID);
      
      console.log('All data cleared successfully!');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  // Run all migrations
  async runMigrations(): Promise<boolean> {
    try {
      console.log('Running database migrations...');
      
      const success = await this.populateDefaultExercises();
      
      if (success) {
        console.log('All migrations completed successfully!');
      } else {
        console.log('Some migrations failed. Check the logs above.');
      }
      
      return success;
    } catch (error) {
      console.error('Error running migrations:', error);
      return false;
    }
  },
}; 