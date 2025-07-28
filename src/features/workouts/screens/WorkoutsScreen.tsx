import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useWorkoutStore, WorkoutExercise } from '../../../stores/useWorkoutStore';
import { useExerciseStore } from '../../../stores/useExerciseStore';
import { useProgressStore } from '../../../stores/useProgressStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Colors } from '../../../constants/Colors';

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
  
  // Rest Timer State
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(90); // Default 90 seconds
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rest Timer Functions
  const startRestTimer = (seconds = restTime) => {
    setTimeRemaining(seconds);
    setShowRestTimer(true);
    setIsTimerActive(false); 
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimeRemaining(restTime);
  };

  const startTimer = () => {
    setIsTimerActive(true);
  };

  const pauseTimer = () => {
    setIsTimerActive(false);
  };

  const closeTimer = () => {
    stopTimer();
    setShowRestTimer(false);
    setTimeRemaining(restTime);
  };

  // Timer effect
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            Alert.alert('Rest Complete!', 'Time to start your next set! 💪');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          onPress={() => startRestTimer()}
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

      {/* Workout Builder Modal */}
      {showBuilder && (
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
            <View key={workoutExercise.exercise.id} style={styles.exerciseConfigCard}>
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
                    onChangeText={(value) => updateExerciseData(index, 'sets', parseInt(value) || 0)}
                    keyboardType="numeric"
                    placeholder="3"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={workoutExercise.reps.toString()}
                    onChangeText={(value) => updateExerciseData(index, 'reps', parseInt(value) || 0)}
                    keyboardType="numeric"
                    placeholder="12"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={workoutExercise.weight.toString()}
                    onChangeText={(value) => updateExerciseData(index, 'weight', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              
              <TextInput
                style={styles.notesInput}
                placeholder="Notes (optional)"
                value={workoutExercise.notes || ''}
                onChangeText={(value) => updateExerciseData(index, 'notes', value)}
                multiline
              />
            </View>
          ))}
          
          <View style={styles.builderButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={resetForm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveWorkout}
            >
              <Text style={styles.saveButtonText}>
                {editingWorkout ? 'Update Workout' : 'Save Workout'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
            <View style={[styles.workoutCard, { backgroundColor: colors.surface }]}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>{item.date}</Text>
                  <Text style={[styles.exerciseCount, { color: colors.textMuted }]}>
                    {item.exercises.length} exercises
                  </Text>
                </View>
                <View style={styles.workoutActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditWorkout(item)}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWorkout(item.id, item.name)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.exercisesList}>
                {item.exercises.map((workoutExercise, index) => (
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
          )}
        />
      )}

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimer}
        transparent={true}
        animationType="slide"
        onRequestClose={closeTimer}
      >
        <View style={[styles.timerOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.timerModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timerTitle, { color: colors.text }]}>⏱️ Rest Timer</Text>
            
            <Text style={[
              styles.timerDisplay, 
              { color: isTimerActive ? '#f59e0b' : colors.textMuted }
            ]}>
              {formatTime(timeRemaining)}
            </Text>
            {isTimerActive && (
              <Text style={[styles.timerStatus, { color: colors.success }]}>
                ⏳ Timer Running...
              </Text>
            )}
            
            {/* Time Adjustment Controls */}
            <View style={styles.timeAdjustment}>
              <TouchableOpacity 
                style={[styles.adjustButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  const newTime = Math.max(10, timeRemaining - 30);
                  setTimeRemaining(newTime);
                  if (newTime !== timeRemaining) {
                    setRestTime(newTime);
                  }
                }}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>-30s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.adjustButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  const newTime = Math.max(10, timeRemaining - 10);
                  setTimeRemaining(newTime);
                  if (newTime !== timeRemaining) {
                    setRestTime(newTime);
                  }
                }}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>-10s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.adjustButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  const newTime = timeRemaining + 10;
                  setTimeRemaining(newTime);
                  setRestTime(newTime);
                }}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>+10s</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.adjustButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  const newTime = timeRemaining + 30;
                  setTimeRemaining(newTime);
                  setRestTime(newTime);
                }}
              >
                <Text style={[styles.adjustButtonText, { color: colors.text }]}>+30s</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timerControls}>
              {!isTimerActive ? (
                <TouchableOpacity 
                  style={[styles.timerControlButton, styles.startButton]}
                  onPress={startTimer}
                >
                  <Text style={styles.timerControlText}>▶️ Start</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.timerControlButton, styles.pauseButton]}
                  onPress={pauseTimer}
                >
                  <Text style={styles.timerControlText}>⏸️ Pause</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.timerControlButton, styles.resetButton]}
                onPress={resetTimer}
              >
                <Text style={styles.timerControlText}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timerPresets}>
              <Text style={[styles.presetsLabel, { color: colors.text }]}>Quick Times:</Text>
              <View style={styles.presetButtons}>
                {[60, 90, 120, 180].map((seconds) => (
                  <TouchableOpacity
                    key={seconds}
                    style={[styles.presetButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => {
                      setRestTime(seconds);
                      setTimeRemaining(seconds);
                    }}
                  >
                    <Text style={[styles.presetButtonText, { color: colors.text }]}>
                      {seconds < 60 ? `${seconds}s` : `${seconds/60}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.closeTimerButton, { backgroundColor: colors.error }]}
              onPress={closeTimer}
            >
              <Text style={[styles.closeTimerText, { color: colors.surface }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
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
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  
  timerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  timerStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeAdjustment: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  adjustButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adjustButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerControls: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  timerControlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  resetButton: {
    backgroundColor: '#6b7280',
  },
  timerControlText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerPresets: {
    marginBottom: 20,
    alignItems: 'center',
  },
  presetsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  presetButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeTimerButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeTimerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 