# Use the official Golang image to create a build artifact.
FROM golang:1.24 as builder

# Create and change to the app directory.
WORKDIR /app

# Retrieve application dependencies.
# We need to copy libs because of the 'replace' directive in go.mod
COPY go.mod go.sum ./
COPY libs ./libs
RUN go mod download

# Copy the rest of the source code.
COPY . .

# Build the binary.
RUN CGO_ENABLED=0 GOOS=linux go build -v -o webchat-proxy ./cmd/webchat-proxy

# Use the official Alpine image for a lean production container.
FROM alpine:3

# Copy the binary to the production image from the builder stage.
COPY --from=builder /app/webchat-proxy /webchat-proxy

# Service must listen to $PORT environment variable.
# This default value facilitates local development.
ENV PORT 8080

# Run the web service on container startup.
CMD ["/webchat-proxy"]
