# Road SOS

Road SOS is a hackathon MVP for automatic two-wheeler accident detection and simulated emergency response. It is built with Expo React Native, TypeScript, Expo Router, Firebase Firestore support, live motion sensors, GPS location, and QR medical ID scanning.

> Road SOS MVP is for demonstration only and should not be relied on for real emergency response.

## MVP Scope

- Rider emergency profile creation
- Live ride monitoring with accelerometer, gyroscope, and GPS
- Crash confidence scoring from a movement + impact + confirmation state machine
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
