package domain

type Module struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"` // Emoji or icon name
}

var AvailableModules = []Module{
	{
		ID:          "students",
		Name:        "Student Management",
		Description: "Manage student profiles, admissions, and records.",
		Category:    "Core",
		Icon:        "👨‍🎓",
	},
	{
		ID:          "teachers",
		Name:        "Teacher Management",
		Description: "Manage teacher profiles and assignments.",
		Category:    "Core",
		Icon:        "👨‍🏫",
	},
	{
		ID:          "attendance",
		Name:        "Attendance",
		Description: "Track student and staff attendance.",
		Category:    "Core",
		Icon:        "📋",
	},
	{
		ID:          "accounting",
		Name:        "Accounting",
		Description: "Manage fees, expenses, and financial reports.",
		Category:    "Finance",
		Icon:        "💰",
	},
	{
		ID:          "library",
		Name:        "Library",
		Description: "Manage books, issues, and returns.",
		Category:    "Academic",
		Icon:        "📚",
	},
	{
		ID:          "exams",
		Name:        "Exams",
		Description: "Schedule exams and manage grades.",
		Category:    "Academic",
		Icon:        "📝",
	},
	{
		ID:          "transport",
		Name:        "Transport",
		Description: "Manage school buses and routes.",
		Category:    "Operations",
		Icon:        "🚌",
	},
	{
		ID:          "communication",
		Name:        "Communication",
		Description: "Chat and messaging system.",
		Category:    "Communication",
		Icon:        "💬",
	},
	{
		ID:          "website",
		Name:        "Website Builder",
		Description: "Manage school website content.",
		Category:    "Marketing",
		Icon:        "🌐",
	},
}

// IsModuleValid checks if a module ID exists in the registry
func IsModuleValid(id string) bool {
	for _, m := range AvailableModules {
		if m.ID == id {
			return true
		}
	}
	return false
}
