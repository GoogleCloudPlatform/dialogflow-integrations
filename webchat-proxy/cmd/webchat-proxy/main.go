package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"webchat-proxy/internal/api"
	"webchat-proxy/internal/ccaas"
	dialogflow "cloud.google.com/go/dialogflow/apiv2beta1"
	"google.golang.org/api/option"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	// Initialize Dialogflow Client
	client, err := dialogflow.NewParticipantsClient(ctx, option.WithEndpoint(os.Getenv("DIALOGFLOW_ENDPOINT")))
	if err != nil {
		log.Fatalf("Failed to create ParticipantsClient: %v", err)
	}
	defer client.Close()

	redisAddr := os.Getenv("REDIS_ADDRESS")
	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "", // No password by default unless you've enabled Redis AUTH
		DB:       0,  // Default DB
	})
	defer redisClient.Close()

	// Initialize CCaaS Connector
	ccaipPassword := os.Getenv("CCAIP_PASSWORD")
	if ccaipPassword == "" {
		ccaipPassword = "dummy-password" // Fallback for local dev
	}

	ccaipSubdomain := os.Getenv("CCAIP_SUBDOMAIN")
	if ccaipSubdomain == "" {
		ccaipSubdomain = "dummy" // Fallback for local dev
	}

	ccaipDefaultMenuID, _ := strconv.Atoi(os.Getenv("CCAIP_DEFAULT_MENU_ID"))
	ccaipDefaultLang := os.Getenv("CCAIP_DEFAULT_LANG")
	if ccaipDefaultLang == "" {
		ccaipDefaultLang = "en"
	}

	ccaipPrimarySecret := os.Getenv("CCAIP_PRIMARY_WEBHOOK_SECRET")
	ccaipSecondarySecret := os.Getenv("CCAIP_SECONDARY_WEBHOOK_SECRET")

	ccaipCfg := &ccaas.GoogleCCAIPConfig{
		APIBaseURL: fmt.Sprintf("https://%s.stg.ccaiplatform.com/apps/api/v1", ccaipSubdomain),
		Auth: ccaas.Auth{
			Username: ccaipSubdomain,
			Password: ccaipPassword,
		},
		PrimaryWebhookSecret:   ccaipPrimarySecret,
		SecondaryWebhookSecret: ccaipSecondarySecret,
		DefaultMenuID:         ccaipDefaultMenuID,
		DefaultLang:           ccaipDefaultLang,
	}
	cc := ccaas.NewCCAIPConnector(ccaipCfg, client, redisClient)

	// Read API Key for authentication
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Println("WARNING: API_KEY environment variable not set. API authentication will be disabled.")
	}

	// Initialize API Server
	srv := api.NewServer(client, cc, apiKey)

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
