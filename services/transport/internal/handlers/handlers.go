package handlers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/school-erp/transport-service/internal/models"
	"github.com/school-erp/transport-service/internal/service"
)

type TransportHandler struct {
	svc service.TransportService
}

func NewTransportHandler(svc service.TransportService) *TransportHandler {
	return &TransportHandler{svc: svc}
}

// Bus Handlers
func (h *TransportHandler) CreateBus(c *fiber.Ctx) error {
	bus := new(models.Bus)
	if err := c.BodyParser(bus); err != nil {
		log.Printf("[TransportHandler] Error parsing bus body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateBus(c.Context(), bus); err != nil {
		log.Printf("[TransportHandler] Error creating bus: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(bus)
}

func (h *TransportHandler) ListBuses(c *fiber.Ctx) error {
	buses, err := h.svc.ListBuses(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(buses)
}

func (h *TransportHandler) GetBus(c *fiber.Ctx) error {
	id := c.Params("id")
	bus, err := h.svc.GetBus(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Bus not found"})
	}
	return c.JSON(bus)
}

func (h *TransportHandler) UpdateBus(c *fiber.Ctx) error {
	id := c.Params("id")
	bus := new(models.Bus)
	if err := c.BodyParser(bus); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	bus.ID = id
	if err := h.svc.UpdateBus(c.Context(), bus); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(bus)
}

func (h *TransportHandler) DeleteBus(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteBus(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Driver Handlers
func (h *TransportHandler) CreateDriver(c *fiber.Ctx) error {
	driver := new(models.Driver)
	if err := c.BodyParser(driver); err != nil {
		log.Printf("[TransportHandler] Error parsing driver body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateDriver(c.Context(), driver); err != nil {
		log.Printf("[TransportHandler] Error creating driver: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(driver)
}

func (h *TransportHandler) ListDrivers(c *fiber.Ctx) error {
	drivers, err := h.svc.ListDrivers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(drivers)
}

func (h *TransportHandler) GetDriver(c *fiber.Ctx) error {
	id := c.Params("id")
	driver, err := h.svc.GetDriver(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Driver not found"})
	}
	return c.JSON(driver)
}

func (h *TransportHandler) UpdateDriver(c *fiber.Ctx) error {
	id := c.Params("id")
	driver := new(models.Driver)
	if err := c.BodyParser(driver); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	driver.ID = id
	if err := h.svc.UpdateDriver(c.Context(), driver); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(driver)
}

func (h *TransportHandler) DeleteDriver(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteDriver(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Route Handlers
func (h *TransportHandler) CreateRoute(c *fiber.Ctx) error {
	route := new(models.Route)
	if err := c.BodyParser(route); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateRoute(c.Context(), route); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(route)
}

func (h *TransportHandler) ListRoutes(c *fiber.Ctx) error {
	routes, err := h.svc.ListRoutes(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(routes)
}

func (h *TransportHandler) GetRoute(c *fiber.Ctx) error {
	id := c.Params("id")
	route, err := h.svc.GetRoute(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Route not found"})
	}
	return c.JSON(route)
}

func (h *TransportHandler) UpdateRoute(c *fiber.Ctx) error {
	id := c.Params("id")
	route := new(models.Route)
	if err := c.BodyParser(route); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	route.ID = id
	if err := h.svc.UpdateRoute(c.Context(), route); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(route)
}

func (h *TransportHandler) DeleteRoute(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteRoute(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Assignment Handlers
func (h *TransportHandler) CreateAssignment(c *fiber.Ctx) error {
	assignment := new(models.StudentAssignment)
	if err := c.BodyParser(assignment); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateAssignment(c.Context(), assignment); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(assignment)
}

func (h *TransportHandler) ListAssignments(c *fiber.Ctx) error {
	assignments, err := h.svc.ListAssignments(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(assignments)
}

func (h *TransportHandler) DeleteAssignment(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteAssignment(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Traccar Handlers
func (h *TransportHandler) GetTraccarToken(c *fiber.Ctx) error {
	token, err := h.svc.GetTraccarToken(c.Context())
	if err != nil {
		if err.Error() == "INVALID_CREDENTIALS" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Traccar credentials"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendString(token)
}

func (h *TransportHandler) ProxyTraccar(c *fiber.Ctx) error {
	path := c.Params("*")
	body := c.Body()
	method := c.Method()

	respBody, statusCode, err := h.svc.ProxyTraccarRequest(c.Context(), method, "/"+path, body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	c.Set("Content-Type", "application/json")
	return c.Status(statusCode).Send(respBody)
}

// Settings Handlers
func (h *TransportHandler) GetSettings(c *fiber.Ctx) error {
	settings, err := h.svc.GetSettings(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(settings)
}

func (h *TransportHandler) UpdateSettings(c *fiber.Ctx) error {
	var settings map[string]string
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := h.svc.UpdateSettings(c.Context(), settings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Settings updated successfully"})
}

func (h *TransportHandler) ValidateTraccarCredentials(c *fiber.Ctx) error {
	if err := h.svc.ValidateTraccarCredentials(c.Context()); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"valid": false,
			"error": err.Error(),
		})
	}
	return c.JSON(fiber.Map{
		"valid":   true,
		"message": "Traccar credentials are valid",
	})
}

// Maintenance Handlers
func (h *TransportHandler) CreateMaintenance(c *fiber.Ctx) error {
	record := new(models.MaintenanceRecord)
	if err := c.BodyParser(record); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateMaintenance(c.Context(), record); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(record)
}

func (h *TransportHandler) ListMaintenance(c *fiber.Ctx) error {
	busID := c.Query("busId")
	records, err := h.svc.ListMaintenance(c.Context(), busID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(records)
}

func (h *TransportHandler) DeleteMaintenance(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteMaintenance(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Fuel Log Handlers
func (h *TransportHandler) CreateFuelLog(c *fiber.Ctx) error {
	log := new(models.FuelLog)
	if err := c.BodyParser(log); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.svc.CreateFuelLog(c.Context(), log); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(log)
}

func (h *TransportHandler) ListFuelLogs(c *fiber.Ctx) error {
	busID := c.Query("busId")
	logs, err := h.svc.ListFuelLogs(c.Context(), busID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(logs)
}

func (h *TransportHandler) DeleteFuelLog(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.DeleteFuelLog(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
