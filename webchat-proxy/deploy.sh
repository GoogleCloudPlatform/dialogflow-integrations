#!/bin/bash
set -e

SERVICE_NAME="webchat-proxy"
# TODO: Replace 'YOUR_PROJECT_ID' with the Project ID you specified
PROJECT_ID=${PROJECT_ID:-"YOUR_PROJECT_ID"}

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud project selected."
  echo "Run 'gcloud config set project <PROJECT_ID>' to set one."
  exit 1
fi

echo "Deploying $SERVICE_NAME to Cloud Run (Region: $REGION, Project: $PROJECT_ID)..."

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --platform managed

echo "Deployment complete."
