import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { useProgressStore, ProgressExercise } from '../../../stores/useProgressStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Colors } from '../../../constants/Colors';

export default function ProgressScreen() {
  const { 
    progressExercises, 
    addProgressExercise, 
    updateProgressExercise, 
    deleteProgressExercise,
    getExerciseHistory
  } = useProgressStore();
  const { theme } = useSettingsStore();
  const colors = Colors[theme];
  
  // Add/Edit Exercise Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ProgressExercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startingWeight: '',
    currentWeight: '',
    goalWeight: '',
    currentReps: '',
    targetReps: '',
    unit: 'kg' as 'kg' | 'lbs',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      startingWeight: '',
      currentWeight: '',
      goalWeight: '',
      currentReps: '',
      targetReps: '',
      unit: 'kg',
      notes: '',
    });
    setEditingExercise(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (exercise: ProgressExercise) => {
    setFormData({
      name: exercise.name,
      startingWeight: exercise.startingWeight.toString(),
      currentWeight: exercise.currentWeight.toString(),
      goalWeight: exercise.goalWeight.toString(),
      currentReps: exercise.currentReps.toString(),
      targetReps: exercise.targetReps.toString(),
      unit: exercise.unit,
      notes: exercise.notes || '',
    });
    setEditingExercise(exercise);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.startingWeight || !formData.currentWeight || !formData.goalWeight) {
      Alert.alert('Missing Information', 'Please fill in exercise name, starting weight, current weight, and goal weight.');
      return;
    }

    const exerciseData = {
      name: formData.name.trim(),
      startingWeight: parseFloat(formData.startingWeight),
      currentWeight: parseFloat(formData.currentWeight),
      goalWeight: parseFloat(formData.goalWeight),
      currentReps: parseInt(formData.currentReps) || 0,
      targetReps: parseInt(formData.targetReps) || 0,
      unit: formData.unit,
      notes: formData.notes.trim(),
    };

    if (editingExercise) {
      updateProgressExercise(editingExercise.id, exerciseData);
      Alert.alert('Success!', 'Exercise progress updated successfully!');
    } else {
      addProgressExercise(exerciseData);
      Alert.alert('Success!', 'Exercise added to progress tracking!');
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (exercise: ProgressExercise) => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete ${exercise.name} from progress tracking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProgressExercise(exercise.id);
            Alert.alert('Deleted!', 'Exercise removed from progress tracking.');
          },
        },
      ]
    );
  };

  const calculateProgress = (exercise: ProgressExercise) => {
    const totalProgress = exercise.goalWeight - exercise.startingWeight;
    const currentProgress = exercise.currentWeight - exercise.startingWeight;
    return totalProgress > 0 ? Math.min((currentProgress / totalProgress) * 100, 100) : 0;
  };

  const renderProgressCard = ({ item }: { item: ProgressExercise }) => {
    const progressPercentage = calculateProgress(item);
    
    return (
      <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.progressActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Starting</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.startingWeight}{item.unit}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.currentWeight}{item.unit}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goal</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.goalWeight}{item.unit}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Reps</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.currentReps}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target Reps</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{item.targetReps}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
              <Text style={[styles.statValue, { color: progressPercentage >= 100 ? colors.success : colors.primary }]}>
                {progressPercentage.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: progressPercentage >= 100 ? colors.success : colors.primary
                }
              ]} 
            />
          </View>
        </View>

        {/* Personal Record and Sessions */}
        <View style={styles.additionalStats}>
          <Text style={styles.prText}>
            🏆 PR: {item.personalRecord || item.currentWeight}{item.unit}
          </Text>
          <Text style={styles.sessionsText}>
            📊 {item.totalSessions || 0} sessions
          </Text>
        </View>

        {item.notes && (
          <Text style={[styles.notes, { color: colors.textSecondary }]}>📝 {item.notes}</Text>
        )}

        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last updated: {item.lastUpdated}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>📈 Progress Tracking</Text>
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={openAddModal}
      >
        <Text style={[styles.addButtonText, { color: colors.surface }]}>+ Add Exercise to Track</Text>
      </TouchableOpacity>

      {progressExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No exercises being tracked yet!</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Add an exercise to start tracking your progress</Text>
        </View>
      ) : (
        <FlatList
          data={progressExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderProgressCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add/Edit Exercise Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingExercise ? 'Edit Exercise Progress' : 'Add Exercise to Track'}
              </Text>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Exercise Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., Bench Press"
                placeholderTextColor={colors.textMuted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitButton, 
                    { backgroundColor: colors.background, borderColor: colors.border },
                    formData.unit === 'kg' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setFormData({ ...formData, unit: 'kg' })}
                >
                  <Text style={[
                    styles.unitButtonText, 
                    { color: colors.text },
                    formData.unit === 'kg' && { color: colors.surface }
                  ]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton, 
                    { backgroundColor: colors.background, borderColor: colors.border },
                    formData.unit === 'lbs' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setFormData({ ...formData, unit: 'lbs' })}
                >
                  <Text style={[
                    styles.unitButtonText, 
                    { color: colors.text },
                    formData.unit === 'lbs' && { color: colors.surface }
                  ]}>
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Starting Weight</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={formData.startingWeight}
                    onChangeText={(text) => setFormData({ ...formData, startingWeight: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Current Weight</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={formData.currentWeight}
                    onChangeText={(text) => setFormData({ ...formData, currentWeight: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Goal Weight</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={formData.goalWeight}
                onChangeText={(text) => setFormData({ ...formData, goalWeight: text })}
                keyboardType="numeric"
              />

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Current Reps</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={formData.currentReps}
                    onChangeText={(text) => setFormData({ ...formData, currentReps: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Target Reps</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={formData.targetReps}
                    onChangeText={(text) => setFormData({ ...formData, targetReps: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Any notes about your progress..."
                placeholderTextColor={colors.textMuted}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveButtonText, { color: colors.surface }]}>
                    {editingExercise ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  sessionsText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    flex: 1,
    marginRight: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  unitButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  unitButtonActive: {
    backgroundColor: '#3b82f6',
  },
  unitButtonText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  unitButtonTextActive: {
    color: 'white',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 