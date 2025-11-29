package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/school-erp/transport-service/internal/models"
	"github.com/school-erp/transport-service/internal/repository"
)

type TransportService interface {
	// Bus
	CreateBus(ctx context.Context, bus *models.Bus) error
	GetBus(ctx context.Context, id string) (*models.Bus, error)
	ListBuses(ctx context.Context) ([]*models.Bus, error)
	UpdateBus(ctx context.Context, bus *models.Bus) error
	DeleteBus(ctx context.Context, id string) error

	// Driver
	CreateDriver(ctx context.Context, driver *models.Driver) error
	GetDriver(ctx context.Context, id string) (*models.Driver, error)
	ListDrivers(ctx context.Context) ([]*models.Driver, error)
	UpdateDriver(ctx context.Context, driver *models.Driver) error
	DeleteDriver(ctx context.Context, id string) error

	// Route
	CreateRoute(ctx context.Context, route *models.Route) error
	GetRoute(ctx context.Context, id string) (*models.Route, error)
	ListRoutes(ctx context.Context) ([]*models.Route, error)
	UpdateRoute(ctx context.Context, route *models.Route) error
	DeleteRoute(ctx context.Context, id string) error

	// Assignment
	CreateAssignment(ctx context.Context, assignment *models.StudentAssignment) error
	ListAssignments(ctx context.Context) ([]*models.StudentAssignment, error)
	DeleteAssignment(ctx context.Context, id string) error

	// Traccar Proxy
	GetTraccarToken(ctx context.Context) (string, error)
	ProxyTraccarRequest(ctx context.Context, method, path string, body []byte) ([]byte, int, error)

	// Settings
	GetSettings(ctx context.Context) (map[string]string, error)
	UpdateSettings(ctx context.Context, settings map[string]string) error
}

type TransportServiceImpl struct {
	repo repository.TransportRepository
}

func NewTransportService(repo repository.TransportRepository) *TransportServiceImpl {
	return &TransportServiceImpl{repo: repo}
}

// Bus Implementation
func (s *TransportServiceImpl) CreateBus(ctx context.Context, bus *models.Bus) error {
	return s.repo.CreateBus(ctx, bus)
}

func (s *TransportServiceImpl) GetBus(ctx context.Context, id string) (*models.Bus, error) {
	return s.repo.GetBus(ctx, id)
}

func (s *TransportServiceImpl) ListBuses(ctx context.Context) ([]*models.Bus, error) {
	return s.repo.ListBuses(ctx)
}

func (s *TransportServiceImpl) UpdateBus(ctx context.Context, bus *models.Bus) error {
	return s.repo.UpdateBus(ctx, bus)
}

func (s *TransportServiceImpl) DeleteBus(ctx context.Context, id string) error {
	return s.repo.DeleteBus(ctx, id)
}

// Driver Implementation
func (s *TransportServiceImpl) CreateDriver(ctx context.Context, driver *models.Driver) error {
	return s.repo.CreateDriver(ctx, driver)
}

func (s *TransportServiceImpl) GetDriver(ctx context.Context, id string) (*models.Driver, error) {
	return s.repo.GetDriver(ctx, id)
}

func (s *TransportServiceImpl) ListDrivers(ctx context.Context) ([]*models.Driver, error) {
	return s.repo.ListDrivers(ctx)
}

func (s *TransportServiceImpl) UpdateDriver(ctx context.Context, driver *models.Driver) error {
	return s.repo.UpdateDriver(ctx, driver)
}

func (s *TransportServiceImpl) DeleteDriver(ctx context.Context, id string) error {
	return s.repo.DeleteDriver(ctx, id)
}

// Route Implementation
func (s *TransportServiceImpl) CreateRoute(ctx context.Context, route *models.Route) error {
	return s.repo.CreateRoute(ctx, route)
}

func (s *TransportServiceImpl) GetRoute(ctx context.Context, id string) (*models.Route, error) {
	return s.repo.GetRoute(ctx, id)
}

func (s *TransportServiceImpl) ListRoutes(ctx context.Context) ([]*models.Route, error) {
	return s.repo.ListRoutes(ctx)
}

func (s *TransportServiceImpl) UpdateRoute(ctx context.Context, route *models.Route) error {
	return s.repo.UpdateRoute(ctx, route)
}

func (s *TransportServiceImpl) DeleteRoute(ctx context.Context, id string) error {
	return s.repo.DeleteRoute(ctx, id)
}

// Assignment Implementation
func (s *TransportServiceImpl) CreateAssignment(ctx context.Context, assignment *models.StudentAssignment) error {
	return s.repo.CreateAssignment(ctx, assignment)
}

func (s *TransportServiceImpl) ListAssignments(ctx context.Context) ([]*models.StudentAssignment, error) {
	return s.repo.ListAssignments(ctx)
}

func (s *TransportServiceImpl) DeleteAssignment(ctx context.Context, id string) error {
	return s.repo.DeleteAssignment(ctx, id)
}

// Settings Implementation
func (s *TransportServiceImpl) GetSettings(ctx context.Context) (map[string]string, error) {
	return s.repo.GetSettings(ctx)
}

func (s *TransportServiceImpl) UpdateSettings(ctx context.Context, settings map[string]string) error {
	for k, v := range settings {
		if err := s.repo.UpdateSetting(ctx, k, v); err != nil {
			return err
		}
	}
	return nil
}

// Traccar Proxy Implementation
func (s *TransportServiceImpl) getTraccarConfig(ctx context.Context) (string, string, string, error) {
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		return "", "", "", err
	}

	url := settings["traccar_url"]
	if url == "" {
		url = os.Getenv("TRACCAR_API_URL")
	}

	user := settings["traccar_username"]
	if user == "" {
		user = os.Getenv("TRACCAR_USER")
	}

	pass := settings["traccar_password"]
	if pass == "" {
		pass = os.Getenv("TRACCAR_PASSWORD")
	}

	if url == "" || user == "" || pass == "" {
		return "", "", "", fmt.Errorf("traccar configuration missing")
	}

	return url, user, pass, nil
}

func (s *TransportServiceImpl) GetTraccarToken(ctx context.Context) (string, error) {
	traccarURL, username, password, err := s.getTraccarConfig(ctx)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	data := "expiration=" + time.Now().Add(24*time.Hour).Format(time.RFC3339)
	req, err := http.NewRequest("POST", traccarURL+"/session/token", bytes.NewBufferString(data))
	if err != nil {
		return "", err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
	req.Header.Add("Authorization", "Basic "+auth)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get token: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

func (s *TransportServiceImpl) ProxyTraccarRequest(ctx context.Context, method, path string, body []byte) ([]byte, int, error) {
	traccarURL, username, password, err := s.getTraccarConfig(ctx)
	if err != nil {
		return nil, 500, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest(method, traccarURL+path, bytes.NewBuffer(body))
	if err != nil {
		return nil, 500, err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
	req.Header.Add("Authorization", "Basic "+auth)
	req.Header.Add("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, 500, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 500, err
	}

	return respBody, resp.StatusCode, nil
}
