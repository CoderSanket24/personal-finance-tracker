import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PermissionsAndroid,
  Platform,
  View,
} from 'react-native';
import { AppColors } from '../theme';
import { RunAnywhere } from '@runanywhere/core';
import LiveAudioStream from 'react-native-live-audio-stream';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  isSTTLoaded: boolean;
  isSTTDownloading?: boolean;
  isSTTLoading?: boolean;
  sttDownloadProgress?: number;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  isSTTLoaded,
  isSTTDownloading = false,
  isSTTLoading = false,
  sttDownloadProgress = 0,
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
      
      // 1. Request Permission first (Android requires this at runtime)
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone to transcribe transactions.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Microphone permission denied');
          return;
        }
      }

      // 2. Initialize
      audioChunksRef.current = [];
      LiveAudioStream.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        bufferSize: 12288,
        wavFile: 'temp.wav',
      });

      LiveAudioStream.on('data', (data: string) => {
        // Strip any base64 padding to ensure safe concatenation
        audioChunksRef.current.push(data.replace(/=/g, ''));
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

  if (isSTTDownloading || isSTTLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={AppColors.accentViolet} size="small" />
        <Text style={styles.label}>
          {isSTTDownloading 
            ? `Downloading Voice AI... (${Math.round(sttDownloadProgress)}%)` 
            : 'Loading Voice AI...'}
        </Text>
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
        {!isSTTLoaded ? 'Initializing...' : isRecording ? 'Tap to stop' : 'Voice input'}
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
