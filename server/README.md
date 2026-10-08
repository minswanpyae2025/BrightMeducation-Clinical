# Bright Meducation Clinical — Google Cloud Run Streaming Voice Service

A high-performance, on-demand WebSocket streaming voice server engineered for **Google Cloud Run** to power 10-minute live clinical OSCE consultation examinations.

## Key Features

1. **Scales to Zero (`--min-instances 0`)**:
   - Rests completely at 0 instances when no student is testing, incurring **$0 idle cost**.
   - Boots up on-demand in ~1-2 seconds when an OSCE voice session starts.

2. **10+ Minute Sustained Live Session (`--timeout 3600`)**:
   - Overcomes standard serverless function 10-second timeouts.
   - Maintains continuous WebSocket streaming connection with heartbeat keep-alives throughout the 10-minute OSCE examination.

3. **Ultra-Low Latency Streaming Pipeline**:
   - **Candidate Audio/Text In**: Receives live speech from student.
   - **Gemini Flash 3.* Streaming Reasoning**: Generates clinical patient responses with streaming tokens grounded in the case template (chief complaint, script triggers, vitals, rubric).
   - **Phrase-Level Streaming TTS Chunking**: Synthesizes speech incrementally on punctuation/phrase boundaries (`။`, `,`, `.`), cutting time-to-first-sound from 5s down to <400ms!

4. **Authentication & 20-Credits Quota Enforcement**:
   - Validates Supabase user session token (`JWT`).
   - Verifies and deducts 20 credits per station via `deduct_station_credits` RPC.
   - Rejects uncredited or unauthorized connections.

---

## 1-Click Deployment to Google Cloud Run

Ensure you are logged into Google Cloud:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Run the deployment script:
```bash
./deploy-cloud-run.sh
```

Or deploy manually via `gcloud`:
```bash
gcloud run deploy brightmed-voice-service \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 3600 \
  --session-affinity \
  --port 8080 \
  --set-env-vars GOOGLE_API_KEY="YOUR_KEY",SUPABASE_URL="https://YOUR_PROJECT.supabase.co",SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_KEY"
```

Once deployed, copy the WebSocket URL (e.g., `wss://brightmed-voice-service-xxxx.a.run.app/live-osce`) into your frontend environment:
```env
VITE_VOICE_STREAMING_URL=wss://brightmed-voice-service-xxxx.a.run.app/live-osce
```
