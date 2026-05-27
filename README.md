# Road SOS 🚨

## AI-Powered Emergency Response System for Two-Wheeler Accident Detection and Emergency Routing

Road SOS is a mobile emergency-response MVP for two-wheeler riders. It is designed for situations where a rider may suffer an accident, become unconscious, and be unable to manually call for help.

The system combines:

- **Auto SOS** — sensor + ML-assisted accident detection
- **Emergency Corridor** — route planning from responder location to accident site and hospital
- **QR Medical ID** — emergency medical information access for responders

Road SOS is not just a panic button. It is a complete emergency workflow that detects possible crashes, starts a safety countdown, creates an SOS event, helps responders route faster, and gives access to critical medical information.

---

## Problem

Two-wheeler accidents become more dangerous when emergency response is delayed.

Common problems include:

- the rider may become unconscious
- the rider may not be able to call an ambulance
- accident location may not be clear
- family members may not be informed quickly
- responders may not know the rider’s blood group or medical conditions
- ambulances may get delayed in traffic
- responders may not know which nearby hospital is suitable
- emergency coordination is slow and fragmented

Road SOS tries to reduce this delay by making the emergency response flow automatic, data-driven, and easier for responders to act on.

---

## Solution Overview

Road SOS has three major modules.

### 1. Auto SOS

Auto SOS monitors phone sensor data during a ride and detects possible accident patterns using:

- accelerometer readings
- gyroscope readings
- GPS/location data
- rule-based crash scoring
- ML model prediction
- post-impact confirmation
- rider response countdown

If a possible crash is detected, the rider gets a countdown screen. If the rider does not cancel, the app triggers an SOS event.

### 2. Emergency Corridor

Emergency Corridor helps responders plan the route:

```text
Responder Current Location → Accident Location → Recommended Hospital
```

It uses:

- accident GPS location from the SOS event
- responder’s current GPS location
- Google Routes API for route and ETA
- Google Places API for nearby hospitals
- Google Maps direction links

The goal is to reduce ambulance/responder delay by quickly identifying where to go and which hospital to route toward.

### 3. QR Medical ID

QR Medical ID gives responders quick access to emergency information such as:

- rider name
- blood group
- allergies
- medical conditions
- emergency contact
- vehicle number
- insurance status

The QR is intended as a separate emergency medical ID. It should not be placed on a number plate or HSRP plate.

---

## Key Features

### Auto SOS

- Real accelerometer readings
- Real gyroscope readings
- GPS tracking
- ML-based motion-pattern classification
- Rule-based crash confidence scoring
- Hybrid final crash decision
- False-positive reduction
- Countdown before SOS trigger
- SOS event creation
- Responder dashboard update

### ML Accident Detection

Road SOS uses a trained ML model through a FastAPI backend.

The mobile app collects motion sensor data, extracts statistical features, and sends them to the ML backend.

The backend returns:

- prediction: accident / normal
- probability
- risk level
- model status

The app does not use ML alone as the final trigger. It combines:

```text
ML prediction
+ rule-based crash score
+ GPS movement context
+ post-impact confirmation
= final crash decision
```

This helps reduce false positives from normal phone shaking or rotation.

### Emergency Corridor

The responder dashboard can generate a route plan using real location data.

The route is:

```text
Responder current GPS location
↓
Accident GPS location
↓
Recommended nearby hospital
```

The feature can show:

- total ETA
- route distance
- accident location
- selected hospital
- route to accident
- route to hospital
- full Google Maps corridor route
- corridor priority
- limitations for real-world integrations

### QR Medical ID

The app can generate and display a QR-based medical profile for emergency use.

Responders can scan the QR to view emergency information quickly.

---

## Tech Stack

### Mobile App

- Expo React Native
- TypeScript
- Expo Router
- expo-sensors
- expo-location
- expo-camera
- expo-notifications
- react-native-qrcode-svg
- Firebase Firestore
- Google Maps / Routes / Places APIs

### ML Backend

- Python
- FastAPI
- scikit-learn
- joblib
- NumPy
- Pandas
- Uvicorn
- Render deployment

### Database

- Firebase Firestore
- Local fallback mode if Firebase is unavailable

---

## Project Architecture

```text
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
    - ML result
    - Rule score
    - GPS context
    - Post-impact checks
    ↓
Crash Countdown
    ↓
SOS Event Created
    ↓
Responder Dashboard
    ↓
Emergency Corridor
    ↓
QR Medical ID
```

---

## What Is Real in This MVP

This MVP includes real working components:

- real accelerometer readings
- real gyroscope readings
- real GPS location
- real ML backend API
- real model inference through FastAPI
- real hybrid crash decision logic
- real QR generation
- real QR scanning
- real emergency event creation
- real responder dashboard flow
- real Google Maps route links
- Google Routes API support if configured
- Google Places API support if configured

---

## What Is Not Fully Integrated Yet

Some features require official partnerships or protected APIs, so they are not fully live in the MVP:

