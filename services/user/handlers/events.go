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
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
	SchoolID  string `json:"school_id"`
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

		log.Printf("Received UserRegistered event for user %s (%s)", event.UserID, event.Role)

		// 1. Resolve tenant DB
		tenantDB, _, err := h.getTenantDBBySchoolID(context.Background(), event.SchoolID)
		if err != nil {
			log.Printf("Failed to resolve tenant DB for SchoolID %s: %v", event.SchoolID, err)
			return
		}

		// 2. Sync User to Tenant DB
		if err := h.SyncUserToTenant(context.Background(), tenantDB, event.UserID, event.Email, event.FirstName, event.LastName, event.Role, event.SchoolID); err != nil {
			log.Printf("Failed to sync user %s to tenant DB: %v", event.UserID, err)
			// Continue to profile creation, it might still work if user exists from elsewhere
		}

		// Create profile based on role
		switch event.Role {
		case "teacher":
			// Create default teacher profile
			teacher := &database.Teacher{
				UserID:        event.UserID,
				SchoolID:      event.SchoolID,
				Qualification: "Not Specified",
				Department:    "General",
				EmployeeID:    fmt.Sprintf("T-%d", time.Now().Unix()),
			}
			// Important: Use tenantDB for profile creation!
			_, err = tenantDB.Exec(
				context.Background(),
				`INSERT INTO teachers (user_id, school_id, qualification, department, employee_id, join_date, status)
				 VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
				 ON CONFLICT (user_id) DO NOTHING`,
				teacher.UserID, teacher.SchoolID, teacher.Qualification, teacher.Department, teacher.EmployeeID,
			)
			if err != nil {
				log.Printf("Failed to create teacher profile for user %s in tenant DB: %v", event.UserID, err)
			} else {
				log.Printf("Created teacher profile for user %s in tenant DB", event.UserID)
			}

		case "parent":
			// Create default parent profile in tenant DB
			_, err = tenantDB.Exec(
				context.Background(),
				`INSERT INTO parents (user_id, school_id, status, created_at, updated_at)
				 VALUES ($1, $2, 'active', NOW(), NOW())
				 ON CONFLICT (user_id) DO NOTHING`,
				event.UserID, event.SchoolID,
			)
			if err != nil {
				log.Printf("Failed to create parent profile for user %s: %v", event.UserID, err)
			} else {
				log.Printf("Created parent profile for user %s", event.UserID)
			}
		}
	})

	if err != nil {
		log.Printf("Error subscribing to UserRegistered: %v", err)
	} else {
		log.Println("Subscribed to UserRegistered event")
	}
}
