package handlers

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LogoUploadHandler handles logo upload for schools
type LogoUploadHandler struct {
	db *pgxpool.Pool
}

// NewLogoUploadHandler creates a new logo upload handler
func NewLogoUploadHandler(db *pgxpool.Pool) *LogoUploadHandler {
	return &LogoUploadHandler{db: db}
}

// UploadLogo handles POST /api/v1/schools/:id/logo
func (h *LogoUploadHandler) UploadLogo(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	if schoolID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "School ID is required",
		})
	}

	// Get the uploaded file
	file, err := c.FormFile("logo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Validate file type
	allowedTypes := map[string]bool{
		".png":  true,
		".jpg":  true,
		".jpeg": true,
		".svg":  true,
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedTypes[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid file type. Only PNG, JPG, JPEG, and SVG are allowed",
		})
	}

	// Validate file size (5MB max)
	maxSize := int64(5 * 1024 * 1024) // 5MB
	if file.Size > maxSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File size exceeds 5MB limit",
		})
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads/logos"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create upload directory",
		})
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	newFilename := fmt.Sprintf("%s_%d%s", schoolID, timestamp, ext)
	filePath := filepath.Join(uploadsDir, newFilename)

	// Save the file
	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
		})
	}

	// Update database with new logo URL
	logoURL := fmt.Sprintf("/uploads/logos/%s", newFilename)
	ctx := context.Background()

	query := `UPDATE schools SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err = h.db.Exec(ctx, query, logoURL, schoolID)
	if err != nil {
		// Clean up uploaded file if database update fails
		os.Remove(filePath)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update school logo",
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Logo uploaded successfully",
		"logo_url": logoURL,
	})
}

// DeleteLogo handles DELETE /api/v1/schools/:id/logo
func (h *LogoUploadHandler) DeleteLogo(c *fiber.Ctx) error {
	schoolID := c.Params("id")
	if schoolID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "School ID is required",
		})
	}

	ctx := context.Background()

	// Get current logo URL
	var currentLogoURL string
	err := h.db.QueryRow(ctx, "SELECT COALESCE(logo_url, '') FROM schools WHERE id = $1", schoolID).Scan(&currentLogoURL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch current logo",
		})
	}

	// Update database to remove logo URL
	query := `UPDATE schools SET logo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err = h.db.Exec(ctx, query, schoolID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove school logo",
		})
	}

	// Delete the physical file if it exists
	if currentLogoURL != "" && strings.HasPrefix(currentLogoURL, "/uploads/logos/") {
		filename := strings.TrimPrefix(currentLogoURL, "/uploads/logos/")
		filePath := filepath.Join("./uploads/logos", filename)
		os.Remove(filePath) // Ignore error if file doesn't exist
	}

	return c.JSON(fiber.Map{
		"message": "Logo removed successfully",
	})
}
