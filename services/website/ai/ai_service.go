package ai

import (
	"context"
	"school-erp/website/config"
)

// AIService defines the interface for AI operations
type AIService interface {
	DetectIndustry(ctx context.Context, logoURL string) (string, float64, error)
	ExtractColors(ctx context.Context, logoURL string) ([]string, error)
	GenerateContent(ctx context.Context, industry, contentType string) (string, error)
	OptimizeSEO(ctx context.Context, text string) (map[string]string, error)
	GenerateImage(ctx context.Context, prompt string) (string, error)
}

// Service implements AIService
type Service struct {
	config *config.Config
}

// NewService creates a new AI service instance
func NewService(cfg *config.Config) *Service {
	return &Service{
		config: cfg,
	}
}
