/**
 * Module Validator - Validates module manifests
 */

import { ModuleManifest } from './types';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export class ModuleValidator {
  /**
   * Validate a module manifest
   */
  validate(manifest: ModuleManifest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.id) {
      errors.push('Module ID is required');
    } else if (!/^[a-z0-9-_]+$/.test(manifest.id)) {
      errors.push('Module ID must contain only lowercase letters, numbers, hyphens, and underscores');
    }

    if (!manifest.name) {
      errors.push('Module name is required');
    }

    if (!manifest.version) {
      errors.push('Module version is required');
    } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Module version must follow semver format (e.g., 1.0.0)');
    }

    if (!manifest.description) {
      warnings.push('Module description is recommended');
    }

    if (!manifest.author) {
      warnings.push('Module author is recommended');
    }

    // Validate dependencies
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!dep.id) {
          errors.push('Dependency ID is required');
        }

        if (dep.version && !/^[~^>=<]?\d+\.\d+\.\d+/.test(dep.version)) {
          errors.push(`Invalid version format for dependency: ${dep.id}`);
        }
      }

      // Check for circular dependencies in manifest
      const depIds = manifest.dependencies.map((d) => d.id);
      if (depIds.includes(manifest.id)) {
        errors.push('Module cannot depend on itself');
      }
    }

    // Validate routes
    if (manifest.routes) {
      for (const route of manifest.routes) {
        if (!route.path) {
          errors.push('Route path is required');
        } else if (!route.path.startsWith('/')) {
          errors.push(`Route path must start with /: ${route.path}`);
        }

        if (!route.component) {
          errors.push(`Route component is required for path: ${route.path}`);
        }
      }
    }

    // Validate menus
    if (manifest.menus) {
      const menuIds = new Set<string>();
      for (const menu of manifest.menus) {
        if (!menu.id) {
          errors.push('Menu ID is required');
        } else if (menuIds.has(menu.id)) {
          errors.push(`Duplicate menu ID: ${menu.id}`);
        } else {
          menuIds.add(menu.id);
        }

        if (!menu.name) {
          errors.push(`Menu name is required for ID: ${menu.id}`);
        }
      }
    }

    // Validate models
    if (manifest.models) {
      for (const model of manifest.models) {
        if (!model.name) {
          errors.push('Model name is required');
        }

        if (!model.fields || model.fields.length === 0) {
          errors.push(`Model must have at least one field: ${model.name}`);
        }

        // Validate fields
        if (model.fields) {
          const fieldNames = new Set<string>();
          for (const field of model.fields) {
            if (!field.name) {
              errors.push(`Field name is required in model: ${model.name}`);
            } else if (fieldNames.has(field.name)) {
              errors.push(`Duplicate field name in model ${model.name}: ${field.name}`);
            } else {
              fieldNames.add(field.name);
            }

            if (!field.type) {
              errors.push(`Field type is required for ${model.name}.${field.name}`);
            }
          }
        }
      }
    }

    // Validate views
    if (manifest.views) {
      for (const view of manifest.views) {
        if (!view.id) {
          errors.push('View ID is required');
        }

        if (!view.name) {
          errors.push(`View name is required for ID: ${view.id}`);
        }

        if (!view.model) {
          errors.push(`View model is required for ID: ${view.id}`);
        }

        if (!view.type) {
          errors.push(`View type is required for ID: ${view.id}`);
        }
      }
    }

    // Validate settings
    if (manifest.settings) {
      const settingKeys = new Set<string>();
      for (const setting of manifest.settings) {
        if (!setting.key) {
          errors.push('Setting key is required');
        } else if (settingKeys.has(setting.key)) {
          errors.push(`Duplicate setting key: ${setting.key}`);
        } else {
          settingKeys.add(setting.key);
        }

        if (!setting.name) {
          errors.push(`Setting name is required for key: ${setting.key}`);
        }

        if (!setting.type) {
          errors.push(`Setting type is required for key: ${setting.key}`);
        }
      }
    }

    // Validate permissions
    if (manifest.permissions) {
      const permissionIds = new Set<string>();
      for (const permission of manifest.permissions) {
        if (!permission.id) {
          errors.push('Permission ID is required');
        } else if (permissionIds.has(permission.id)) {
          errors.push(`Duplicate permission ID: ${permission.id}`);
        } else {
          permissionIds.add(permission.id);
        }

        if (!permission.name) {
          errors.push(`Permission name is required for ID: ${permission.id}`);
        }

        if (!permission.category) {
          warnings.push(`Permission category is recommended for ID: ${permission.id}`);
        }
      }
    }

    // Validate extends/inherits
    if (manifest.extends && manifest.inherits) {
      errors.push('Module cannot both extend and inherit. Choose one.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate configuration value
   */
  validateConfig(
    setting: import('./types').ModuleSetting,
    value: any
  ): { valid: boolean; error?: string } {
    // Type validation
    switch (setting.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a string' };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: 'Value must be a number' };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Value must be a boolean' };
        }
        break;

      case 'select':
      case 'multi-select':
        if (!setting.options) {
          return { valid: false, error: 'Options not defined for select field' };
        }

        if (setting.type === 'multi-select') {
          if (!Array.isArray(value)) {
            return { valid: false, error: 'Value must be an array' };
          }
          const validValues = setting.options.map((o) => o.value);
          for (const v of value) {
            if (!validValues.includes(v)) {
              return { valid: false, error: `Invalid value: ${v}` };
            }
          }
        } else {
          const validValues = setting.options.map((o) => o.value);
          if (!validValues.includes(value)) {
            return { valid: false, error: 'Invalid value' };
          }
        }
        break;

      case 'json':
        try {
          JSON.stringify(value);
        } catch {
          return { valid: false, error: 'Value must be valid JSON' };
        }
        break;
    }

    // Custom validation
    if (setting.validation) {
      const result = setting.validation(value);
      if (result !== true) {
        return { valid: false, error: typeof result === 'string' ? result : 'Validation failed' };
      }
    }

    // Required validation
    if (setting.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'Value is required' };
    }

    return { valid: true };
  }
}
