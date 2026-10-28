import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCall } from '../../../contexts/CallContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CallScreen() {
  const { id: targetUserId, name: contactName, mode } = useLocalSearchParams<{
    id: string;
    name: string;
    mode: 'outgoing' | 'incoming';
  }>();
  const router = useRouter();
  const {
    callState,
    isMuted,
    isSpeaker,
    callDuration,
    startCall,
    acceptCall,
    endCall,
    rejectCall,
    toggleMute,
    toggleSpeaker,
  } = useCall();

  // Pulse animation for ringing/calling
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callState]);

  // Start the outgoing call
  useEffect(() => {
    if (mode === 'outgoing' && targetUserId) {
      startCall(targetUserId, contactName || 'Unknown');
    }
  }, []);

  // Navigate back when call ends
  useEffect(() => {
    if (callState === 'idle' && mode) {
      // Small delay so user sees "Call Ended" before navigating away
    }
  }, [callState]);

  const handleEndCall = useCallback(() => {
    endCall();
    setTimeout(() => router.back(), 1500);
  }, [endCall, router]);

  const handleReject = useCallback(() => {
    rejectCall();
    router.back();
  }, [rejectCall, router]);

  const handleAccept = useCallback(async () => {
    await acceptCall();
  }, [acceptCall]);

  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Incoming Call';
      case 'connected':
        return formatTime(callDuration);
      case 'ended':
        return 'Call Ended';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = () => {
    switch (callState) {
      case 'connected':
        return '#10B981';
      case 'ended':
        return '#EF4444';
      default:
        return '#38BDF8';
    }
  };

  const displayName = contactName || targetUserId || 'Unknown';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background gradient */}
      <View style={styles.bgGradient}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.encryptionBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.encryptionText}>End-to-End Encrypted</Text>
        </View>
      </View>

      {/* Avatar & Info */}
      <View style={styles.callerInfo}>
        <Animated.View
          style={[
            styles.avatarRing,
            {
              transform: [{ scale: callState === 'connected' ? 1 : pulseAnim }],
              borderColor: getStatusColor(),
            },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </Animated.View>

        <Text style={styles.callerName}>{displayName}</Text>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '25' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Connected state — show mute, speaker, end */}
        {callState === 'connected' && (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color={isMuted ? '#0F172A' : '#F8FAFC'}
              />
              <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
              <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeaker ? 'volume-high' : 'volume-medium'}
                size={28}
                color={isSpeaker ? '#0F172A' : '#F8FAFC'}
              />
              <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelActive]}>
                Speaker
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Calling state — show end call only */}
        {callState === 'calling' && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
              <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Ringing (incoming) — show accept and reject */}
        {callState === 'ringing' && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.rejectCallButton} onPress={handleReject}>
              <Ionicons name="call" size={32} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
              <Text style={styles.callActionLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.acceptCallButton} onPress={handleAccept}>
              <Ionicons name="call" size={32} color="#FFFFFF" />
              <Text style={styles.callActionLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ended state */}
        {callState === 'ended' && (
          <View style={styles.controlsRow}>
            <Text style={styles.endedText}>Call has ended</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Background decoration
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    top: -100,
    left: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    top: 200,
    right: -80,
  },
  bgCircle3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    bottom: 100,
    left: -60,
  },

  // Top bar
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  encryptionText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },

  // Caller info
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#38BDF8',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Controls
  controlsContainer: {
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  controlButtonActive: {
    backgroundColor: '#F8FAFC',
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  controlLabelActive: {
    color: '#0F172A',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  rejectCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  callActionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  endedText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '600',
  },
});
