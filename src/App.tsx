import 'react-native-gesture-handler'; // Must be at the top!
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Note: react-native-screens is shimmed in index.js for iOS New Architecture compatibility
import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX } from '@runanywhere/onnx';
import { ModelServiceProvider, registerDefaultModels } from './services/ModelService';
import { FinanceProvider } from './store/FinanceContext';
import { AppColors } from './theme';
import {
  DashboardScreen,
  LogTransactionScreen,
  TransactionHistoryScreen,
  AIAdvisorScreen,
  ChatScreen,
  ToolCallingScreen,
  SpeechToTextScreen,
  TextToSpeechScreen,
  VoicePipelineScreen,
} from './screens';
import { RootStackParamList } from './navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    // Initialize SDK
    const initializeSDK = async () => {
      try {
        // Initialize RunAnywhere SDK (Development mode doesn't require API key)
        await RunAnywhere.initialize({
          environment: SDKEnvironment.Development,
        });

        // Register backends statically
        LlamaCPP.register();
        ONNX.register();

        // Register default models
        await registerDefaultModels();

        console.log('RunAnywhere SDK initialized successfully');
        setIsSDKReady(true);
      } catch (error) {
        console.error('Failed to initialize RunAnywhere SDK:', error);
        setIsSDKReady(true);
      }
    };

    initializeSDK();
  }, []);

  if (!isSDKReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ModelServiceProvider>
        <FinanceProvider>
          <StatusBar barStyle="light-content" backgroundColor={AppColors.primaryDark} />
          <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: AppColors.primaryDark,
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: AppColors.textPrimary,
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
              },
              cardStyle: {
                backgroundColor: AppColors.primaryDark,
              },
              // iOS-like animations
              ...TransitionPresets.SlideFromRightIOS,
            }}
          >
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogTransaction"
              component={LogTransactionScreen}
              options={{ title: 'Log Transaction' }}
            />
            <Stack.Screen
              name="TransactionHistory"
              component={TransactionHistoryScreen}
              options={{ title: 'Transaction History' }}
            />
            <Stack.Screen
              name="AIAdvisor"
              component={AIAdvisorScreen}
              options={{ title: 'AI Advisor' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Chat' }}
            />
            <Stack.Screen
              name="ToolCalling"
              component={ToolCallingScreen}
              options={{ title: 'Tool Calling' }}
            />
            <Stack.Screen
              name="SpeechToText"
              component={SpeechToTextScreen}
              options={{ title: 'Speech to Text' }}
            />
            <Stack.Screen
              name="TextToSpeech"
              component={TextToSpeechScreen}
              options={{ title: 'Text to Speech' }}
            />
            <Stack.Screen
              name="VoicePipeline"
              component={VoicePipelineScreen}
              options={{ title: 'Voice Pipeline' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        </FinanceProvider>
      </ModelServiceProvider>
    </GestureHandlerRootView>
  );
};

export default App;
