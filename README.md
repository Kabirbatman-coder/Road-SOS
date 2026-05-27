# Road SOS 🚨

## AI-Powered Emergency Response System for Two-Wheeler Accidents

Road SOS is a mobile emergency-response MVP built for two-wheeler accident situations where the rider may be unconscious or unable to call for help.

The system combines:

1. **Auto SOS** — real sensor + ML-based crash detection  
2. **Emergency Corridor** — route planning from responder location to accident site and hospital  
3. **QR Medical ID** — emergency medical identity access for responders  

The goal is simple:

> Detect serious crashes automatically, trigger help when the rider cannot respond, and guide responders faster to the accident location and hospital.

---

## Problem

Two-wheeler accidents become more dangerous when emergency help is delayed.

Common problems:

- the rider may become unconscious
- the rider may not be able to call an ambulance
- family members may not be informed quickly
- responders may not know the rider’s blood group or medical details
- ambulances may get delayed in traffic
- finding a suitable nearby hospital takes time
- there is poor coordination between victim, responder, hospital, and emergency systems

Road SOS tries to reduce this delay using a mobile-first emergency response system.

---

## Solution Overview

Road SOS has three major modules.

---

## 1. Auto SOS

Auto SOS automatically detects possible accidents using phone sensor data and ML-assisted motion analysis.

The app uses:

- accelerometer
- gyroscope
- GPS/location
- crash confidence score
- ML model prediction
- rule-based crash logic
- rider response countdown

If the rider does not cancel the alert, the app creates an SOS emergency event.

Flow:

```text
Ride starts
↓
Phone sensors activate
↓
Motion data is collected
↓
Features are sent to ML backend
↓
ML + rule logic decides crash risk
↓
Crash countdown starts
↓
Rider does not cancel
↓
Auto SOS triggers
↓
Emergency event is created
2. Emergency Corridor

Emergency Corridor helps responders navigate from their current location to the accident location and then to a hospital.

The route is:

Responder Current Location
↓
Accident Location
↓
Recommended Hospital

The feature uses:

actual accident GPS location from the SOS event
responder’s current GPS location
Google Maps / Routes / Places APIs if configured
route ETA
route distance
nearby hospital discovery
Google Maps direction links

Important:

Road SOS does not claim to have real ambulance fleet control, real traffic police signal control, or live hospital capacity unless those official integrations are added later.

3. QR Medical ID

QR Medical ID gives responders quick access to emergency medical information.

It can show:

rider name
blood group
allergies
medical conditions
emergency contact
vehicle number
insurance status

Legal note:

The QR should not be placed on the number plate or HSRP plate. It should be used as a separate emergency medical ID, such as on a helmet, keychain, emergency card, document holder, or approved emergency sticker.

Tech Stack
Mobile App
Expo React Native
TypeScript
Expo Router
expo-sensors
expo-location
expo-camera
expo-notifications
react-native-qrcode-svg
Firebase Firestore
Google Maps / Routes / Places APIs
ML Backend
Python
FastAPI
scikit-learn
joblib
NumPy
Pandas
Uvicorn
Render deployment
Database
Firebase Firestore
Local fallback mode if Firebase is unavailable
Architecture
Road SOS Mobile App
    ↓
Live Phone Sensors
    - Accelerometer
    - Gyroscope
    - GPS
    ↓
Feature Extraction
    ↓
ML Backend
    - Random Forest model
    - Accident probability
    - Risk level
    ↓
Hybrid Crash Decision
    - ML prediction
    - Rule score
    - GPS context
    - Post-impact checks
    ↓
SOS Countdown
    ↓
Emergency Event
    ↓
Responder Dashboard
    ↓
Emergency Corridor
    ↓
QR Medical ID   ```

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
