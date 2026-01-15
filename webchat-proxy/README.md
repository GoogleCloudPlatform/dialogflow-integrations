# Webchat Proxy

A Go-based proxy server for CES webchat integrations, handling session management and gRPC streaming.

## Prerequisites

- Go 1.24 or later
- Google Cloud SDK (`gcloud`) (for deployment)

## Running Locally

Use the provided script to start the server locally on port 8080. This script automatically handles killing any existing process on that port.

```bash
./run_local.sh
```

Alternatively, you can run directly with:

```bash
export PORT=8080
go run ./cmd/webchat-proxy
```

## deployment

To deploy to Google Cloud Run, verify your Project ID and run:

```bash
# Replace YOUR_PROJECT_ID with your actual Google Cloud Project ID
export PROJECT_ID=YOUR_PROJECT_ID
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
  "session_id": "conv-123"
}
```

### Delete Session

Delete an active session.

**Endpoint:** `DELETE /sessions/{session_id}`

**Sample Curl:**
```bash
curl -X DELETE http://localhost:8080/sessions/conv-123
```
