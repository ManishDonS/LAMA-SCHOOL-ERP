package routes

import (
	"database/sql"

	"school-erp/payroll/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, db *sql.DB) {
	api := app.Group("/api/v1")

	// Initialize handlers
	structureHandler := &handlers.PayrollStructureHandler{DB: db}
	processingHandler := &handlers.PayrollProcessingHandler{DB: db}
	slipHandler := &handlers.SalarySlipHandler{DB: db}
	reportsHandler := &handlers.ReportsHandler{DB: db}
	pdfHandler := &handlers.PDFHandler{DB: db}
	taxHandler := &handlers.TaxHandler{DB: db}
	loanHandler := &handlers.LoanHandler{DB: db}

	// Payroll Structure routes
	structures := api.Group("/payroll-structures")
	structures.Get("/", structureHandler.GetAllPayrollStructures)
	structures.Get("/:id", structureHandler.GetPayrollStructure)
	structures.Get("/staff/:staffId", structureHandler.GetPayrollStructureByStaffID)
	structures.Post("/", structureHandler.CreatePayrollStructure)
	structures.Put("/:id", structureHandler.UpdatePayrollStructure)
	structures.Delete("/:id", structureHandler.DeletePayrollStructure)

	// Payroll Processing routes
	payroll := api.Group("/payroll")
	payroll.Post("/generate", processingHandler.GeneratePayroll)
	payroll.Get("/records", processingHandler.GetPayrollRecords)
	payroll.Post("/approve", processingHandler.ApprovePayroll)
	payroll.Post("/process", processingHandler.ProcessPayroll)
	payroll.Get("/summary", processingHandler.GetPayrollSummary)
	payroll.Put("/records/:id", processingHandler.UpdatePayrollRecord)

	// Salary Slip routes
	slips := api.Group("/salary-slips")
	slips.Post("/generate", slipHandler.GenerateSalarySlips)
	slips.Get("/", slipHandler.GetSalarySlips)
	slips.Get("/:id", slipHandler.GetSalarySlipDetails)
	slips.Post("/mark-sent", slipHandler.MarkSlipAsSent)

	// PDF Generation routes
	pdf := api.Group("/pdf")
	pdf.Get("/salary-slip/:id", pdfHandler.GenerateSalarySlipPDF)
	pdf.Post("/bulk-generate", pdfHandler.BulkGeneratePDFs)

	// Tax Calculation routes
	tax := api.Group("/tax")
	tax.Post("/calculate", taxHandler.CalculateTax)
	tax.Get("/slabs", taxHandler.GetTaxSlabs)
	tax.Put("/payroll/:id", taxHandler.UpdatePayrollWithTax)
	tax.Get("/report/:staffId", taxHandler.GenerateTaxReport)

	// Loan Management routes
	loans := api.Group("/loans")
	loans.Get("/", loanHandler.GetStaffLoans)
	loans.Post("/", loanHandler.CreateLoan)
	loans.Post("/:id/approve", loanHandler.ApproveLoan)
	loans.Get("/staff/:staffId", loanHandler.GetStaffLoans)
	loans.Post("/process-emi", loanHandler.ProcessLoanEMI)
	loans.Get("/summary", loanHandler.GetLoanSummary)

	// Reports routes
	reports := api.Group("/reports")
	reports.Get("/department-salary", reportsHandler.GetDepartmentWiseSalary)
	reports.Get("/monthly-trend", reportsHandler.GetMonthlyPayrollTrend)
	reports.Get("/analytics", reportsHandler.GetPayrollAnalytics)
	reports.Get("/staff/:staffId/history", reportsHandler.GetStaffPayrollHistory)
	reports.Get("/export", reportsHandler.ExportPayrollReport)
}
