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
		natsURL = "nats://nats:4222"
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Printf("Warning: Failed to connect to NATS: %v (continuing without NATS)", err)
		NatsConnection = nil
		return
	}

	NatsConnection = nc
	log.Println("Connected to NATS")
}
