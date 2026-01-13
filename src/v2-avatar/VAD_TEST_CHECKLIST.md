# Neural VAD Implementation - Testing Checklist

## Pre-Test Setup

1. **Dependencies**
   - ✅ `onnxruntime-web` is installed (verified: v1.23.2)
   - ✅ All imports are correct
   - ✅ No linting errors

2. **Browser Requirements**
   - Chrome or Safari (latest versions)
   - Microphone permissions enabled
   - WebAssembly support

## Testing Steps

### 1. Start Development Servers
```bash
# Terminal 1: API Server
cd frontend
node dev-server.mjs

# Terminal 2: React App
cd frontend
npm start
```

### 2. Navigate to Avatar Page
- Open browser to: `http://localhost:3000/v2-avatar/[persona-id]`
- Or use a known persona like: `http://localhost:3000/v2-avatar/qatar`

### 3. Check Console Logs
Open browser DevTools (F12) → Console tab

**Expected logs on page load:**
- No errors related to `useNeuralVAD` import
- No errors related to `onnxruntime-web`

### 4. Start Session
- Click "Start Conversation" button
- Wait for connection
- Check console for:
  - `[VAD]` logs should NOT appear yet (mic is muted)

### 5. Enable Microphone
- Click the microphone button to unmute
- Check console for:
  - `[VAD] Loading Silero VAD model...`
  - `[VAD] Model loaded successfully` (or error if model fails)
  - `[VAD] Audio processing initialized`
  - `[VAD] Started processing`

### 6. Test Speech Detection

#### Test Case 1: Clear Speech (Should Pass)
- Speak clearly for > 500ms
- Expected: Console shows `[VAD] Speech confirmed`
- Expected: Avatar responds (if VAD is working)

#### Test Case 2: Brief Sound (Should Fail)
- Make a brief cough or "uh" (< 500ms)
- Expected: Console shows `[VAD] Speech detected but NOT confirmed`
- Expected: Avatar does NOT respond

#### Test Case 3: Background Noise
- Create background noise (hum, keyboard typing)
- Expected: VAD rejects (no confirmation)
- Expected: Avatar does NOT interrupt

### 7. Check Event Gating
Monitor console for user speech events:
- `[USER_SPEECH] 🗣️ User started speaking (Tavus event)`
- `[USER_SPEECH] ✅ VAD confirmed: Actual speech detected` OR
- `[USER_SPEECH] 🔇 VAD rejected: Not confirmed speech (likely noise)`

### 8. Performance Checks
- Monitor CPU usage in Task Manager / Activity Monitor
- Should be minimal increase (< 5% CPU)
- UI should remain responsive
- No frame drops

## Troubleshooting

### Issue: Model Loading Fails
**Symptoms:**
- Console shows: `[VAD] Model load error: ...`
- CORS errors or network errors

**Solutions:**
- Check internet connection (model downloads from CDN)
- Check browser console for CORS errors
- Verify model URL is accessible: https://models.silero.ai/vad_models/v4/silero_vad.onnx
- System will continue without VAD (graceful degradation)

### Issue: No Audio Processing
**Symptoms:**
- No `[VAD]` logs when mic is enabled
- `localAudioTrack` is null

**Solutions:**
- Check microphone permissions
- Verify Daily.co session is established
- Check if `getLocalAudioTrack()` returns a track
- Check console for AudioContext errors

### Issue: High CPU Usage
**Symptoms:**
- CPU spikes when mic is enabled
- UI becomes laggy

**Solutions:**
- Reduce `PROCESSING_INTERVAL_MS` in useNeuralVAD.js
- Check if model inference is running too frequently
- Verify audio processing is async (not blocking)

### Issue: VAD Not Gating Events
**Symptoms:**
- Avatar still interrupts on brief sounds
- No `[VAD]` confirmation/rejection logs

**Solutions:**
- Verify VAD checker is set in DailyEventManager
- Check if `vadRef.current` is properly initialized
- Verify `setVADSpeechChecker` is called in `startTavusSession`

## Expected Console Output (Success Case)

```
[INIT] ✅ Neural VAD gating enabled for user speech events
[VAD] Loading Silero VAD model...
[VAD] Model loaded successfully
[VAD] Audio processing initialized
[VAD] Started processing
[USER_SPEECH] 🗣️ User started speaking (Tavus event)
[USER_SPEECH] ✅ VAD confirmed: Actual speech detected
[VAD] Speech confirmed: prob=0.85, duration=650ms
```

## Performance Benchmarks (Expected)

- **Model Load Time:** < 2 seconds (first load)
- **Inference Latency:** < 20ms per frame
- **CPU Usage:** < 5% increase when active
- **Memory Usage:** < 50MB for model + processing
- **False Positive Rate:** < 10% (brief sounds rejected)
- **False Negative Rate:** < 5% (clear speech detected)
