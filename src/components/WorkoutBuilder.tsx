import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { WorkoutExercise } from '../stores/useWorkoutStore';
import { ExerciseConfigCard } from './ExerciseConfigCard';

interface WorkoutBuilderProps {
  workoutName: string;
  setWorkoutName: (name: string) => void;
  workoutExercises: WorkoutExercise[];
  updateExerciseData: (index: number, field: keyof WorkoutExercise, value: string | number) => void;
  editingWorkout: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({
  workoutName,
  setWorkoutName,
  workoutExercises,
  updateExerciseData,
  editingWorkout,
  onSave,
  onCancel,
}) => {
  return (
    <ScrollView style={styles.builderContainer}>
      <Text style={styles.builderTitle}>
        {editingWorkout ? 'Edit Workout' : 'Create New Workout'}
      </Text>
      
      <TextInput
        style={styles.workoutNameInput}
        placeholder="Enter workout name (e.g., Pull Day)"
        value={workoutName}
        onChangeText={setWorkoutName}
      />
      
      <Text style={styles.selectedExercisesTitle}>
        Set Your Weights & Reps:
      </Text>
      
      {workoutExercises.map((workoutExercise, index) => (
        <ExerciseConfigCard
          key={workoutExercise.exercise.id}
          workoutExercise={workoutExercise}
          index={index}
          onUpdateExerciseData={updateExerciseData}
        />
      ))}
      
      <View style={styles.builderButtons}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={onSave}
        >
          <Text style={styles.saveButtonText}>
            {editingWorkout ? 'Update Workout' : 'Save Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  builderContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  builderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  workoutNameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  selectedExercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  builderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 