# Road SOS

Road SOS is a hackathon MVP for automatic two-wheeler accident detection and simulated emergency response. It is built with Expo React Native, TypeScript, Expo Router, Firebase Firestore support, live motion sensors, GPS location, and QR medical ID scanning.

> Road SOS MVP is for demonstration only and should not be relied on for real emergency response.

## MVP Scope

- Rider emergency profile creation
- Live ride monitoring with accelerometer, gyroscope, and GPS
- Crash confidence scoring from a movement + impact + confirmation state machine
- Optional ML motion-pattern classification through a hosted FastAPI backend
- 30-second crash countdown before SOS escalation
- Firestore accident event creation with AsyncStorage fallback
- Responder dashboard with simulated ambulance workflow
- QR medical ID generation and camera scanning
- Mock nearest-hospital and emergency corridor planning for Bhopal

## What Is Real

- Real accelerometer readings through `expo-sensors`
- Real gyroscope readings through `expo-sensors`
- Real GPS/location through `expo-location`
- Real crash confidence scoring in `src/lib/crashDetection.ts`
- Real rolling-window feature extraction for the RandomForest model
- Real FastAPI `/predict` integration when `EXPO_PUBLIC_ML_API_URL` is configured
- Real QR generation through `react-native-qrcode-svg`
- Real QR scanning through `expo-camera`
- Real Firestore/local accident event creation

## What Is Simulated

- Ambulance dispatch
- Emergency service calling
- SMS/WhatsApp notifications
- Traffic police corridor
- Hospital capacity
- ETA and traffic status
- ML model reliability for real-world crashes

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Expo:

   ```bash
   npx expo start
   ```

3. Open in Expo Go or a development build on a real phone. Sensors and camera are best tested on-device.

## ML Backend Deployment

The RandomForest model is a Python pickle/joblib model, so the Expo app does not load it directly. Deploy the FastAPI backend to Render and point the app at the hosted URL.

This repo includes a root `render.yaml` configured for Render:

- Root Directory: `ml-backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Python Runtime: `python-3.11.9`

Render should expose:

- `GET /health`
- `POST /predict`

Set the hosted backend URL in the Expo app `.env`:

```bash
EXPO_PUBLIC_ML_API_URL=https://your-road-sos-ml-backend.onrender.com
```

For the final hackathon demo, use the deployed Render URL, not `127.0.0.1`, `localhost`, or a laptop IP.

The app sends rolling 2-5 second accelerometer/gyroscope features to `/predict`, then combines the ML result with GPS movement context, speed drop, post-impact stillness, and shake-pattern rejection. ML alone never starts SOS.

If the hosted ML backend is offline, the app shows `ML backend offline - using rule fallback` and keeps using the rule-based crash detector without crashing.

## Firebase Env Setup

Create a local env file or configure these Expo public variables:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

If they are missing, the app does not crash. It shows `Firebase not configured - using local demo mode` and stores profiles/events in AsyncStorage.

Firestore collections:

- `profiles/{profileId}`
- `accidentEvents/{eventId}`

## Demo Flow

1. Open Road SOS.
2. Create or review the emergency profile.
3. Tap Start Ride Monitoring.
4. Watch live accelerometer, gyroscope, GPS, and crash confidence score.
5. The detector arms only after the rider has been moving above 10 km/h and the ride has run for 15 seconds.
6. A crash countdown opens only after impact plus speed-drop or post-impact stillness confirmation.
7. Cancel within 30 seconds or trigger SOS.
8. Confirm the simulated dispatch screen.
9. Open the responder dashboard and update the event status.
10. Open My QR Medical ID, then scan it from another device or screenshot.

## Future Integrations

- 112 India / official emergency services integration
- Twilio, WhatsApp, or carrier SMS for real alerts
- Google Routes API for real ETA and routing
- Hospital capacity systems
- Traffic police corridor systems
- Native Android/iOS background crash detection with production-grade battery handling

## ML Safety Disclaimer

MotionSense is a real iPhone accelerometer/gyroscope dataset, but it is mainly a human activity recognition dataset, not a real-world road crash dataset.

The ML model improves sensor-pattern classification for the MVP, but real-world deployment would require training and validation on actual two-wheeler crash and near-crash data.
