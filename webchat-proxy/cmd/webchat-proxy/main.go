package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"webchat-proxy/internal/api"
	"webchat-proxy/internal/ccaas"
	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
)

func main() {
	ctx := context.Background()

	// Initialize Dialogflow Client
	client, err := dialogflow.NewParticipantsClient(ctx)
	if err != nil {
		log.Fatalf("Failed to create ParticipantsClient: %v", err)
	}
	defer client.Close()

	// Initialize CCaaS Connector (dummy for now)
	ccaipCfg := &ccaas.GoogleCCAIPConfig{
		APIBaseURL: "https://example.com/api/v1",
		Auth: ccaas.Auth{
			Username: "dummy",
		},
	}
	cc := ccaas.NewCCAIPConnector(ccaipCfg, "dummy-password")

	// Initialize API Server
	srv := api.NewServer(client, cc)

	// Server Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	httpSrv := &http.Server{
		Addr:    addr,
		Handler: srv.Mux,
	}

	// Graceful Shutdown Channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Server listening on %s", addr)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down server...")

	// Context for graceful shutdown period
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpSrv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}
