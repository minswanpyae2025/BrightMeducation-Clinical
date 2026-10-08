#!/bin/bash
set -e

# ==============================================================================
# Google Cloud Run Deployment Script for Bright Meducation Voice Streaming
# Features:
#  - Scales to ZERO (--min-instances 0): Rests completely when idle, $0 cost.
#  - Runs on-demand when student initiates OSCE session.
#  - 3600-second connection timeout (--timeout 3600) for sustained 10-min OSCE sessions.
#  - Session Affinity (--session-affinity) for sticky WebSockets.
# ==============================================================================

SERVICE_NAME="brightmed-voice-service"
REGION="${GCP_REGION:-asia-southeast1}" # Singapore region for lowest latency to Myanmar & SE Asia
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Google Cloud Project ID not set."
  echo "Please run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "🚀 Deploying $SERVICE_NAME to Google Cloud Run in $REGION (Project: $PROJECT_ID)..."

# Ensure Cloud Run and Artifact Registry APIs are enabled
gcloud services enable run.googleapis.com artifactregistry.googleapis.com --project="$PROJECT_ID"

# Deploy container directly from source to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --platform managed \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 3600 \
  --session-affinity \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi

# Print assigned HTTPS / WSS endpoint URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')
WSS_URL=$(echo "$SERVICE_URL" | sed 's/https:\/\//wss:\/\//')

echo "=============================================================================="
echo "✅ Deployment Successful!"
echo "HTTP Health Endpoint:  $SERVICE_URL/health"
echo "WebSocket Streaming:   $WSS_URL/live-osce"
echo ""
echo "Next step: Set this in your frontend environment:"
echo "VITE_VOICE_STREAMING_URL=$WSS_URL/live-osce"
echo "=============================================================================="