- real ambulance dispatch
- real emergency service calling
- real traffic police alerts
- real smart traffic signal control
- live hospital ICU/bed/trauma capacity
- government emergency corridor authorization
- real insurance or police report generation

The MVP is built to demonstrate how these integrations would work once official access is available.

---

## Safety Disclaimer

Road SOS is a hackathon MVP and demonstration prototype.

It should not be used as a real emergency response system yet.

The app does not currently contact real ambulance, police, hospitals, or emergency services unless official integrations are added.

The ML model improves motion-pattern classification but has not yet been validated on real-world two-wheeler crash datasets at production safety standards.

---

## Folder Structure

```text
Road-SOS/
│
├── app/
│   ├── index.tsx
│   ├── profile.tsx
│   ├── ride.tsx
│   ├── crash-detected.tsx
│   ├── sos-triggered.tsx
│   ├── dashboard.tsx
│   ├── qr-id.tsx
│   ├── scan-qr.tsx
│   └── settings.tsx
│
├── src/
│   ├── components/
│   ├── constants/
│   ├── lib/
│   │   ├── crashDetection.ts
│   │   ├── mlFeatureExtraction.ts
│   │   ├── mlClient.ts
│   │   ├── hybridCrashDecision.ts
│   │   ├── emergencyCorridor.ts
│   │   ├── googleRoutes.ts
│   │   ├── googlePlaces.ts
│   │   ├── geo.ts
│   │   ├── firebase.ts
│   │   └── profile.ts
│   └── types/
│
├── ml-backend/
│   ├── main.py
│   ├── model_loader.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── accident_model_real.pkl
│   └── README.md
│
├── .env.example
├── README.md
├── package.json
└── app.json
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
EXPO_PUBLIC_ML_API_URL=https://your-road-sos-ml-backend.onrender.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

For final demo, use the deployed ML backend URL, not `127.0.0.1`.

---

## Running the Mobile App

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start -c
```

Then open the app using Expo Go or a development build.

---

## Running the ML Backend Locally

Go to the backend folder:

```bash
cd ml-backend
```

Install Python dependencies:

```bash
py -m pip install -r requirements.txt
```

Run the FastAPI server:

```bash
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open the health endpoint:

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "modelLoaded": true
}
```

---

## Deploying the ML Backend on Render

The ML backend can be deployed as a FastAPI web service on Render.

### Render Settings

```text
Root Directory: ml-backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

After deployment, Render will provide a URL like:

```text
https://your-road-sos-ml-backend.onrender.com
```

Use that URL in `.env`:

```env
EXPO_PUBLIC_ML_API_URL=https://your-road-sos-ml-backend.onrender.com
```

Restart Expo after changing `.env`:

```bash
npx expo start -c
```

---

## ML Backend API

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "modelLoaded": true
}
```

### Predict

```http
POST /predict
```

The mobile app sends extracted sensor features to the backend.

Example response:

```json
{
  "prediction": "accident",
  "probability": 0.87,
  "riskLevel": "HIGH",
  "modelUsed": true
}
```

---

## Auto SOS Logic

The Auto SOS system is designed to avoid triggering emergency alerts from simple phone shaking.

It checks:

- whether the rider was moving
- whether a strong motion/impact pattern happened
- whether gyroscope values changed sharply
- whether GPS context supports the event
- whether motion stopped after the event
- whether the ML model predicts a risky pattern
- whether the rider failed to respond during countdown

Basic flow:

```text
Ride starts
↓
Sensors activate
↓
Sensor data is collected
↓
ML features are extracted
↓
ML backend returns prediction
↓
Hybrid crash decision runs
↓
Crash countdown starts if risk is high
↓
Rider can cancel if safe
↓
If no response, SOS event is created
```

---

## False Positive Reduction

The app should not trigger SOS just because the phone is shaken or rotated.

Road SOS reduces false positives by checking:

- movement before possible impact
- sensor spike pattern
- GPS movement context
- post-impact stillness
- ML probability
- rule-based crash score

Example:

```text
Phone shaking while sitting
→ high sensor movement
→ GPS says not moving
→ hybrid logic blocks SOS
```

---

## Emergency Event Data

When SOS is triggered, the app creates an emergency event.

Example:

```json
{
  "eventId": "event_123",
  "riderName": "Kabir Khan",
  "bloodGroup": "B+",
  "medicalConditions": "None",
  "emergencyContactPhone": "+91XXXXXXXXXX",
  "latitude": 23.2599,
  "longitude": 77.4126,
  "accidentLocation": {
    "latitude": 23.2599,
    "longitude": 77.4126
  },
  "locationLink": "https://maps.google.com/?q=23.2599,77.4126",
  "crashScore": 86,
  "mlProbability": 0.91,
  "riskLevel": "HIGH",
  "status": "SOS_TRIGGERED",
  "createdAt": "server_timestamp"
}
```

---

## Emergency Corridor

Emergency Corridor is the responder-side routing feature.

It is designed to route:

```text
Responder Current Location → Accident Location → Recommended Hospital
```

