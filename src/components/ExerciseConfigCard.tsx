import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { WorkoutExercise } from '../stores/useWorkoutStore';

interface ExerciseConfigCardProps {
  workoutExercise: WorkoutExercise;
  index: number;
  onUpdateExerciseData: (index: number, field: keyof WorkoutExercise, value: string | number) => void;
}

export const ExerciseConfigCard: React.FC<ExerciseConfigCardProps> = ({
  workoutExercise,
  index,
  onUpdateExerciseData,
}) => {
  return (
    <View style={styles.exerciseConfigCard}>
      <Text style={styles.exerciseConfigName}>
        {workoutExercise.exercise.name}
      </Text>
      <Text style={styles.exerciseConfigMuscle}>
        {workoutExercise.exercise.muscleGroup}
      </Text>
      
      <View style={styles.exerciseInputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            style={styles.numberInput}
            value={workoutExercise.sets.toString()}
            onChangeText={(value) => onUpdateExerciseData(index, 'sets', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.numberInput}
            value={workoutExercise.reps.toString()}
            onChangeText={(value) => onUpdateExerciseData(index, 'reps', parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="12"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.numberInput}
            value={workoutExercise.weight.toString()}
            onChangeText={(value) => onUpdateExerciseData(index, 'weight', parseFloat(value) || 0)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
      
      <TextInput
        style={styles.notesInput}
        placeholder="Notes (optional)"
        value={workoutExercise.notes || ''}
        onChangeText={(value) => onUpdateExerciseData(index, 'notes', value)}
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  exerciseConfigCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseConfigName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  exerciseConfigMuscle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  exerciseInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: 'white',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white',
    minHeight: 40,
  },
}); 