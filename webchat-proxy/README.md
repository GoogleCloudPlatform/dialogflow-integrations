# Webchat Proxy

A Go-based proxy server for CES webchat integrations, handling session management and gRPC streaming.

## Prerequisites

- Go 1.24 or later
- Google Cloud SDK (`gcloud`) (for deployment)

## Setup

Before running or deploying, ensure you have set your Google Cloud project and CCaIP credentials:

```bash
gcloud config set project YOUR_PROJECT_ID

# (Optional) Export CCaIP credentials for local use
export CCAIP_SUBDOMAIN="your-subdomain"
export CCAIP_PASSWORD="your-password"
export CCAIP_DEFAULT_MENU_ID="1"
export CCAIP_DEFAULT_LANG="en"
export REDIS_ADDRESS="10.0.0.1:6379"
export API_KEY="your-api-key"
```

## Running Locally

Use the provided script to start the server locally on port 8080. This script automatically handles killing any existing process on that port.

```bash
./run_local.sh
```

## Deployment

### 1. Secret Manager Setup

Before deploying to Cloud Run, you must configure the following secrets in Google Cloud Secret Manager. These secrets are required for CCaIP authentication and webhook security.

| Secret Name | Description |
| :--- | :--- |
| `ccaip-password` | The password for CCaIP API authentication. |
| `ccaip-primary-webhook-secret` | Primary secret for verifying CCaIP webhook signatures. |
| `ccaip-secondary-webhook-secret` | Secondary secret for verifying CCaIP webhook signatures. |
| `webchat-proxy-api-key` | API key required for creating sessions via the proxy. |

You can create these secrets using the following `gcloud` commands:

```bash
# Create the secrets
gcloud secrets create ccaip-password --replication-policy="automatic"
gcloud secrets create ccaip-primary-webhook-secret --replication-policy="automatic"
gcloud secrets create ccaip-secondary-webhook-secret --replication-policy="automatic"
gcloud secrets create webchat-proxy-api-key --replication-policy="automatic"

# Add versions to the secrets (replace with your actual values)
echo -n "your-password" | gcloud secrets versions add ccaip-password --data-file=-
echo -n "your-primary-secret" | gcloud secrets versions add ccaip-primary-webhook-secret --data-file=-
echo -n "your-secondary-secret" | gcloud secrets versions add ccaip-secondary-webhook-secret --data-file=-
echo -n "your-api-key" | gcloud secrets versions add webchat-proxy-api-key --data-file=-
```

### 2. Configure Service Account

Create a custom service account with the necessary permissions for Dialogflow interaction. This script also grants the service account access to the secrets created above.

```bash
./setup_sa.sh
```

### 3. Deploy to Cloud Run

Set your CCaIP subdomain using `export` before running the deployment script.

```bash
export CCAIP_SUBDOMAIN="your-subdomain"
./deploy.sh
```

## API Usage

### Create Session

Create a new session by sending a POST request.

**Endpoint:** `POST /sessions`

**Request Body:**
```json
{
  "escalation_id": "your-escalation-id",
  "participant": "projects/my-project/locations/us-central1/conversations/12345/participants/67890"
}
```

**Sample Curl:**
```bash
curl -X POST http://localhost:8080/sessions \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: your-api-key" \
  -d '{
    "escalation_id": "test-escalation",
    "participant": "projects/test-project/locations/us-central1/conversations/conv-123/participants/part-456"
  }'
```

**Response:**
```json
{
  "session_id": "conv-123",
  "ccaip_chat_id": "999"
}
```

### Delete Session

Delete an active session.

**Endpoint:** `DELETE /sessions/{session_id}`

**Sample Curl:**
```bash
curl -X DELETE http://localhost:8080/sessions/conv-123
```
