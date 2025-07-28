import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { useSettingsStore } from '../stores/useSettingsStore';

interface RestTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({ visible, onClose }) => {
  const { theme } = useSettingsStore();
  const colors = Colors[theme];
  
  const [restTime, setRestTime] = useState(90);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setTimeRemaining(restTime);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  }, [isTimerActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, []);

  // Reset timer when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeRemaining(restTime);
      setIsTimerActive(false);
    }
  }, [visible, restTime]);

  return (
    <Modal
      visible={visible}
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
  );
};

const styles = StyleSheet.create({
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