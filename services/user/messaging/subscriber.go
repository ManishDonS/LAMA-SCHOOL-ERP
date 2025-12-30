package messaging

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/nats-io/nats.go"
)

// ModuleCache stores the activation status of modules across different schools
type ModuleCache struct {
	mu            sync.RWMutex
	ActiveModules map[string][]string // schoolID -> list of active modules
}

var Cache = &ModuleCache{
	ActiveModules: make(map[string][]string),
}

// IsModuleActive checks if a module is active for a given school
func (c *ModuleCache) IsModuleActive(schoolID, moduleKey string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()

	active, ok := c.ActiveModules[schoolID]
	if !ok {
		return false
	}

	for _, m := range active {
		if m == moduleKey {
			return true
		}
	}
	return false
}

// SubscribeModuleUpdates listens for module status changes from NATS
func SubscribeModuleUpdates() {
	if NatsConnection == nil {
		return
	}

	_, err := NatsConnection.Subscribe("school.modules.updated", func(msg *nats.Msg) {
		var event struct {
			SchoolID      string   `json:"school_id"`
			ActiveModules []string `json:"active_modules"`
		}

		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("Error unmarshaling module update event: %v", err)
			return
		}

		Cache.mu.Lock()
		Cache.ActiveModules[event.SchoolID] = event.ActiveModules
		Cache.mu.Unlock()

		log.Printf("Updated module cache for school %s: %v", event.SchoolID, event.ActiveModules)
	})

	if err != nil {
		log.Printf("Error subscribing to module updates: %v", err)
	}
}
