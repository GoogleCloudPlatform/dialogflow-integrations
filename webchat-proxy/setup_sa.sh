#!/bin/bash
set -e

SA_NAME="webchat-proxy-sa"
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud project selected."
  exit 1
fi

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Creating service account: $SA_NAME in project: $PROJECT_ID..."
if gcloud iam service-accounts describe "$SA_EMAIL" > /dev/null 2>&1; then
  echo "Service account already exists."
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Webchat Proxy Service Account"
fi

echo "Granting roles..."

# Dialogflow Admin permissions for streaming and participant management
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/dialogflow.admin"

# Log Writer for Cloud Run logging
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/logging.logWriter"

# Secret Accessor for CCaIP API key
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

echo "--------------------------------------------------"
echo "Setup complete."
echo "Service Account Email: $SA_EMAIL"
echo "Update your deploy.sh with this email or use the environment variable."
echo "--------------------------------------------------"
