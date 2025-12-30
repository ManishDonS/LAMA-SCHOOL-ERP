package messaging

import (
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

var NatsConn *nats.Conn

func ConnectNATS() {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = "nats://nats:4222" // Docker default
	}

	nc, err := nats.Connect(url)
	if err != nil {
		log.Printf("Warning: Failed to connect to NATS: %v. Messaging disabled.", err)
		return
	}

	NatsConn = nc
	log.Println("Connected to NATS")
}
