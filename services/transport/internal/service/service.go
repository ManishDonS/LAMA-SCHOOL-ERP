package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"strings"
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
	ValidateTraccarCredentials(ctx context.Context) error

	// Settings
	GetSettings(ctx context.Context) (map[string]string, error)
	UpdateSettings(ctx context.Context, settings map[string]string) error

	// Maintenance
	CreateMaintenance(ctx context.Context, record *models.MaintenanceRecord) error
	ListMaintenance(ctx context.Context, busID string) ([]*models.MaintenanceRecord, error)
	DeleteMaintenance(ctx context.Context, id string) error

	// Fuel Logs
	CreateFuelLog(ctx context.Context, log *models.FuelLog) error
	ListFuelLogs(ctx context.Context, busID string) ([]*models.FuelLog, error)
	DeleteFuelLog(ctx context.Context, id string) error
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
	settings, err := s.repo.GetSettings(ctx)
	if err != nil {
		log.Printf("[TransportService] Error fetching settings: %v", err)
		return nil, err
	}
	return settings, nil
}

func (s *TransportServiceImpl) UpdateSettings(ctx context.Context, settings map[string]string) error {
	for k, v := range settings {
		if err := s.repo.UpdateSetting(ctx, k, v); err != nil {
			return err
		}
	}
	return nil
}

// Maintenance Implementation
func (s *TransportServiceImpl) CreateMaintenance(ctx context.Context, record *models.MaintenanceRecord) error {
	return s.repo.CreateMaintenance(ctx, record)
}

func (s *TransportServiceImpl) ListMaintenance(ctx context.Context, busID string) ([]*models.MaintenanceRecord, error) {
	return s.repo.ListMaintenance(ctx, busID)
}

func (s *TransportServiceImpl) DeleteMaintenance(ctx context.Context, id string) error {
	return s.repo.DeleteMaintenance(ctx, id)
}

// Fuel Log Implementation
func (s *TransportServiceImpl) CreateFuelLog(ctx context.Context, log *models.FuelLog) error {
	return s.repo.CreateFuelLog(ctx, log)
}

func (s *TransportServiceImpl) ListFuelLogs(ctx context.Context, busID string) ([]*models.FuelLog, error) {
	return s.repo.ListFuelLogs(ctx, busID)
}

func (s *TransportServiceImpl) DeleteFuelLog(ctx context.Context, id string) error {
	return s.repo.DeleteFuelLog(ctx, id)
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
		log.Printf("[TransportService] Error loading Traccar config: %v", err)
		return "", err
	}

	// Validate credentials
	if username == "" || password == "" {
		return "", fmt.Errorf("INVALID_CREDENTIALS: Traccar username or password is empty")
	}
	if password == "change-in-production" || password == "admin" {
		return "", fmt.Errorf("INVALID_CREDENTIALS: Please update Traccar credentials in settings or environment variables")
	}

	// Clean URL
	traccarURL = strings.TrimRight(traccarURL, "/")

	// Use a client with a cookie jar to persist session
	jar, _ := cookiejar.New(nil)
	client := &http.Client{
		Timeout: 15 * time.Second,
		Jar:     jar,
	}

	// Strategy 1: Standard Traccar - GET /api/session with Basic Auth
	reqURL := traccarURL + "/session"
	req, err := http.NewRequest("GET", reqURL, nil)
	if err == nil {
		auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
		req.Header.Add("Authorization", "Basic "+auth)
		req.Header.Add("Accept", "application/json")

		log.Printf("[TransportService] Strategy 1: GET %s with Basic Auth (Standard Traccar)", reqURL)
		resp, err := client.Do(req)
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				log.Printf("[TransportService] Strategy 1 Succeeded - Basic Auth works")
				// Return Basic Auth token that can be used for subsequent requests
				return fmt.Sprintf(`{"type":"basic","token":"%s"}`, auth), nil
			}
			log.Printf("[TransportService] Strategy 1 Failed (Status %d): %s", resp.StatusCode, string(body))
		} else {
			log.Printf("[TransportService] Strategy 1 Request Error: %v", err)
		}
	}

	// Strategy 2: POST /api/session with form-encoded (Session-based auth)
	reqURL = traccarURL + "/session"
	sessionData := url.Values{}
	sessionData.Set("email", username)
	sessionData.Set("password", password)
	req2, err := http.NewRequest("POST", reqURL, strings.NewReader(sessionData.Encode()))
	if err == nil {
		req2.Header.Add("Content-Type", "application/x-www-form-urlencoded")
		req2.Header.Add("Accept", "application/json")

		log.Printf("[TransportService] Strategy 2: POST %s with form data (Session-based)", reqURL)
		resp, err := client.Do(req2)
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNoContent {
				log.Printf("[TransportService] Strategy 2 Succeeded - Session created")
				// Session cookie is stored in jar, return user info
				return string(body), nil
			}
			log.Printf("[TransportService] Strategy 2 Failed (Status %d): %s", resp.StatusCode, string(body))
		} else {
			log.Printf("[TransportService] Strategy 2 Request Error: %v", err)
		}
	}

	// Strategy 3: Try without /api prefix (some Traccar instances use direct /session)
	baseURL := strings.TrimSuffix(traccarURL, "/api")
	reqURL = baseURL + "/api/session"
	req3, err := http.NewRequest("GET", reqURL, nil)
	if err == nil {
		auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
		req3.Header.Add("Authorization", "Basic "+auth)
		req3.Header.Add("Accept", "application/json")

		log.Printf("[TransportService] Strategy 3: GET %s with Basic Auth (Alternative URL)", reqURL)
		resp, err := client.Do(req3)
		if err == nil {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				log.Printf("[TransportService] Strategy 3 Succeeded")
				return fmt.Sprintf(`{"type":"basic","token":"%s"}`, auth), nil
			}
			log.Printf("[TransportService] Strategy 3 Failed (Status %d): %s", resp.StatusCode, string(body))
		} else {
			log.Printf("[TransportService] Strategy 3 Request Error: %v", err)
		}
	}

	return "", fmt.Errorf("INVALID_CREDENTIALS: All authentication strategies failed. Please verify your Traccar credentials")
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

func (s *TransportServiceImpl) ValidateTraccarCredentials(ctx context.Context) error {
	traccarURL, username, password, err := s.getTraccarConfig(ctx)
	if err != nil {
		return fmt.Errorf("configuration error: %v", err)
	}

	// Validate credentials format
	if username == "" || password == "" {
		return fmt.Errorf("username or password is empty")
	}
	if password == "change-in-production" || password == "admin" {
		return fmt.Errorf("please update default credentials")
	}

	// Clean URL
	traccarURL = strings.TrimRight(traccarURL, "/")

	// Test connection with Basic Auth (standard Traccar method)
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", traccarURL+"/session", nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
	req.Header.Add("Authorization", "Basic "+auth)
	req.Header.Add("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("connection failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == http.StatusOK {
		log.Printf("[TransportService] Traccar credentials validated successfully")
		return nil
	}

	if resp.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf("invalid credentials - authentication failed")
	}

	return fmt.Errorf("validation failed with status %d: %s", resp.StatusCode, string(body))
}
