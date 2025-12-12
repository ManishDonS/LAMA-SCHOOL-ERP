package handlers

import (
	"school-erp/website/database"
	"school-erp/website/models"

	"github.com/gofiber/fiber/v2"
)

// CreateWebsite godoc
// @Summary Create a new website
// @Description Create a new website record
// @Tags website
// @Accept json
// @Produce json
// @Param website body models.Website true "Website Data"
// @Success 201 {object} models.Website
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /websites [post]
func CreateWebsite(c *fiber.Ctx) error {
	website := new(models.Website)

	if err := c.BodyParser(website); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Generate domain if not exists
	if website.Domain == "" {
		website.Domain = generateSlug(website.Name) + ".lama-erp.com" // Basic slug implementation
	}

	// Create record
	if err := database.DB.Create(&website).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create website: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(website)
}

func generateSlug(s string) string {
	var result string
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			result += string(r)
		} else if r >= 'A' && r <= 'Z' {
			result += string(r + 32)
		} else if r == ' ' || r == '-' {
			result += "-"
		}
	}
	return result
}

// GetWebsites godoc
// @Summary List all websites
// @Description Get a list of all websites
// @Tags website
// @Accept json
// @Produce json
// @Success 200 {array} models.Website
// @Failure 500 {object} map[string]interface{}
// @Router /websites [get]
func GetWebsites(c *fiber.Ctx) error {
	var websites []models.Website

	if err := database.DB.Find(&websites).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not fetch websites",
		})
	}

	return c.JSON(websites)
}

// GetWebsite godoc
// @Summary Get a website
// @Description Get details of a specific website by ID
// @Tags website
// @Accept json
// @Produce json
// @Param id path string true "Website ID"
// @Success 200 {object} models.Website
// @Failure 404 {object} map[string]interface{}
// @Router /websites/{id} [get]
func GetWebsite(c *fiber.Ctx) error {
	id := c.Params("id")
	var website models.Website

	if err := database.DB.Preload("Pages").First(&website, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Website not found",
		})
	}

	return c.JSON(website)
}

// UpdateWebsite godoc
// @Summary Update a website
// @Description Update details of an existing website
// @Tags website
// @Accept json
// @Produce json
// @Param id path string true "Website ID"
// @Param website body models.Website true "Website Data"
// @Success 200 {object} models.Website
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /websites/{id} [put]
func UpdateWebsite(c *fiber.Ctx) error {
	id := c.Params("id")
	var website models.Website

	if err := database.DB.First(&website, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Website not found",
		})
	}

	if err := c.BodyParser(&website); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	database.DB.Save(&website)
	return c.JSON(website)
}

// DeleteWebsite godoc
// @Summary Delete a website
// @Description Remove a website from the system
// @Tags website
// @Accept json
// @Produce json
// @Param id path string true "Website ID"
// @Success 204 {object} nil
// @Failure 404 {object} map[string]interface{}
// @Router /websites/{id} [delete]
func DeleteWebsite(c *fiber.Ctx) error {
	id := c.Params("id")
	var website models.Website

	if err := database.DB.First(&website, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Website not found",
		})
	}

	database.DB.Delete(&website)
	return c.SendStatus(fiber.StatusNoContent)
}
