import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { useExerciseStore, Exercise } from '../../../stores/useExerciseStore';
import { useWorkoutStore, WorkoutExercise } from '../../../stores/useWorkoutStore';
import { useProgressStore } from '../../../stores/useProgressStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { Colors } from '../../../constants/Colors';

const categories: Exercise['category'][] = ['push', 'pull', 'legs', 'core'];

export default function ExercisesScreen() {
  const { exercises, selectedExercises, toggleExerciseSelection, addExercise, clearSelectedExercises, getSortedExercises } = useExerciseStore();
  const sortedExercises = getSortedExercises();
  const { addWorkout } = useWorkoutStore();
  const { recordWorkoutCompletion, updateWorkoutStreak } = useProgressStore();
  const { theme } = useSettingsStore();
  const colors = Colors[theme];
  const [selectedCategory, setSelectedCategory] = useState<Exercise['category'] | 'all'>('all');
  
  // Add Exercise Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'push' as Exercise['category'],
    muscleGroup: '',
    equipment: '',
  });
  
  // Create Workout Modal State
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = sortedExercises
    .filter(exercise => {
      // Filter by category
      const categoryMatch = selectedCategory === 'all' || exercise.category === selectedCategory;
      
      // Filter by search query
      const searchMatch = searchQuery === '' || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exercise.equipment && exercise.equipment.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return categoryMatch && searchMatch;
    });

  const isSelected = (exerciseId: string) => 
    selectedExercises.some(e => e.id === exerciseId);

  const handleAddExercise = () => {
    if (!newExercise.name.trim() || !newExercise.muscleGroup.trim()) {
      Alert.alert('Missing Information', 'Please fill in exercise name and muscle group.');
      return;
    }

    addExercise({
      name: newExercise.name.trim(),
      category: newExercise.category,
      muscleGroup: newExercise.muscleGroup.trim(),
      equipment: newExercise.equipment.trim() || undefined,
    });

    // Reset form
    setNewExercise({
      name: '',
      category: 'push',
      muscleGroup: '',
      equipment: '',
    });
    setShowAddModal(false);
    Alert.alert('Success!', 'Exercise added to library!');
  };

  const handleCreateWorkoutFromExercises = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises Selected', 'Please select exercises first.');
      return;
    }

    const initialExercises = selectedExercises.map(exercise => ({
      exercise,
      sets: 3,
      reps: 12,
      weight: 0,
      notes: '',
    }));
    
    setWorkoutExercises(initialExercises);
    setShowWorkoutModal(true);
  };

  const updateExerciseData = (index: number, field: keyof WorkoutExercise, value: string | number) => {
    setWorkoutExercises(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Missing Workout Name', 'Please enter a name for your workout.');
      return;
    }

    const newWorkout = {
      name: workoutName,
      date: new Date().toLocaleDateString(),
      exercises: workoutExercises,
    };
    
    addWorkout(newWorkout);

    const workoutId = Date.now().toString();
    const exercisesForProgress = workoutExercises.map(we => ({
      name: we.exercise.name,
      weight: we.weight,
      reps: we.reps,
      sets: we.sets,
    }));
    
    recordWorkoutCompletion(workoutId, workoutName, exercisesForProgress);
    updateWorkoutStreak();

    setWorkoutName('');
    setWorkoutExercises([]);
    setShowWorkoutModal(false);
    clearSelectedExercises();
    Alert.alert('Success!', 'Workout created and progress updated!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedExercises.length === 0 && (
        <Text style={[styles.title, { color: colors.text }]}>💪 Exercise Library</Text>
      )}
      
      {selectedExercises.length > 0 && (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedText}>
            {selectedExercises.length} exercises selected
          </Text>
          <View style={styles.selectedBannerButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                clearSelectedExercises();
                Alert.alert('Cleared!', 'All exercise selections cleared.');
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createWorkoutButton}
              onPress={handleCreateWorkoutFromExercises}
            >
              <Text style={styles.createWorkoutButtonText}>Create Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.addExerciseButton,
          selectedExercises.length > 0 && styles.addExerciseButtonCompact
        ]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={[
          styles.addExerciseButtonText,
          selectedExercises.length > 0 && styles.addExerciseButtonTextCompact
        ]}>
          {selectedExercises.length > 0 ? '+ Add Custom Exercise' : '+ Add Custom Exercise'}
        </Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises, muscle groups, or equipment..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.searchClearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.searchClearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton, 
            { backgroundColor: colors.surface, borderColor: colors.border },
            selectedCategory === 'all' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryText, 
            { color: colors.text },
            selectedCategory === 'all' && { color: colors.surface }
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedCategory === category && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText, 
              { color: colors.text },
              selectedCategory === category && { color: colors.surface }
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredExercises.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            {searchQuery ? 
              `No exercises found for "${searchQuery}"` : 
              `No exercises found in ${selectedCategory} category`
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.exerciseCard,
              { backgroundColor: colors.surface },
              isSelected(item.id) && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => toggleExerciseSelection(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseMainInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.muscleGroupCompact, { color: colors.textSecondary }]}>{item.muscleGroup}</Text>
              </View>
              <View style={styles.exerciseRightSection}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                {isSelected(item.id) && (
                  <View style={styles.selectedCheckmark}>
                    <Text style={styles.selectedCheckmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </View>
            {item.equipment && (
              <Text style={[styles.equipmentCompact, { color: colors.textMuted }]}>{item.equipment}</Text>
            )}
          </TouchableOpacity>
        )}
      />
      )}

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Exercise</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Exercise Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Incline Dumbbell Press"
              value={newExercise.name}
              onChangeText={(text) => setNewExercise(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Category *</Text>
            <View style={styles.categorySelector}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categorySelectorButton,
                    newExercise.category === category && styles.categorySelectorButtonActive
                  ]}
                  onPress={() => setNewExercise(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categorySelectorText,
                    newExercise.category === category && styles.categorySelectorTextActive
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Muscle Group *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Chest, Upper Chest"
              value={newExercise.muscleGroup}
              onChangeText={(text) => setNewExercise(prev => ({ ...prev, muscleGroup: text }))}
            />

            <Text style={styles.inputLabel}>Equipment (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Dumbbells, Cable Machine"
              value={newExercise.equipment}
              onChangeText={(text) => setNewExercise(prev => ({ ...prev, equipment: text }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleAddExercise}
              >
                <Text style={styles.modalSaveButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showWorkoutModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Workout</Text>
            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Workout Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Push Day, Upper Body"
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            <Text style={styles.inputLabel}>Set Your Weights & Reps:</Text>
            
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

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowWorkoutModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleSaveWorkout}
              >
                <Text style={styles.modalSaveButtonText}>Save Workout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getCategoryColor = (category: Exercise['category']) => {
  const colors = {
    push: '#ef4444',
    pull: '#3b82f6',
    legs: '#10b981',
    cardio: '#f59e0b',
    core: '#8b5cf6',
  };
  return colors[category];
};

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
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectedBannerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  exerciseCardSelected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  exerciseMainInfo: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  muscleGroupCompact: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  exerciseRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedCheckmark: {
    backgroundColor: '#3b82f6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  equipmentCompact: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 4,
  },

  muscleGroup: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  equipment: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  selectedIndicator: {
    color: '#3b82f6',
    fontWeight: 'bold',
    marginTop: 8,
  },
  
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  createWorkoutButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  createWorkoutButtonText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addExerciseButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseButtonCompact: {
    padding: 10,
    marginBottom: 10,
  },
  addExerciseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addExerciseButtonTextCompact: {
    fontSize: 14,
  },
  
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    paddingRight: 40,
  },
  searchClearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  searchClearButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearSearchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  modalContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categorySelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categorySelectorButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categorySelectorText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  categorySelectorTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingBottom: 32,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
 
  exerciseConfigCard: {
    backgroundColor: 'white',
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