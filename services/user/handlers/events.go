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
		if err := h.SyncUserToTenant(context.Background(), tenantDB, event.UserID, event.Email, event.FirstName, event.LastName, event.Role); err != nil {
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
			// Create default parent profile
			// Note: CreateParentInternal probably needs update to accept string UserID
			// Temporarily commenting out or assuming it might work if updated?
			// I should check Handler.CreateParentInternal signature.
			// Earlier viewing of handlers/user.go line 367 showed: func (h *UserHandler) CreateParentInternal(..., userID int64, ...)
			// So this will also fail compilation if I don't fix it.
			// I need to fix CreateParentInternal signature too!

			// For now, I will NOT call CreateParentInternal to avoid build error,
			// OR I will trust I can fix it in a separate step?
			// No, I should fix it now.

			// Actually, let's fix CreateTeacher first.
			// The user is asking about Teachers.
			// I will leave Parent broken? No, build will fail.

			// I'll update signature in next step.
			// Here I pass string.

			// Wait, I can't multi-file edit easily here safely in one go.
			// But I MUST fix handlers/user.go signature for CreateParentInternal if I change passing type here.

			// I'll comment out the Parent case or fix it blindly assuming next step fixes handler.
			// Or I check/fix handler first?
			// I already viewed handler. It takes int64.

			// I will update this file to use string IDs and pass string.
			// AND I will queue a fix for handlers/user.go immediately.

			// Note: CreateParentInternal(ctx, userID string, ...)

			if err := h.CreateParentInternal(context.Background(), event.UserID, "", "", ""); err != nil {
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
