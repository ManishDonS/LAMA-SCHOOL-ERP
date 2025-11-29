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
		log.Fatalf("Failed to connect to NATS: %v", err)
	}

	NatsConnection = nc
	log.Println("Connected to NATS")
}
