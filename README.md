# BrightMeducation Clinical — AI OSCE Simulation

> **Clinical OSCE simulation web platform focused on mobile phones (iOS / Android) and iPads/tablets, built for Bright Meducation.**

---

## 🩺 Overview

**BrightMeducation Clinical** is a production-grade, Apple iOS-inspired interactive OSCE (Objective Structured Clinical Examination) simulation web application. Designed with a clean, minimal light blue and white aesthetic, the application provides medical students and junior doctors with real-time, voice-driven clinical simulation encounters.

### 🌟 Key Highlights

- **Mobile & iPad First Design**: Tailored for touch devices (`100dvh`, `viewport-fit=cover`, safe-area bottom inset padding for Android gesture navigation and iOS home indicator).
- **Two Core Categories**:
  1. **History Taking (ရောဂါရာဇဝင် မေးမြန်းခြင်း)**
  2. **Physical Examination (လက်တွေ့ စမ်းသပ်စစ်ဆေးခြင်း)**
- **Four Clinical Sub-Categories**:
  - **CVS** (Cardiovascular / နှလုံးနှင့် သွေးကြော)
  - **Respiratory** (အဆုတ်နှင့် အသက်ရှူလမ်းကြောင်း)
  - **Abdomen** (ဝမ်းဗိုက်နှင့် အစာခြေစနစ်) — Includes the 52-year-old male acute abdominal pain & RUQ examination case
  - **CNS** (Central Nervous System / ဦးနှောက်နှင့် အာရုံကြော)
- **Dynamic Template-Based Architecture**:
  - Clinical cases are loaded dynamically from the **Supabase** `stations` database table.
  - Medical educators can add, customize, or update stations directly in Supabase using standard JSONB columns (`candidate_brief`, `vitals`, `script_triggers`, `physical_exam_systems`, `rubric`, `model_summary`).
  - Offline fallback included.
- **Strict Credit Economy (20 Credits per Station)**:
  - Exactly **20 credits** deducted per OSCE station attempt.
  - Balances are securely authenticated and deducted server-side via Supabase RPC (`deduct_station_credits`) into `profiles.credits`. No client-side artificial balance manipulation.
- **Dual Language Support (English & Burmese)**:
  - Instant toggle between **Burmese (မြန်မာ)** and **English**.
  - Defaulting to Burmese for voice synthesis, patient dialogue, and clinical feedback.
- **On-Demand Google Cloud & Gemini AI Engine**:
  - **Gemini 3.8 Flash** edge function (`api/ai-chat.ts`) grounded strictly in clinical case facts to prevent hallucinations.
  - **Google Cloud Speech-to-Text** (`api/stt.ts`) for real-time Burmese (`my-MM`) and English voice recognition.
  - **Google Cloud Text-to-Speech** (`api/tts.ts`) with high-fidelity Burmese neural voice (`my-MM-Standard-A`).
- **Live 2D Animated Patient**:
  - Dynamic facial expressions (eye blinking, real-time lip-sync visemes).
  - 6 physical distress gestures: *Chest Clutching*, *Shortness of Breath*, *Pain Wincing*, *Abdominal Guarding*, *Headache Temple Rubbing*, and *Attentive Nodding*.
- **Physical Examination Stethoscope Simulator**:
  - Realistic bedside maneuvers (Inspection, Palpation, Percussion, Auscultation).
  - Synthesized Web Audio stethoscope playback: S1/S2 heart sounds, systolic murmur, vesicular breath sounds, crackles, and wheezing.
- **Post-Station Scorecard & Feedback**:
  - Standardized OSCE domain scoring, checklist completion, and candidate performance summary.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (iOS Design System)
- **Icons**: Lucide React
- **Audio Simulation**: Web Audio API (Oscillators, BiquadFilters, GainNodes)
- **Database & Auth**: Supabase (`@supabase/supabase-js`)
  - Google OAuth Sign-in & Magic Link
  - PostgreSQL schema with Row-Level Security (RLS) and stored procedures
- **Backend**: Vercel Serverless Functions (`/api`)
  - `api/ai-chat.ts` — Gemini Flash clinical dialogue reasoning
  - `api/stt.ts` — Google Cloud Speech-to-Text
  - `api/tts.ts` — Google Cloud Text-to-Speech

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/minswanpyae2025/BrightMeducation-Clinical.git
cd BrightMeducation-Clinical
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Cloud / Gemini AI (for Vercel Serverless Functions)
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

### 3. Database Setup (Supabase)

Execute the SQL script in `supabase_schema.sql` inside your Supabase project's **SQL Editor**:
- Creates `profiles`, `stations`, `station_attempts`, and `credit_transactions` tables.
- Creates `deduct_station_credits(user_uuid, station_identifier, cost)` stored procedure.
- Seeds default station templates including History Taking (CVS, Respi, Abdomen, CNS) and Physical Examination (Focused Abdominal Exam for 52-year-old male).

### 4. Development & Build

```bash
# Run local dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📱 Mobile & Tablet Viewport Features

- Dynamic viewport height handling (`min-h-dvh`).
- Safe-area inset spacing (`pb-safe-bottom` with `max(2rem, env(safe-area-inset-bottom, 24px))`) to ensure push-to-talk buttons and controls are never covered by Android navigation bars or iOS home indicators.
- Responsive multi-column layout for iPads (`md:grid-cols-12`) and streamlined compact stages on smartphones.

---

## 📄 License

Proprietary — © **Bright Meducation**. All rights reserved.
