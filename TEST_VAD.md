# Neural VAD Testing Guide

## Quick Test Checklist

### 1. Check Browser Console
- Open browser DevTools (F12)
- Check for any errors related to:
  - `onnxruntime-web` loading
  - Model download from `https://models.silero.ai/vad_models/v4/silero_vad.onnx`
  - Audio context initialization
  - VAD processing errors

### 2. Test VAD Initialization
- Navigate to `/v2-avatar/[persona-id]` route
- Open browser console
- Look for log messages:
  - `[VAD] Loading Silero VAD model...`
  - `[VAD] Model loaded successfully` (or error message)
  - `[VAD] Audio processing initialized`
  - `[VAD] Started processing`

### 3. Test Speech Detection
- Enable microphone (click mic button)
- Make different sounds:
  - ✅ **Should detect**: Clear speech (>500ms)
  - ❌ **Should ignore**: Brief coughs, hums, background noise
  - ❌ **Should ignore**: Sounds < 500ms duration

### 4. Test Event Gating
- Watch console for:
  - `[VAD] Speech confirmed: prob=X, duration=Xms`
  - `[USER_SPEECH] ✅ VAD confirmed: Actual speech detected`
  - `[USER_SPEECH] 🔇 VAD rejected: Not confirmed speech (likely noise)`

### 5. Performance Checks
- Monitor CPU usage (should be minimal)
- Check for frame drops or UI lag
- VAD processing should not block main thread

## Expected Behavior

### Normal Operation
1. VAD loads model on first microphone enable
2. VAD processes audio every 30ms (non-blocking)
3. Speech events are gated through VAD
4. Only confirmed speech triggers avatar interruption

### Error Handling
- If model fails to load: System continues without VAD (graceful degradation)
- If audio fails: VAD stops but doesn't crash the app
- If inference fails: Errors are logged but don't break functionality

## Common Issues

### Model Loading Fails
- Check network connection
- Verify model URL is accessible
- Check browser console for CORS errors

### No Audio Processing
- Check microphone permissions
- Verify `localAudioTrack` is obtained
- Check AudioContext initialization

### High CPU Usage
- Reduce `PROCESSING_INTERVAL_MS` if needed
- Check if model inference is running too frequently

## Debug Logging

Enable verbose logging by checking console for:
- `[VAD]` prefix: All VAD-related logs
- `[USER_SPEECH]` prefix: Speech event processing
- `[MODULE-LOCK]` prefix: Module lock interactions with VAD
