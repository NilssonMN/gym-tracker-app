import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Workout } from '../stores/useWorkoutStore';
import { Colors } from '../constants/Colors';
import { useSettingsStore } from '../stores/useSettingsStore';

interface WorkoutCardProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
  onDelete: (workoutId: string, workoutName: string) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onEdit,
  onDelete,
}) => {
  const { theme } = useSettingsStore();
  const colors = Colors[theme];

  return (
    <View style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutName, { color: colors.text }]}>{workout.name}</Text>
          <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>{workout.date}</Text>
          <Text style={[styles.exerciseCount, { color: colors.textMuted }]}>
            {workout.exercises.length} exercises
          </Text>
        </View>
        <View style={styles.workoutActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(workout)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(workout.id, workout.name)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.exercisesList}>
        {workout.exercises.map((workoutExercise, index) => (
          <View key={index} style={styles.exerciseDetailItem}>
            <Text style={[styles.exerciseItemName, { color: colors.text }]}>
              • {workoutExercise.exercise.name}
            </Text>
            <Text style={[styles.exerciseItemDetails, { color: colors.primary }]}>
              {workoutExercise.sets} sets × {workoutExercise.reps} reps
              {workoutExercise.weight > 0 && ` @ ${workoutExercise.weight}kg`}
            </Text>
            {workoutExercise.notes && (
              <Text style={[styles.exerciseItemNotes, { color: colors.textSecondary }]}>
                Note: {workoutExercise.notes}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  workoutCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#3b82f6',
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#dbeafe',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  exercisesList: {
    marginBottom: 0,
  },
  exerciseDetailItem: {
    marginBottom: 8,
  },
  exerciseItemName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  exerciseItemDetails: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 8,
    marginTop: 2,
  },
  exerciseItemNotes: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    marginTop: 2,
    fontStyle: 'italic',
  },
}); 