package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/school-erp/transport-service/internal/models"
)

type TransportRepository interface {
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

	// Settings
	GetSettings(ctx context.Context) (map[string]string, error)
	UpdateSetting(ctx context.Context, key, value string) error

	// Maintenance
	CreateMaintenance(ctx context.Context, record *models.MaintenanceRecord) error
	ListMaintenance(ctx context.Context, busID string) ([]*models.MaintenanceRecord, error)
	DeleteMaintenance(ctx context.Context, id string) error

	// Fuel Logs
	CreateFuelLog(ctx context.Context, log *models.FuelLog) error
	ListFuelLogs(ctx context.Context, busID string) ([]*models.FuelLog, error)
	DeleteFuelLog(ctx context.Context, id string) error
}

type PostgresRepository struct {
	db *pgxpool.Pool
}

func NewPostgresRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// Bus Implementation
func (r *PostgresRepository) CreateBus(ctx context.Context, bus *models.Bus) error {
	query := `INSERT INTO buses (bus_number, registration_no, model, capacity, driver_id, route_id, status, purchase_date, last_service_date, traccar_device_id, description) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at, updated_at`

	// Ensure empty strings are treated as NULL for UUID fields
	var driverID, routeID *string
	if bus.DriverID != nil && *bus.DriverID != "" {
		driverID = bus.DriverID
	}
	if bus.RouteID != nil && *bus.RouteID != "" {
		routeID = bus.RouteID
	}

	return r.db.QueryRow(ctx, query, bus.BusNumber, bus.RegistrationNo, bus.Model, bus.Capacity, driverID, routeID, bus.Status, bus.PurchaseDate, bus.LastServiceDate, bus.TraccarDeviceID, bus.Description).
		Scan(&bus.ID, &bus.CreatedAt, &bus.UpdatedAt)
}

func (r *PostgresRepository) GetBus(ctx context.Context, id string) (*models.Bus, error) {
	bus := &models.Bus{}
	query := `SELECT id, bus_number, registration_no, model, capacity, driver_id, route_id, status, purchase_date, last_service_date, traccar_device_id, description, created_at, updated_at FROM buses WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(&bus.ID, &bus.BusNumber, &bus.RegistrationNo, &bus.Model, &bus.Capacity, &bus.DriverID, &bus.RouteID, &bus.Status, &bus.PurchaseDate, &bus.LastServiceDate, &bus.TraccarDeviceID, &bus.Description, &bus.CreatedAt, &bus.UpdatedAt)
	return bus, err
}

func (r *PostgresRepository) ListBuses(ctx context.Context) ([]*models.Bus, error) {
	query := `SELECT id, bus_number, registration_no, model, capacity, driver_id, route_id, status, purchase_date, last_service_date, traccar_device_id, description, created_at, updated_at FROM buses`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buses []*models.Bus
	for rows.Next() {
		bus := &models.Bus{}
		if err := rows.Scan(&bus.ID, &bus.BusNumber, &bus.RegistrationNo, &bus.Model, &bus.Capacity, &bus.DriverID, &bus.RouteID, &bus.Status, &bus.PurchaseDate, &bus.LastServiceDate, &bus.TraccarDeviceID, &bus.Description, &bus.CreatedAt, &bus.UpdatedAt); err != nil {
			return nil, err
		}
		buses = append(buses, bus)
	}
	return buses, nil
}

func (r *PostgresRepository) UpdateBus(ctx context.Context, bus *models.Bus) error {
	query := `UPDATE buses SET bus_number=$1, registration_no=$2, model=$3, capacity=$4, driver_id=$5, route_id=$6, status=$7, purchase_date=$8, last_service_date=$9, traccar_device_id=$10, description=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$12`

	// Ensure empty strings are treated as NULL for UUID fields
	var driverID, routeID *string
	if bus.DriverID != nil && *bus.DriverID != "" {
		driverID = bus.DriverID
	}
	if bus.RouteID != nil && *bus.RouteID != "" {
		routeID = bus.RouteID
	}

	_, err := r.db.Exec(ctx, query, bus.BusNumber, bus.RegistrationNo, bus.Model, bus.Capacity, driverID, routeID, bus.Status, bus.PurchaseDate, bus.LastServiceDate, bus.TraccarDeviceID, bus.Description, bus.ID)
	return err
}

func (r *PostgresRepository) DeleteBus(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM buses WHERE id=$1", id)
	return err
}

// Driver Implementation
func (r *PostgresRepository) CreateDriver(ctx context.Context, driver *models.Driver) error {
	query := `INSERT INTO drivers (name, email, phone, license_number, license_expiry, assigned_bus_id, status, join_date, address, emergency_contact) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at, updated_at`

	var assignedBusID *string
	if driver.AssignedBusID != nil && *driver.AssignedBusID != "" {
		assignedBusID = driver.AssignedBusID
	}

	return r.db.QueryRow(ctx, query, driver.Name, driver.Email, driver.Phone, driver.LicenseNumber, driver.LicenseExpiry, assignedBusID, driver.Status, driver.JoinDate, driver.Address, driver.EmergencyContact).
		Scan(&driver.ID, &driver.CreatedAt, &driver.UpdatedAt)
}

func (r *PostgresRepository) GetDriver(ctx context.Context, id string) (*models.Driver, error) {
	driver := &models.Driver{}
	query := `SELECT id, name, email, phone, license_number, license_expiry, assigned_bus_id, status, join_date, address, emergency_contact, created_at, updated_at FROM drivers WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(&driver.ID, &driver.Name, &driver.Email, &driver.Phone, &driver.LicenseNumber, &driver.LicenseExpiry, &driver.AssignedBusID, &driver.Status, &driver.JoinDate, &driver.Address, &driver.EmergencyContact, &driver.CreatedAt, &driver.UpdatedAt)
	return driver, err
}

