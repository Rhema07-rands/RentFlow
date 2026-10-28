import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertContextType {
  showAlert: (title: string, message: string, onClose?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>();
  
  // Animation value for the vertical position
  const translateY = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = (newTitle: string, newMessage: string, onClose?: () => void) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setOnCloseCallback(() => onClose);
    setIsVisible(true);

    // Clear any existing timeouts if showAlert is called rapidly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Slide down animation
    Animated.spring(translateY, {
      toValue: Platform.OS === 'ios' ? 60 : 40,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8
    }).start();

    // Auto-hide after 3.5 seconds
    timeoutRef.current = setTimeout(() => {
      hideAlert(onClose);
    }, 3500);
  };

  const hideAlert = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (callback) {
        callback();
      }
    });
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {isVisible && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
          {/* Tapping the toast manually dismisses it early */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => hideAlert(onCloseCallback)} style={styles.toastContent}>
            <View style={styles.iconContainer}>
              {/* Dynamic icon color based on error vs success (simple check) */}
              <Ionicons 
                name={title.toLowerCase().includes('error') || title.toLowerCase().includes('fail') ? "alert-circle" : "checkmark-circle"} 
                size={28} 
                color={title.toLowerCase().includes('error') || title.toLowerCase().includes('fail') ? "#EF4444" : "#38BDF8"} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message} numberOfLines={2}>{message}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999, // Ensure it floats above everything
    elevation: 9999,
  },
  toastContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});