### Real Inputs

- accident GPS location from SOS event
- responder current GPS location
- nearby hospital results from Google Places API
- traffic-aware routing from Google Routes API
- Google Maps direction links

### Output

The system can show:

- selected hospital
- route from responder to accident
- route from accident to hospital
- full corridor route
- total ETA
- total distance
- corridor priority
- Google Maps navigation buttons

### Important Limitation

Road SOS does not currently have real ambulance fleet data or live hospital bed capacity data.

That means the production-oriented MVP uses the responder’s current GPS location as the responder/ambulance starting point.

Real ambulance availability and live hospital capacity require official integrations with ambulance providers, hospitals, or government systems.

---

## Emergency Corridor Flow

```text
SOS event created
↓
Responder opens dashboard
↓
Responder taps Generate Emergency Corridor
↓
App gets responder current location
↓
App reads accident GPS location
↓
App searches nearby hospitals
↓
App calculates routes and ETAs
↓
App recommends hospital
↓
Responder opens Google Maps route
```

---

## QR Medical ID

QR Medical ID gives responders quick access to emergency medical details.

It can show:

```text
Rider name
Blood group
Medical conditions
Allergies
Emergency contact
Vehicle number
Insurance status
```

### QR Legal Note

The QR should not be placed on the vehicle number plate or HSRP plate.

Safer placements:

- helmet
- keychain
- emergency medical card
- document holder
- approved emergency sticker

---

## Firestore Collections

### profiles

Stores rider emergency profile data.

Example:

```json
{
  "name": "Kabir Khan",
  "age": 17,
  "bloodGroup": "B+",
  "medicalConditions": "None",
  "allergies": "None",
  "emergencyContactName": "Parent / Guardian",
  "emergencyContactPhone": "+91XXXXXXXXXX",
  "vehicleNumber": "MP XX XX XXXX",
  "insuranceStatus": "Active"
}
```

### accidentEvents

Stores SOS events and corridor plans.

Example:

```json
{
  "eventId": "event_123",
  "riderName": "Kabir Khan",
  "bloodGroup": "B+",
  "latitude": 23.2599,
  "longitude": 77.4126,
  "crashScore": 86,
  "mlProbability": 0.91,
  "riskLevel": "HIGH",
  "status": "SOS_TRIGGERED",
  "corridorPlan": null
}
```

---

## Emergency Status Flow

Emergency events can move through these statuses:

```text
SOS_TRIGGERED
↓
CORRIDOR_GENERATED
↓
AMBULANCE_DISPATCHED
↓
PATIENT_PICKED_UP
↓
HOSPITAL_NOTIFIED
↓
RESOLVED
```

In the MVP, these statuses are controlled from the responder dashboard.

---

## Demo Flow

Use this flow for judging or presentation:

```text
1. Open Road SOS.
2. Create or view rider emergency profile.
3. Start ride monitoring.
4. Show live sensor readings.
5. Show ML backend connected.
6. Show ML prediction and hybrid decision.
7. Trigger a controlled crash-like event or backup demo trigger.
8. Crash countdown appears.
9. Rider does not cancel.
10. Auto SOS creates emergency event.
11. Open responder dashboard.
12. Generate Emergency Corridor.
13. Show route from responder to accident to hospital.
14. Open Google Maps route.
15. Show QR Medical ID.
```

---

## Setup Checklist

Before demo:

```text
1. ML backend deployed on Render
2. /health endpoint returns modelLoaded true
3. EXPO_PUBLIC_ML_API_URL set in .env
4. Google Maps API key added in .env
5. Expo restarted with npx expo start -c
6. Location permission allowed
7. Sensors working on real phone
8. Dashboard opens correctly
9. Emergency Corridor route links work
10. QR Medical ID opens correctly
```

---

## Development Commands

### Start App

```bash
npx expo start -c
```

### Type Check

```bash
npm run typecheck
```

### Check Expo Dependencies

```bash
npx expo install --check
```

### Start ML Backend Locally

```bash
cd ml-backend
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Compile Python Backend

```bash
py -m compileall ml-backend
```

---

## Future Scope

Road SOS can later be expanded with:

- real ambulance dispatch integration
- 112 India emergency integration
- WhatsApp/SMS emergency alerts
- verified responder login
- traffic police control room integration
- smart traffic signal priority
- live hospital bed/ICU/trauma availability
- encrypted medical data storage
- native Android/iOS background crash detection
- offline SOS fallback
- insurance accident report generation
- police accident report generation
- government road safety dashboard

---

## Limitations

Current MVP limitations:

- emergency dispatch is not live
- hospital capacity is not live
- traffic police integration is not live
- smart signal control is not live
- the ML model is not validated on real-world crash datasets
- background detection may require native builds for production reliability
- QR medical ID must follow local vehicle and privacy rules


---

## Team

Built for a road safety hackathon.

Project focus:

- mobile accident detection
- ML-assisted crash classification
- emergency routing
- QR medical identity
- responder dashboard
- road safety innovation
