#!/bin/bash
set -e

SERVICE_NAME="webchat-proxy"
# TODO: Replace 'YOUR_PROJECT_ID' with the Project ID you specified
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud project selected."
  echo "Run 'gcloud config set project <PROJECT_ID>' to set one."
  exit 1
fi

# Service Account to run the service
SA_NAME="webchat-proxy-sa"
SERVICE_ACCOUNT=${SERVICE_ACCOUNT:-"${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"}

# CCaIP Configuration
CCAIP_SUBDOMAIN=${CCAIP_SUBDOMAIN:-"default-subdomain"}
CCAIP_DEFAULT_MENU_ID=${CCAIP_DEFAULT_MENU_ID:-"1"}
CCAIP_DEFAULT_LANG=${CCAIP_DEFAULT_LANG:-"en"}

echo "Deploying $SERVICE_NAME to Cloud Run (Region: $REGION, Project: $PROJECT_ID)..."
echo "Using Service Account: $SERVICE_ACCOUNT"
echo "CCaIP Subdomain: $CCAIP_SUBDOMAIN"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account "$SERVICE_ACCOUNT" \
  --set-secrets="CCAIP_PASSWORD=ccaip-password:latest" \
  --set-env-vars="CCAIP_SUBDOMAIN=${CCAIP_SUBDOMAIN},CCAIP_DEFAULT_MENU_ID=${CCAIP_DEFAULT_MENU_ID},CCAIP_DEFAULT_LANG=${CCAIP_DEFAULT_LANG}" \
  --min-instances 1 \
  --max-instances 1 \
  --platform managed

echo "Deployment complete."
