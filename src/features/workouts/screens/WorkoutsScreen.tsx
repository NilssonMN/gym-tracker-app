import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useState } from 'react';
import { useWorkoutStore, WorkoutExercise } from '../../../stores/useWorkoutStore';
import { useExerciseStore } from '../../../stores/useExerciseStore';
import { useProgressStore } from '../../../stores/useProgressStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Colors } from '../../../constants/Colors';
import { RestTimerModal } from '../../../components/RestTimerModal';
import { WorkoutBuilder } from '../../../components/WorkoutBuilder';
import { WorkoutCard } from '../../../components/WorkoutCard';

export default function WorkoutsScreen() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkoutStore();
  const { selectedExercises, clearSelectedExercises } = useExerciseStore();
  const { recordWorkoutCompletion, updateWorkoutStreak } = useProgressStore();
  const { theme } = useSettingsStore();
  const colors = Colors[theme];
  
  const [workoutName, setWorkoutName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);

  const initializeWorkoutExercises = () => {
    const initialExercises = selectedExercises.map(exercise => ({
      exercise,
      sets: 3,
      reps: 12,
      weight: 0,
      notes: '',
    }));
    setWorkoutExercises(initialExercises);
    setShowBuilder(true);
  };

  const updateExerciseData = (index: number, field: keyof WorkoutExercise, value: string | number) => {
    setWorkoutExercises(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveWorkout = () => {
    if (workoutExercises.length === 0) {
      Alert.alert('No Exercises', 'Please add exercises to your workout.');
      return;
    }
    
    if (!workoutName.trim()) {
      Alert.alert('Missing Workout Name', 'Please enter a name for your workout.');
      return;
    }

    if (editingWorkout) {
      // Update existing workout
      updateWorkout(editingWorkout, {
        name: workoutName,
        date: new Date().toLocaleDateString(),
        exercises: workoutExercises,
      });
      
      // Update progress tracking for edited workout
      const exercisesForProgress = workoutExercises.map(we => ({
        name: we.exercise.name,
        weight: we.weight,
        reps: we.reps,
        sets: we.sets,
      }));
      
      recordWorkoutCompletion(editingWorkout, workoutName, exercisesForProgress);
      updateWorkoutStreak();
      
      Alert.alert('Success!', 'Workout updated and progress tracking updated!');
    } else {
      // Create new workout
      const newWorkout = {
        name: workoutName,
        date: new Date().toLocaleDateString(),
        exercises: workoutExercises,
      };
      
      addWorkout(newWorkout);
      
      // Record workout completion for progress tracking
      const workoutId = Date.now().toString();
      const exercisesForProgress = workoutExercises.map(we => ({
        name: we.exercise.name,
        weight: we.weight,
        reps: we.reps,
        sets: we.sets,
      }));
      
      recordWorkoutCompletion(workoutId, workoutName, exercisesForProgress);
      updateWorkoutStreak();
      
      Alert.alert('Success!', 'Workout created and progress updated!');
    }

    resetForm();
  };

  const resetForm = () => {
    setWorkoutName('');
    setShowBuilder(false);
    setWorkoutExercises([]);
    setEditingWorkout(null);
    clearSelectedExercises();
  };

  const handleEditWorkout = (workout: any) => {
    setEditingWorkout(workout.id);
    setWorkoutName(workout.name);
    setWorkoutExercises(workout.exercises);
    setShowBuilder(true);
  };

  const handleDeleteWorkout = (workoutId: string, workoutName: string) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workoutName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(workoutId);
            Alert.alert('Deleted!', 'Workout deleted successfully.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🏋️ Workouts</Text>
        <TouchableOpacity 
          style={styles.timerButton}
          onPress={() => setShowRestTimer(true)}
        >
          <Text style={styles.timerButtonText}>⏱️ Rest Timer</Text>
        </TouchableOpacity>
      </View>
      
      {/* Selected Exercises Info */}
      {selectedExercises.length > 0 && (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedText}>
            {selectedExercises.length} exercises selected
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={initializeWorkoutExercises}
          >
            <Text style={styles.createButtonText}>Create Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Workout Builder */}
      {showBuilder && (
        <WorkoutBuilder
          workoutName={workoutName}
          setWorkoutName={setWorkoutName}
          workoutExercises={workoutExercises}
          updateExerciseData={updateExerciseData}
          editingWorkout={editingWorkout}
          onSave={handleSaveWorkout}
          onCancel={resetForm}
        />
      )}

      {/* Instructions or Workout List */}
      {workouts.length === 0 ? (
        <Text style={styles.subtitle}>
          No workouts yet!
          {'\n\n'}1. Go to Exercises tab
          {'\n'}2. Select exercises for your workout
          {'\n'}3. Come back here to create your workout
        </Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onEdit={handleEditWorkout}
              onDelete={handleDeleteWorkout}
            />
          )}
        />
      )}

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedBanner: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
  createButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
  },
}); 