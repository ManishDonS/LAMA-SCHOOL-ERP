package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"school-erp/user/database"
	"school-erp/user/messaging"

	"github.com/nats-io/nats.go"
)

type UserRegisteredEvent struct {
	UserID    int64  `json:"user_id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
	SchoolID  int64  `json:"school_id"`
}

func (h *UserHandler) SetupEventSubscriptions() {
	if messaging.NatsConnection == nil {
		log.Println("NATS connection not available, skipping subscriptions")
		return
	}

	_, err := messaging.NatsConnection.Subscribe("UserRegistered", func(m *nats.Msg) {
		var event UserRegisteredEvent
		if err := json.Unmarshal(m.Data, &event); err != nil {
			log.Printf("Error unmarshaling UserRegistered event: %v", err)
			return
		}

		log.Printf("Received UserRegistered event for user %d (%s)", event.UserID, event.Role)

		// Create profile based on role
		switch event.Role {
		case "teacher":
			// Create default teacher profile
			teacher := &database.Teacher{
				UserID:        event.UserID,
				Qualification: "Not Specified",
				Department:    "General",
				EmployeeID:    fmt.Sprintf("T-%d", time.Now().Unix()),
			}
			if err := h.CreateTeacherInternal(context.Background(), teacher); err != nil {
				log.Printf("Failed to create teacher profile for user %d: %v", event.UserID, err)
			} else {
				log.Printf("Created teacher profile for user %d", event.UserID)
			}

		case "parent":
			// Create default parent profile
			if err := h.CreateParentInternal(context.Background(), event.UserID, "", "", ""); err != nil {
				log.Printf("Failed to create parent profile for user %d: %v", event.UserID, err)
			} else {
				log.Printf("Created parent profile for user %d", event.UserID)
			}
		}
	})

	if err != nil {
		log.Printf("Error subscribing to UserRegistered: %v", err)
	} else {
		log.Println("Subscribed to UserRegistered event")
	}
}
