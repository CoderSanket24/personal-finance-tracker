import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { AppColors } from '../theme';
import { RunAnywhere } from '@runanywhere/core';
import LiveAudioStream from 'react-native-live-audio-stream';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  isSTTLoaded: boolean;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  isSTTLoaded,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const audioChunksRef = useRef<string[]>([]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handlePress = async () => {
    if (!isSTTLoaded) return;

    if (isRecording) {
      // Stop recording
      LiveAudioStream.stop();
      setIsRecording(false);
      stopPulse();

      if (audioChunksRef.current.length === 0) return;

      setIsTranscribing(true);
      try {
        const combined = audioChunksRef.current.join('');
        audioChunksRef.current = [];
        const result = await RunAnywhere.transcribe(combined, {
          language: 'en',
          punctuation: true,
        });
        if (result?.text) onTranscript(result.text);
      } catch (err) {
        console.warn('Transcription error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      audioChunksRef.current = [];
      LiveAudioStream.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 4096,
      });
      LiveAudioStream.on('data', (data: string) => {
        audioChunksRef.current.push(data);
      });
      LiveAudioStream.start();
      setIsRecording(true);
      startPulse();
    }
  };

  if (isTranscribing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={AppColors.accentViolet} size="small" />
        <Text style={styles.label}>Transcribing…</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || !isSTTLoaded}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: isRecording ? AppColors.error : AppColors.accentViolet,
            opacity: !isSTTLoaded ? 0.4 : 1,
          },
        ]}
      >
        <Text style={styles.mic}>{isRecording ? '⏹' : '🎤'}</Text>
      </Animated.View>
      <Text style={styles.label}>
        {!isSTTLoaded ? 'STT not loaded' : isRecording ? 'Tap to stop' : 'Voice input'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: AppColors.accentViolet,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mic: { fontSize: 22 },
  label: { fontSize: 11, color: AppColors.textMuted, fontWeight: '500' },
});
