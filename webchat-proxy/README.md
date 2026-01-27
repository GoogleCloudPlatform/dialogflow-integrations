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
```

## Running Locally

Use the provided script to start the server locally on port 8080. This script automatically handles killing any existing process on that port.

```bash
./run_local.sh
```

## Deployment

1. **Configure Service Account**: Create a custom service account with the necessary permissions for Dialogflow interaction.

   ```bash
   ./setup_sa.sh
   ```

2. **Deploy to Cloud Run**: Set your CCaIP subdomain using `export` before running the script.

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
