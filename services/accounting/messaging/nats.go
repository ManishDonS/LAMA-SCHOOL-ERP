package messaging

import (
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

var NatsConnection *nats.Conn

func ConnectNATS() {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://localhost:4222"
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Printf("Warning: Could not connect to NATS: %v", err)
		return
	}

	NatsConnection = nc
	log.Println("Connected to NATS")
}

func PublishEvent(subject string, data []byte) error {
	if NatsConnection == nil {
		log.Println("NATS connection not available, skipping event publish")
		return nil
	}
	return NatsConnection.Publish(subject, data)
}
