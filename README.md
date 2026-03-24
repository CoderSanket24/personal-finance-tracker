# 🛡️ Privacy-First Finance Tracker
**Built for the HackXtreme Hackathon**

The ultimate personal finance and expense tracking application where **your data never leaves your device**. Combining cutting-edge On-Device AI models with a beautiful, modern React Native UI.

---

## 🌟 Key Features

### 🎙️ 100% Offline Voice Logging
Why type when you can speak? Tap the microphone and say *"I spent ₹1200 on petrol"*. The app uses the **Sherpa ONNX Whisper** model running purely on your phone's processor to perfectly transcribe and auto-categorize your expenses without ever pinging an internet server.

### 🧠 On-Device Financial Advisor
Have you overspent on food this month? Ask the AI! Powered natively by **LiquidAI LFM2 350M** (a heavily optimized, lightning-fast offline LLM), the financial advisor analyzes your exact transaction history locally and gives you real-time insights—all while your phone stays in Airplane Mode.

### 🔒 Zero Cloud & Zero Tracking
In an era of data harvesting, this app requires absolutely zero permissions to the internet to function. All transaction history, state management, and AI inference takes place natively within the app sandbox.

### 🎨 Beautiful, Responsive UI
- **Glassmorphism Design:** Deep primary colors, vibrant cyan accents, and blurred gradient cards.
- **Adaptive SafeArea:** Pixel-perfect spacing edge-to-edge, fully compatible with all modern notches, camera cutouts, and dynamic islands.

---

## 🛠️ Technical Stack & Architecture

- **Frontend:** React Native 0.83 (New Architecture)
- **State Management:** Local React Context API with `useReducer` for complex transaction filtering.
- **AI Execution Engine:** `@runanywhere/core` via C++ NDK bindings for Llama.cpp and ONNX Runtime.
- **Audio Processing:** High-fidelity pure Base64 PCM 16-bit, 16kHz memory streaming (custom-buffered at 12,288 bytes to perfectly align mathematical padding and eliminate Whisper STT static hallucination).

---

## 🚀 Running the Project

### Prerequisites
- Node.js >= 18
- Android SDK / Android Studio (JDK 17)
- React Native CLI

### Setup
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start the Metro Bundler
npm run start -- --reset-cache

# 3. Build the native Android app (requires NDK for compiling C++ models)
npm run android
\`\`\`

---

*Developed for HackXtreme* 🚀
