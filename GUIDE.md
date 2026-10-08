# Bright Meducation Clinical — Complete Developer & Operations Guide

> Comprehensive manual for running, modifying, and deploying both the **Frontend (React + Vite + iOS UI)** and **Backend (Google Cloud Run On-Demand Voice Streaming Engine)** with **Supabase Database** and **Gemini Flash 3.* AI**.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [Running the Application Locally](#3-running-the-application-locally)
   - [Starting the Voice Streaming Backend (`server/`)](#a-starting-the-voice-streaming-backend-server)
   - [Starting the Frontend Web App (`root`)](#b-starting-the-frontend-web-app-root)
4. [Deployment Guide](#4-deployment-guide)
   - [Deploying Backend to Google Cloud Run](#a-deploying-backend-to-google-cloud-run)
   - [Deploying Frontend to Vercel](#b-deploying-frontend-to-vercel)
   - [Configuring Supabase Database](#c-configuring-supabase-database)
5. [How to Modify the Codebase](#5-how-to-modify-the-codebase)
   - [A. Adding or Customizing Clinical Cases](#a-adding-or-customizing-clinical-cases)
   - [B. Modifying the Voice AI & Streaming Engine](#b-modifying-the-voice-ai--streaming-engine)
   - [C. Customizing the Credits Economy & Pricing](#c-customizing-the-credits-economy--pricing)
   - [D. Modifying the UI, Mobile Layout & 2D Avatar Gestures](#d-modifying-the-ui-mobile-layout--2d-avatar-gestures)
   - [E. Updating Bilingual Burmese & English Translations](#e-updating-bilingual-burmese--english-translations)
6. [Troubleshooting & Verification](#6-troubleshooting--verification)

---

## 1. Architecture Overview

```
                                ┌──────────────────────────┐
                                │      Student Device      │
                                │  (iPhone, Android, iPad) │
                                └─────────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
               HTTPS (Vercel)                                   WSS (Cloud Run)
                      │                                               │
                      ▼                                               ▼
          ┌───────────────────────┐                       ┌───────────────────────┐
          │     React Frontend    │                       │ Cloud Run Voice Engine│
          │ - iOS/iPad UI System  │                       │ - Scales to 0 when idle
          │ - Web Audio API Queue │                       │ - 3600s WebSocket     │
          │ - Dual Language (MY/EN│                       │ - Gemini Flash 3.*    │
          └───────────┬───────────┘                       │ - Phrase-chunked TTS  │
                      │                                   └───────────┬───────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                                 ┌────────────────────────┐
                                 │     Supabase Cloud     │
                                 │ - PostgreSQL Schema    │
                                 │ - 20-Credits RPC Deduct│
                                 │ - Google OAuth Auth    │
                                 │ - Template Stations DB │
                                 └────────────────────────┘
```

- **Frontend (`src/`)**: Single-page application built with React 18, TypeScript, and Tailwind CSS. Specially optimized for mobile phone viewports (360px–430px) and iPads with zero horizontal clipping.
- **Backend (`server/`)**: Containerized WebSocket service running on Node 20. Configured for Google Cloud Run with `--min-instances 0` (rests completely at 0 instances when not in use; boots on demand in ~1s).
- **Database & Auth (`supabase_schema.sql`)**: Supabase PostgreSQL database handling student profiles, credit transactions, dynamic station definitions, and rubric attempts.

---

## 2. Prerequisites & Environment Setup

### Required Tools
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Git**
- **Google Cloud SDK (`gcloud`)** *(for backend deployment)*
- **Supabase Account** *(free tier works)*

### Repository Setup
```bash
git clone https://github.com/minswanpyae2025/BrightMeducation-Clinical.git
cd BrightMeducation-Clinical
```

---

## 3. Running the Application Locally

You can run both the frontend and backend concurrently on your local machine.

### A. Starting the Voice Streaming Backend (`server/`)

1. Open a terminal and navigate to `server/`:
   ```bash
   cd server
   npm install
   ```

2. Create `server/.env` based on `server/.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys in `server/.env`:
   ```env
   PORT=8080
   GOOGLE_API_KEY=AIzaSy...your_gemini_api_key...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=ey...your_service_role_key...
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server starts listening on `http://0.0.0.0:8080` with the WebSocket at `ws://0.0.0.0:8080/live-osce`.*

4. Test health check endpoint in another terminal:
   ```bash
   curl http://localhost:8080/health
   # Expected output: {"status":"healthy","service":"brightmed-voice-service",...}
   ```

---

### B. Starting the Frontend Web App (`root`)

1. In the root directory:
   ```bash
   cd /path/to/BrightMeducation-Clinical
   npm install
   ```

2. Create `.env` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   # Point to your local or deployed Cloud Run WebSocket server:
   VITE_VOICE_STREAMING_URL=ws://localhost:8080/live-osce

   # Supabase Configuration:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_public_key

   # Google Cloud API Key (fallback edge mode):
   GOOGLE_API_KEY=AIzaSy...your_gemini_api_key...
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser (or iPad / mobile device on the same Wi-Fi).*

4. Or build and test the production bundle:
   ```bash
   npm run build
   npm run preview -- --port 3000 --host 0.0.0.0
   ```
   *Open `http://localhost:3000`.*

---

## 4. Deployment Guide

### A. Deploying Backend to Google Cloud Run

Google Cloud Run is ideal because:
1. **`--min-instances 0`**: Container instances drop to 0 when students are not testing, giving you **$0 idle hosting cost**.
2. **`--timeout 3600`**: Allows sustained 10-to-60 minute WebSocket consultations without disconnection.

#### Automated 1-Click Script
1. Log in to Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GOOGLE_CLOUD_PROJECT_ID
   ```
2. Run deployment:
   ```bash
   cd server
   ./deploy-cloud-run.sh
   ```

#### Manual Deployment via `gcloud`
```bash
cd server
gcloud run deploy brightmed-voice-service \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 3600 \
  --session-affinity \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --set-env-vars GOOGLE_API_KEY="YOUR_KEY",SUPABASE_URL="https://YOUR_PROJECT.supabase.co",SUPABASE_SERVICE_ROLE_KEY="YOUR_KEY"
```

Once deployment completes, note down the URL:
```
Service URL: https://brightmed-voice-service-xxxx.a.run.app
WebSocket URL: wss://brightmed-voice-service-xxxx.a.run.app/live-osce
```

---

### B. Deploying Frontend to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import `BrightMeducation-Clinical`.
3. Under **Environment Variables**, add:
   - `VITE_VOICE_STREAMING_URL` = `wss://brightmed-voice-service-xxxx.a.run.app/live-osce`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
   - `GOOGLE_API_KEY` = `your_gemini_api_key`
4. Deploy. Vercel will build the React app and deploy the edge functions.

---

### C. Configuring Supabase Database

1. In your [Supabase Dashboard](https://supabase.com), go to **SQL Editor**.
2. Open [`supabase_schema.sql`](file:///root/AI-Clinical/supabase_schema.sql) and paste its entire content.
3. Click **Run**. This will create:
   - Tables: `profiles`, `stations`, `station_attempts`, `credit_transactions`.
   - RPC Function: `deduct_station_credits(user_uuid, station_identifier, cost)`.
   - Seed data: All 8 clinical cases (4 History Taking + 4 Physical Examination).
4. Go to **Authentication > Providers** in Supabase and enable **Google**:
   - Add your Google OAuth Client ID and Secret from Google Cloud Console.
   - Add Vercel's redirect URL to Google OAuth Authorized Redirect URIs (`https://your-project.supabase.co/auth/v1/callback`).

---

## 5. How to Modify the Codebase

### A. Adding or Customizing Clinical Cases

Clinical cases are defined in [`src/data/cases.ts`](file:///root/AI-Clinical/src/data/cases.ts) (offline fallback) and in Supabase's `stations` table.

#### Anatomy of a Case Object
```typescript
{
  id: 'history-chest-pain',
  mainCategory: 'history_taking', // or 'physical_examination'
  subCategory: 'cvs',            // 'cvs' | 'respi' | 'abdomen' | 'cns'
  title: 'Acute Chest Pain Evaluation',
  title_my: 'ရင်ဘတ်အောင့်ခြင်း ရောဂါရာဇဝင် မေးမြန်းခြင်း',
  subtitle: '62-year-old male with crushing retrosternal pain',
  subtitle_my: 'အသက် ၆၂ နှစ်၊ ရင်ဘတ်အောင့်ဝေဒနာ ခံစားနေရသော အမျိုးသား',
  difficulty: 'Intermediate',
  durationMinutes: 10,
  creditsCost: 20, // 20 credits per station
  
  patient: {
    name: 'Arthur Pendelton',
    name_my: 'ဦးအာသာ (Arthur)',
    age: 62,
    gender: 'male',
    chiefComplaint: 'Crushing chest pain radiating to left arm',
    chiefComplaint_my: 'ဘယ်ဘက်လက်မောင်းဆီ ဖြာထွက်တဲ့ ရင်ဘတ်အောင့်ဝေဒနာ',
    defaultGesture: 'clutch_chest', // Resting avatar posture
    voicePitch: 0.9,
    voiceRate: 0.95,
  },

  candidateBrief: {
    setting: 'Emergency Department Resuscitation Bay',
    setting_my: 'အရေးပေါ်ကုသမှုဌာန (ER)',
    situation: 'Patient brought in by ambulance...',
    situation_my: 'လူနာသည် လွန်ခဲ့သော ၄၅ မိနစ်ခန့်က...',
    tasks: ['Take focused SOCRATES history', 'Identify red flags', 'Explain differential'],
    tasks_my: ['SOCRATES မူဘောင်နှင့်အညီ မေးမြန်းပါ', 'စိုးရိမ်ရသော လက္ခဏာများ ရှာဖွေပါ'],
  },

  vitals: {
    bp: '158/94 mmHg',
    hr: 104,
    rr: 22,
    spo2: 95,
    temp: 37.1,
    painScore: 8,
  },

  // Deterministic and AI prompt grounding triggers
  scriptTriggers: [
    {
      triggers: ['where', 'location', 'နေရာ', 'ဘယ်နား'],
      response: 'Right in the center of my chest, doctor. Feels like an elephant sitting on me.',
      response_my: 'ရင်ဘတ်အလယ်တည့်တည့်ကပါ ဆရာ။ ဆင်တစ်ကောင် ဖိထားသလို လေးလံကျပ်တည်းနေပါတယ်။',
      gesture: 'clutch_chest',
      rubricId: 'socrates-site',
    },
    // Add more SOCRATES questions...
  ],

  // Specific to Physical Examination stations:
  physicalExamSystems: [
    {
      id: 'abdo-system',
      name: 'Abdominal Examination',
      name_my: 'ဝမ်းဗိုက်စမ်းသပ်စစ်ဆေးခြင်း',
      summary: 'Focused exam of 9 abdominal quadrants',
      summary_my: 'ဝမ်းဗိုက် အပိုင်း ၉ ပိုင်းအား စနစ်တကျ စမ်းသပ်ခြင်း',
      points: [
        {
          id: 'ruq-palpation',
          name: 'Right Upper Quadrant (Gallbladder)',
          name_my: 'ညာဘက် ဝမ်းဗိုက်အပေါ်ပိုင်း (သည်းခြေအိတ်)',
          technique: 'palpation', // 'palpation' | 'auscultation' | 'percussion' | 'inspection'
          actionLabel: 'Deep inspiration during palpation (Murphy\'s sign)',
          actionLabel_my: 'အသက်ပြင်းပြင်း ရှူသွင်းခိုင်းပြီး ဖိစမ်းသပ်ခြင်း',
          finding: 'Arrest of inspiration due to sharp pain (Positive Murphy\'s sign).',
          finding_my: 'ပြင်းထန်စွာ နာကျင်သွားသဖြင့် အသက်ရှူရပ်တန့်သွားသည် (Murphy\'s sign positive).',
          patientReaction: 'Ow! Doctor, that hurts terribly right there!',
          patientReaction_my: 'အမလေး... နာလိုက်တာ ဆရာရယ်! အဲဒီနားက အရမ်းနာတယ်!',
          gestureOnAction: 'wincing',
          soundType: undefined, // Or 'heart_murmur' | 'lung_crackles' | 'lung_wheeze'
        }
      ]
    }
  ],

  // Grading rubric checklist
  rubric: [
    {
      id: 'socrates-site',
      title: 'Site of Pain',
      title_my: 'နာကျင်မှု စတင်သည့်နေရာ မေးမြန်းခြင်း',
      domain: 'History Taking',
      weight: 10,
      criteria: 'Candidate clarifies exact anatomical location of chest pain',
      criteria_my: 'နာကျင်မှု စတင်သည့် ခန္ဓာဗေဒနေရာအား အတိအကျ မေးမြန်းစုံစမ်းနိုင်ခြင်း',
      completed: false,
    }
  ],

  modelSummary: {
    primaryDiagnosis: 'Acute Coronary Syndrome (STEMI)',
    primaryDiagnosis_my: 'ပြင်းထန်နှလုံးသွေးကြောပိတ်ရောဂါ (Acute Coronary Syndrome)',
    sbarSituation: '62yo male with acute chest pain',
    sbarBackground: 'Hypertension, heavy smoker',
    sbarAssessment: 'High probability Acute Myocardial Infarction',
    sbarRecommendation: 'Immediate 12-lead ECG, Aspirin, Heparin, Cath Lab activation',
  }
}
```

#### How to Add a New Case
1. Add the case definition to [`src/data/cases.ts`](file:///root/AI-Clinical/src/data/cases.ts).
2. Insert a corresponding row into Supabase's `stations` table using SQL:
   ```sql
   INSERT INTO stations (id, main_category, sub_category, title, title_my, patient_name, patient_age, ...)
   VALUES ('history-asthma-2', 'history_taking', 'respi', ...);
   ```

---

### B. Modifying the Voice AI & Streaming Engine

The streaming voice logic is located in [`server/src/streamingVoicePipeline.ts`](file:///root/AI-Clinical/server/src/streamingVoicePipeline.ts).

#### 1. Changing the Gemini Model or System Prompt
In `server/src/streamingVoicePipeline.ts`:
```typescript
// Change model (e.g. gemini-2.5-flash or gemini-3.0-flash)
const model = 'gemini-2.5-flash';

// Adjust temperature:
config: {
  systemInstruction,
  temperature: 0.15, // 0.15 for strict medical consistency; 0.3 for more conversational flair
  maxOutputTokens: 300,
}
```

#### 2. Modifying the TTS Voice & Phrase-Chunking
In `server/src/streamingVoicePipeline.ts`:
```typescript
// To change Burmese or English voices:
const voiceName = this.language === 'my' 
  ? 'my-MM-Standard-A' 
  : (this.template.gender === 'female' ? 'en-US-Journey-F' : 'en-US-Journey-D');

// To tune phrase chunking speed:
private hasSpeechBoundary(text: string): boolean {
  if (this.language === 'my') {
    // Burmese punctuation boundary:
    return text.includes('။') || text.includes('၊') || text.length > 50;
  }
  return text.includes('.') || text.includes('?') || text.includes(',') || text.length > 60;
}
```

---

### C. Customizing the Credits Economy & Pricing

Each station costs **20 credits** by default.

#### 1. Changing the Credit Cost per Station
- In [`src/data/cases.ts`](file:///root/AI-Clinical/src/data/cases.ts): Change `creditsCost: 20` to your desired number (e.g., `creditsCost: 25`).
- In [`src/App.tsx`](file:///root/AI-Clinical/src/App.tsx#L131): Change `supabaseService.deductStationCredits(currentCase.id, 20)` to `currentCase.creditsCost`.
- In [`server/src/auth.ts`](file:///root/AI-Clinical/server/src/auth.ts): Update the minimum credit check and deduction from `20` to the new amount.

#### 2. Modifying Welcome Credits for New Users
In [`supabase_schema.sql`](file:///root/AI-Clinical/supabase_schema.sql):
```sql
-- Change default welcome credits from 100:
CREATE TABLE profiles (
  ...
  credits INTEGER NOT NULL DEFAULT 100
);
```

---

### D. Modifying the UI, Mobile Layout & 2D Avatar Gestures

#### 1. Color Palette & Theme
Colors are configured in [`tailwind.config.js`](file:///root/AI-Clinical/tailwind.config.js):
```javascript
ios: {
  blue: '#007AFF',        // Main Apple iOS light blue
  'blue-light': '#EBF5FF',
  'bg-canvas': '#F8FAFC',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
}
```

#### 2. Avatar Character & Gestures
Avatar animations are located in [`src/components/AnimatedPatient.tsx`](file:///root/AI-Clinical/src/components/AnimatedPatient.tsx):
- Supported Gestures:
  - `clutch_chest` — Hand on sternum with wincing eyes.
  - `short_of_breath` — Rapid breathing animation and flared nostrils.
  - `wincing` — Squinting eyes and tension lines.
  - `holding_abdomen` — Arm placed over the abdominal region.
  - `rub_temple` — Hand raised to temple (headache/migraine).
  - `nodding` — Attentive head tilt acknowledging doctor.
- To add a new gesture:
  1. Add the string to `AvatarGesture` in [`src/types/index.ts`](file:///root/AI-Clinical/src/types/index.ts).
  2. Add the SVG gesture posture in [`src/components/AnimatedPatient.tsx`](file:///root/AI-Clinical/src/components/AnimatedPatient.tsx).

---

### E. Updating Bilingual Burmese & English Translations

UI strings are centralized in [`src/locales/i18n.ts`](file:///root/AI-Clinical/src/locales/i18n.ts):
```typescript
export const translations = {
  my: {
    historyTaking: 'ရောဂါရာဇဝင် မေးမြန်းခြင်း',
    physicalExam: 'ခန္ဓာကိုယ် စမ်းသပ်စစ်ဆေးခြင်း',
    credits: 'Credits',
    enterRoom: 'အခန်းထဲသို့ ဝင်ရောက်မည်',
    // Edit any Burmese labels here...
  },
  en: {
    historyTaking: 'History Taking',
    physicalExam: 'Physical Examination',
    credits: 'Credits',
    enterRoom: 'Enter Consultation Room',
    // Edit any English labels here...
  }
};
```

---

## 6. Troubleshooting & Verification

### Common Issues & Solutions

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Horizontal scrolling on small phones** | Long text string or container without `min-w-0` | Keep `overflow-x-hidden`, `min-w-0`, and `truncate` or `break-words` on all grid columns and labels. |
| **WebSocket connection fails (`4402`)** | User has less than 20 credits | Check credits balance or add credits in the User Profile modal or Supabase `profiles` table. |
| **WebSocket connection error** | `VITE_VOICE_STREAMING_URL` not running or incorrect | Verify the backend server is running (`curl http://localhost:8080/health`). For Cloud Run, ensure the URL starts with `wss://`. |
| **No sound on mobile browser** | Mobile browsers block autoplay before first interaction | The user must tap "Push to Talk", "Enter Station", or any button to initialize the browser's `AudioContext`. |
| **Burmese text rendered with squares or misaligned** | Missing Unicode font stack | The app integrates `Pyidaungsu`, `Noto Sans Myanmar`, and `Padauk` in `src/index.css` by default. |

---

## 7. Summary of Key Files

```
AI-Clinical/
├── GUIDE.md                           <-- THIS DEVELOPER MANUAL
├── package.json                       <-- Frontend dependencies & scripts
├── supabase_schema.sql                <-- Database schema, RPC functions, seed data
├── .env.example                       <-- Frontend environment template
│
├── server/                            <-- GOOGLE CLOUD RUN STREAMING ENGINE
│   ├── package.json                   <-- Backend dependencies
│   ├── tsconfig.json                  <-- Backend TypeScript configuration
│   ├── Dockerfile                     <-- Multi-stage production container
│   ├── deploy-cloud-run.sh            <-- 1-click deployment script (--min-instances 0)
│   ├── cloudbuild.yaml                <-- Google Cloud Build CI/CD
│   └── src/
│       ├── index.ts                   <-- HTTP & WebSocket server (port 8080)
│       ├── auth.ts                    <-- Supabase JWT & 20-credits verification
│       ├── sessionManager.ts          <-- 10-minute OSCE timer & keepalive
│       ├── streamingVoicePipeline.ts  <-- Gemini Flash streaming & TTS chunker
│       └── types.ts                   <-- Server data types
│
└── src/                               <-- REACT FRONTEND APPLICATION
    ├── App.tsx                        <-- Root application view & station coordinator
    ├── data/cases.ts                  <-- 8 clinical case templates (Bilingual)
    ├── hooks/useVoiceConvo.ts         <-- Real-time conversation hook (streaming + fallback)
    ├── lib/
    │   ├── streamingVoiceClient.ts    <-- Web Audio API chunk queue player & WebSocket
    │   ├── supabase.ts                <-- Supabase client, credits management, Google auth
    │   └── stationsService.ts         <-- Dynamic station fetching
    └── components/
        ├── Header.tsx                 <-- Mobile-optimized compact header
        ├── CategoryHub.tsx            <-- 2-Category & 4-System switcher
        ├── CaseBriefing.tsx           <-- Station instructions & candidate brief
        ├── HistoryStationView.tsx     <-- Voice dialogue stage & live indicators
        ├── PhysicalExamStationView.tsx<-- Stethoscope simulation & landmark findings
        ├── AnimatedPatient.tsx        <-- 2D responsive vector avatar with 6 gestures
        ├── PushToTalkButton.tsx       <-- Mobile-friendly audio input button
        ├── AudioWaveform.tsx          <-- Real-time voice frequency equalizer
        └── AuthModal.tsx              <-- Google sign-in & credits display
```
