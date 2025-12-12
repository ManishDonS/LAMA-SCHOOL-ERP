package messaging

import (
	"log"

	"github.com/nats-io/nats.go"
)

var NatsConnection *nats.Conn

func ConnectNATS() {
	natsURL := "nats://nats:4222"
	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Printf("Warning: Failed to connect to NATS: %v", err)
		return
	}

	NatsConnection = nc
	log.Println("Connected to NATS successfully")
}

func PublishEvent(subject string, data []byte) error {
	if NatsConnection == nil {
		log.Println("NATS connection not available, skipping event publish")
		return nil
	}

	return NatsConnection.Publish(subject, data)
}