func (r *PostgresRepository) ListDrivers(ctx context.Context) ([]*models.Driver, error) {
	query := `SELECT id, name, email, phone, license_number, license_expiry, assigned_bus_id, status, join_date, address, emergency_contact, created_at, updated_at FROM drivers`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drivers []*models.Driver
	for rows.Next() {
		driver := &models.Driver{}
		if err := rows.Scan(&driver.ID, &driver.Name, &driver.Email, &driver.Phone, &driver.LicenseNumber, &driver.LicenseExpiry, &driver.AssignedBusID, &driver.Status, &driver.JoinDate, &driver.Address, &driver.EmergencyContact, &driver.CreatedAt, &driver.UpdatedAt); err != nil {
			return nil, err
		}
		drivers = append(drivers, driver)
	}
	return drivers, nil
}

func (r *PostgresRepository) UpdateDriver(ctx context.Context, driver *models.Driver) error {
	query := `UPDATE drivers SET name=$1, email=$2, phone=$3, license_number=$4, license_expiry=$5, assigned_bus_id=$6, status=$7, join_date=$8, address=$9, emergency_contact=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11`

	var assignedBusID *string
	if driver.AssignedBusID != nil && *driver.AssignedBusID != "" {
		assignedBusID = driver.AssignedBusID
	}

	_, err := r.db.Exec(ctx, query, driver.Name, driver.Email, driver.Phone, driver.LicenseNumber, driver.LicenseExpiry, assignedBusID, driver.Status, driver.JoinDate, driver.Address, driver.EmergencyContact, driver.ID)
	return err
}

func (r *PostgresRepository) DeleteDriver(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM drivers WHERE id=$1", id)
	return err
}

// Route Implementation
func (r *PostgresRepository) CreateRoute(ctx context.Context, route *models.Route) error {
	query := `INSERT INTO routes (route_name, route_number, start_point, end_point, distance, stops, assigned_bus_id, departure_time, arrival_time, status, description) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at, updated_at`

	var assignedBusID *string
	if route.AssignedBusID != nil && *route.AssignedBusID != "" {
		assignedBusID = route.AssignedBusID
	}

	return r.db.QueryRow(ctx, query, route.RouteName, route.RouteNumber, route.StartPoint, route.EndPoint, route.Distance, route.Stops, assignedBusID, route.DepartureTime, route.ArrivalTime, route.Status, route.Description).
		Scan(&route.ID, &route.CreatedAt, &route.UpdatedAt)
}

func (r *PostgresRepository) GetRoute(ctx context.Context, id string) (*models.Route, error) {
	route := &models.Route{}
	query := `SELECT id, route_name, route_number, start_point, end_point, distance, stops, assigned_bus_id, departure_time, arrival_time, status, description, created_at, updated_at FROM routes WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(&route.ID, &route.RouteName, &route.RouteNumber, &route.StartPoint, &route.EndPoint, &route.Distance, &route.Stops, &route.AssignedBusID, &route.DepartureTime, &route.ArrivalTime, &route.Status, &route.Description, &route.CreatedAt, &route.UpdatedAt)
	return route, err
}

func (r *PostgresRepository) ListRoutes(ctx context.Context) ([]*models.Route, error) {
	query := `SELECT id, route_name, route_number, start_point, end_point, distance, stops, assigned_bus_id, departure_time, arrival_time, status, description, created_at, updated_at FROM routes`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routes []*models.Route
	for rows.Next() {
		route := &models.Route{}
		if err := rows.Scan(&route.ID, &route.RouteName, &route.RouteNumber, &route.StartPoint, &route.EndPoint, &route.Distance, &route.Stops, &route.AssignedBusID, &route.DepartureTime, &route.ArrivalTime, &route.Status, &route.Description, &route.CreatedAt, &route.UpdatedAt); err != nil {
			return nil, err
		}
		routes = append(routes, route)
	}
	return routes, nil
}

func (r *PostgresRepository) UpdateRoute(ctx context.Context, route *models.Route) error {
	query := `UPDATE routes SET route_name=$1, route_number=$2, start_point=$3, end_point=$4, distance=$5, stops=$6, assigned_bus_id=$7, departure_time=$8, arrival_time=$9, status=$10, description=$11, updated_at=CURRENT_TIMESTAMP WHERE id=$12`

	var assignedBusID *string
	if route.AssignedBusID != nil && *route.AssignedBusID != "" {
		assignedBusID = route.AssignedBusID
	}

	_, err := r.db.Exec(ctx, query, route.RouteName, route.RouteNumber, route.StartPoint, route.EndPoint, route.Distance, route.Stops, assignedBusID, route.DepartureTime, route.ArrivalTime, route.Status, route.Description, route.ID)
	return err
}

func (r *PostgresRepository) DeleteRoute(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM routes WHERE id=$1", id)
	return err
}

// Assignment Implementation
func (r *PostgresRepository) CreateAssignment(ctx context.Context, assignment *models.StudentAssignment) error {
	query := `INSERT INTO student_assignments (student_id, student_name, bus_id, route_id, pickup_stop, dropoff_stop, status) 
              VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(ctx, query, assignment.StudentID, assignment.StudentName, assignment.BusID, assignment.RouteID, assignment.PickupStop, assignment.DropoffStop, assignment.Status).
		Scan(&assignment.ID, &assignment.CreatedAt, &assignment.UpdatedAt)
}

