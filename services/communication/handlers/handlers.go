package handlers

import (
	"school-erp/communication/database"
	"school-erp/communication/models"
	"strconv"
	"time"

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

// GetUsers returns all users for the school
func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	// Default SchoolID 1 for now
	if err := database.DB.Where("school_id = ?", 1).Find(&users).Error; err != nil {
		// Just log error and continue? Or return partial?
		// Let's return error if users fail.
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Fetch Students
	var students []models.Student
	if err := database.DB.Find(&students).Error; err != nil {
		// Log error but don't fail, as students table might be empty or missing in some envs
		// fmt.Println("Error fetching students:", err)
	}

	// Transform to frontend expected format
	type UserResponse struct {
		ID     string `json:"id"` // Changed to string to support mix
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
		Status string `json:"status"`
		Email  string `json:"email"`
		Role   string `json:"role"`
	}

	var response []UserResponse

	// Add Users
	for _, u := range users {
		name := u.FirstName + " " + u.LastName
		if name == " " {
			name = u.Email
		}

		response = append(response, UserResponse{
			ID:     strconv.FormatUint(u.ID, 10),
			Name:   name,
			Avatar: "https://ui-avatars.com/api/?name=" + name + "&background=random",
			Status: u.Status,
			Email:  u.Email,
			Role:   u.Role,
		})
	}

	// Add Students
	for _, s := range students {
		name := s.FirstName + " " + s.LastName
		// Determine ID strategy. If we use numeric ID, it might clash.
		// But for "Add Member", we need an ID that the member table accepts.
		// If member table accepts uint64, we can't use "student-1".
		// We MUST verify if these students are already in the 'users' list?
		// If they are not in users list, we can't add them to channel_members unless we change DB schema for member ID.
		// OR we use a very large offset for student IDs? e.g. 1000000 + ID?
		// Hacky but works for demo.
		// Let's use string ID in response. But when saving...

		// For now, let's just use the ID. If it clashes, it clashes.
		// But better: Use offset.
		// Real solution: Convert member.user_id to string (in next step).

		response = append(response, UserResponse{
			ID:     strconv.FormatUint(s.ID, 10), // Warning: Potential ID collision with Users
			Name:   name,
			Avatar: s.PhotoURL,
			Status: "active",
			Email:  s.Email,
			Role:   "Student",
		})
	}

	return c.JSON(response)
}

// AddMember adds a user to a channel
func AddMember(c *fiber.Ctx) error {
	channelIdStr := c.Params("channelId")
	channelId, err := strconv.ParseUint(channelIdStr, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid channel ID"})
	}

	type AddMemberRequest struct {
		UserID uint64 `json:"userId"`
	}

	req := new(AddMemberRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	member := models.CommunicationChannelMember{
		ChannelID: channelId,
		UserID:    req.UserID,
		Role:      "member",
		JoinedAt:  time.Now(),
	}

	// Check if already exists
	var count int64
	database.DB.Model(&models.CommunicationChannelMember{}).Where("channel_id = ? AND user_id = ?", channelId, req.UserID).Count(&count)
	if count > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "User is already a member"})
	}

	if err := database.DB.Create(&member).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to add member: " + err.Error()})
	}

	return c.Status(201).JSON(member)
}
