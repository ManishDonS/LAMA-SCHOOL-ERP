package models

import (
	"time"
)

type Bus struct {
	ID              string     `json:"id"`
	BusNumber       string     `json:"busNumber"`
	RegistrationNo  string     `json:"registrationNo"`
	Model           string     `json:"model"`
	Capacity        int        `json:"capacity"`
	DriverID        *string    `json:"driverId"`
	RouteID         *string    `json:"routeId"`
	Status          string     `json:"status"` // Active, Inactive, Maintenance
	PurchaseDate    *time.Time `json:"purchaseDate"`
	LastServiceDate *time.Time `json:"lastServiceDate"`
	TraccarDeviceID string     `json:"traccarDeviceId"`
	Description     string     `json:"description"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type Driver struct {
	ID               string     `json:"id"`
	Name             string     `json:"name"`
	Email            string     `json:"email"`
	Phone            string     `json:"phone"`
	LicenseNumber    string     `json:"licenseNumber"`
	LicenseExpiry    *time.Time `json:"licenseExpiry"`
	AssignedBusID    *string    `json:"assignedBusId"`
	Status           string     `json:"status"` // Active, On Leave, Inactive
	JoinDate         *time.Time `json:"joinDate"`
	Address          string     `json:"address"`
	EmergencyContact string     `json:"emergencyContact"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type Route struct {
	ID            string    `json:"id"`
	RouteName     string    `json:"routeName"`
	RouteNumber   string    `json:"routeNumber"`
	StartPoint    string    `json:"startPoint"`
	EndPoint      string    `json:"endPoint"`
	Distance      float64   `json:"distance"`
	Stops         int       `json:"stops"`
	AssignedBusID *string   `json:"assignedBusId"`
	DepartureTime string    `json:"departureTime"`
	ArrivalTime   string    `json:"arrivalTime"`
	Status        string    `json:"status"` // Active, Inactive
	Description   string    `json:"description"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type StudentAssignment struct {
	ID          string    `json:"id"`
	StudentID   string    `json:"studentId"`
	StudentName string    `json:"studentName"`
	BusID       string    `json:"busId"`
	RouteID     string    `json:"routeId"`
	PickupStop  string    `json:"pickupStop"`
	DropoffStop string    `json:"dropoffStop"`
	Status      string    `json:"status"` // Active, Inactive
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type TransportSettings struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type MaintenanceRecord struct {
	ID              string     `json:"id"`
	BusID           string     `json:"busId"`
	ServiceDate     time.Time  `json:"serviceDate"`
	Description     string     `json:"description"`
	Cost            float64    `json:"cost"`
	PerformedBy     string     `json:"performedBy"`
	NextServiceDate *time.Time `json:"nextServiceDate"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type FuelLog struct {
	ID              string    `json:"id"`
	BusID           string    `json:"busId"`
	Date            time.Time `json:"date"`
	FuelQuantity    float64   `json:"fuelQuantity"`
	Cost            float64   `json:"cost"`
	OdometerReading float64   `json:"odometerReading"`
	FilledBy        string    `json:"filledBy"`
	Remarks         string    `json:"remarks"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