func (r *PostgresRepository) ListAssignments(ctx context.Context) ([]*models.StudentAssignment, error) {
	query := `SELECT id, student_id, student_name, bus_id, route_id, pickup_stop, dropoff_stop, status, created_at, updated_at FROM student_assignments`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []*models.StudentAssignment
	for rows.Next() {
		assignment := &models.StudentAssignment{}
		if err := rows.Scan(&assignment.ID, &assignment.StudentID, &assignment.StudentName, &assignment.BusID, &assignment.RouteID, &assignment.PickupStop, &assignment.DropoffStop, &assignment.Status, &assignment.CreatedAt, &assignment.UpdatedAt); err != nil {
			return nil, err
		}
		assignments = append(assignments, assignment)
	}
	return assignments, nil
}

func (r *PostgresRepository) DeleteAssignment(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM student_assignments WHERE id=$1", id)
	return err
}

// Settings Implementation
func (r *PostgresRepository) GetSettings(ctx context.Context) (map[string]string, error) {
	query := `SELECT key, value FROM transport_settings`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		settings[key] = value
	}
	return settings, nil
}

func (r *PostgresRepository) UpdateSetting(ctx context.Context, key, value string) error {
	query := `INSERT INTO transport_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, key, value)
	return err
}

// Maintenance Implementation
func (r *PostgresRepository) CreateMaintenance(ctx context.Context, record *models.MaintenanceRecord) error {
	query := `INSERT INTO bus_maintenance (bus_id, service_date, description, cost, performed_by, next_service_date) 
              VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(ctx, query, record.BusID, record.ServiceDate, record.Description, record.Cost, record.PerformedBy, record.NextServiceDate).
		Scan(&record.ID, &record.CreatedAt, &record.UpdatedAt)
}

func (r *PostgresRepository) ListMaintenance(ctx context.Context, busID string) ([]*models.MaintenanceRecord, error) {
	query := `SELECT id, bus_id, service_date, description, cost, performed_by, next_service_date, created_at, updated_at FROM bus_maintenance`
	var args []interface{}
	if busID != "" {
		query += " WHERE bus_id = $1"
		args = append(args, busID)
	}
	query += " ORDER BY service_date DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*models.MaintenanceRecord
	for rows.Next() {
		record := &models.MaintenanceRecord{}
		if err := rows.Scan(&record.ID, &record.BusID, &record.ServiceDate, &record.Description, &record.Cost, &record.PerformedBy, &record.NextServiceDate, &record.CreatedAt, &record.UpdatedAt); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, nil
}

func (r *PostgresRepository) DeleteMaintenance(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM bus_maintenance WHERE id=$1", id)
	return err
}

// Fuel Log Implementation
func (r *PostgresRepository) CreateFuelLog(ctx context.Context, log *models.FuelLog) error {
	query := `INSERT INTO bus_fuel_logs (bus_id, date, fuel_quantity, cost, odometer_reading, filled_by, remarks) 
              VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at, updated_at`
	return r.db.QueryRow(ctx, query, log.BusID, log.Date, log.FuelQuantity, log.Cost, log.OdometerReading, log.FilledBy, log.Remarks).
		Scan(&log.ID, &log.CreatedAt, &log.UpdatedAt)
}

func (r *PostgresRepository) ListFuelLogs(ctx context.Context, busID string) ([]*models.FuelLog, error) {
	query := `SELECT id, bus_id, date, fuel_quantity, cost, odometer_reading, filled_by, remarks, created_at, updated_at FROM bus_fuel_logs`
	var args []interface{}
	if busID != "" {
		query += " WHERE bus_id = $1"
		args = append(args, busID)
	}
	query += " ORDER BY date DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.FuelLog
	for rows.Next() {
		log := &models.FuelLog{}
		if err := rows.Scan(&log.ID, &log.BusID, &log.Date, &log.FuelQuantity, &log.Cost, &log.OdometerReading, &log.FilledBy, &log.Remarks, &log.CreatedAt, &log.UpdatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}
	return logs, nil
}

func (r *PostgresRepository) DeleteFuelLog(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM bus_fuel_logs WHERE id=$1", id)
	return err
}
