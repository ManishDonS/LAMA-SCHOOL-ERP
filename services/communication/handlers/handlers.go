package handlers

import (
	"school-erp/communication/database"
	"school-erp/communication/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetChannels returns all channels for a user (mocking user context for now or reading header)
func GetChannels(c *fiber.Ctx) error {
	var channels []models.CommunicationChannel
	// In real app, filter by user membership. For now return all public.
	result := database.DB.Where("type = ?", "public").Find(&channels)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}
	return c.JSON(channels)
}

// CreateChannel creates a new channel
func CreateChannel(c *fiber.Ctx) error {
	// Define a struct to capture specific request body
	type CreateChannelRequest struct {
		models.CommunicationChannel
		Members []string `json:"members"`
	}

	req := new(CreateChannelRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	channel := req.CommunicationChannel

	// Default values
	if channel.Type == "" {
		channel.Type = "public"
	}
	if channel.SchoolID == 0 {
		channel.SchoolID = 1 // Default for dev
	}

	tx := database.DB.Begin()

	if err := tx.Create(&channel).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Add members
	if len(req.Members) > 0 {
		for _, memberIDStr := range req.Members {
			memberID, _ := strconv.ParseUint(memberIDStr, 10, 64)
			if memberID == 0 {
				continue
			}

			member := models.CommunicationChannelMember{
				ChannelID: channel.ID,
				UserID:    memberID,
				Role:      "member",
				JoinedAt:  channel.CreatedAt, // Approximate
			}
			if err := tx.Create(&member).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "Failed to add members: " + err.Error()})
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Transaction commit failed"})
	}

	// Prepare response with members
	response := map[string]interface{}{
		"id":          channel.ID,
		"schoolId":    channel.SchoolID,
		"name":        channel.Name,
		"type":        channel.Type,
		"description": channel.Description,
		"members":     req.Members, // Return what was sent/created
		"createdAt":   channel.CreatedAt,
		"updatedAt":   channel.UpdatedAt,
		"unreadCount": 0,
	}

	return c.Status(201).JSON(response)
}

// GetMessages returns messages for a channel
func GetMessages(c *fiber.Ctx) error {
	channelId := c.Params("channelId")
	var messages []models.CommunicationMessage

	result := database.DB.Where("channel_id = ?", channelId).Order("created_at asc").Find(&messages)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.JSON(messages)
}

// SendMessage creates a new message
func SendMessage(c *fiber.Ctx) error {
	channelIdStr := c.Params("channelId")
	channelId, err := strconv.ParseUint(channelIdStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid channel ID"})
	}

	message := new(models.CommunicationMessage)
	if err := c.BodyParser(message); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	message.ChannelID = channelId
	// Mock SenderID for now, ideally from JWT
	if message.SenderID == 0 {
		message.SenderID = 1 // Default to admin or something
	}

	result := database.DB.Create(&message)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	return c.Status(201).JSON(message)
}
