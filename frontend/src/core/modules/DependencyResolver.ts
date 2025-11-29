/**
 * Dependency Resolver - Handles module dependency resolution and ordering
 */

import { ModuleManifest, ModuleDependency } from './types';
import { ModuleRegistry } from './ModuleRegistry';
import * as semver from 'semver';

export class DependencyResolver {
  constructor(private registry: ModuleRegistry) {}

  /**
   * Resolve dependencies and return installation order
   */
  async resolve(manifest: ModuleManifest): Promise<string[]> {
    const resolved: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = async (moduleId: string, currentManifest?: ModuleManifest): Promise<void> => {
      // Detect circular dependencies
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected: ${moduleId}`);
      }

      // Already resolved
      if (visited.has(moduleId)) {
        return;
      }

      visiting.add(moduleId);

      // Get manifest if not provided
      const manifest = currentManifest || this.registry.getModule(moduleId)?.manifest;
      if (!manifest) {
        throw new Error(`Module not found: ${moduleId}`);
      }

      // Process dependencies
      const dependencies = manifest.dependencies || [];
      for (const dep of dependencies) {
        if (dep.required !== false) {
          // Check if dependency is available
          const depModule = this.registry.getModule(dep.id);
          if (!depModule) {
            throw new Error(`Required dependency not found: ${dep.id} (required by ${moduleId})`);
          }

          // Check version compatibility
          if (dep.version) {
            const installedVersion = depModule.installedVersion || '0.0.0';
            if (!this.isVersionCompatible(installedVersion, dep.version)) {
              throw new Error(
                `Version mismatch: ${dep.id} requires ${dep.version}, but ${installedVersion} is installed`
              );
            }
          }

          // Recursively resolve
          await visit(dep.id, depModule.manifest);
        }
      }

      visiting.delete(moduleId);
      visited.add(moduleId);
      resolved.push(moduleId);
    };

    await visit(manifest.id, manifest);

    return resolved;
  }

  /**
   * Check if installed version satisfies requirement
   */
  private isVersionCompatible(installed: string, required: string): boolean {
    try {
      // Try using semver if available
      if (typeof semver !== 'undefined' && semver.satisfies) {
        return semver.satisfies(installed, required);
      }

      // Fallback to simple comparison
      return this.simpleVersionCompare(installed, required);
    } catch {
      return this.simpleVersionCompare(installed, required);
    }
  }

  /**
   * Simple version comparison fallback
   */
  private simpleVersionCompare(installed: string, required: string): boolean {
    // Handle simple cases like "^1.0.0", ">=1.0.0", "~1.0.0"
    const rangeMatch = required.match(/^([~^>=<]+)?(.+)$/);
    if (!rangeMatch) return installed === required;

    const [, operator, version] = rangeMatch;
    const installedParts = installed.split('.').map(Number);
    const requiredParts = version.split('.').map(Number);

    if (operator === '^') {
      // Compatible with major version
      return installedParts[0] === requiredParts[0] && installed >= version;
    } else if (operator === '~') {
      // Compatible with minor version
      return (
        installedParts[0] === requiredParts[0] &&
        installedParts[1] === requiredParts[1] &&
        installed >= version
      );
    } else if (operator === '>=') {
      return installed >= version;
    } else if (operator === '>') {
      return installed > version;
    } else if (operator === '<=') {
      return installed <= version;
    } else if (operator === '<') {
      return installed < version;
    }

    return installed === version;
  }

  /**
   * Get load order for all enabled modules
   */
  getLoadOrder(): string[] {
    const modules = this.registry.getModules({ enabled: true });
    const ordered: string[] = [];
    const visited = new Set<string>();

    const visit = (moduleId: string): void => {
      if (visited.has(moduleId)) return;

      const module = this.registry.getModule(moduleId);
      if (!module) return;

      // Visit dependencies first
      const deps = module.manifest.dependencies || [];
      for (const dep of deps) {
        visit(dep.id);
      }

      visited.add(moduleId);
      ordered.push(moduleId);
    };

    // Sort by priority first
    const sortedModules = modules.sort((a, b) => {
      const priorityA = a.manifest.priority || 0;
      const priorityB = b.manifest.priority || 0;
      return priorityB - priorityA;
    });

    for (const module of sortedModules) {
      visit(module.manifest.id);
    }

    return ordered;
  }

  /**
   * Check if all dependencies are satisfied
   */
  checkDependencies(manifest: ModuleManifest): {
    satisfied: boolean;
    missing: string[];
    incompatible: Array<{ id: string; required: string; installed: string }>;
  } {
    const missing: string[] = [];
    const incompatible: Array<{ id: string; required: string; installed: string }> = [];

    const dependencies = manifest.dependencies || [];
    for (const dep of dependencies) {
      const depModule = this.registry.getModule(dep.id);

      if (!depModule) {
        if (dep.required !== false) {
          missing.push(dep.id);
        }
        continue;
      }

      if (dep.version) {
        const installedVersion = depModule.installedVersion || '0.0.0';
        if (!this.isVersionCompatible(installedVersion, dep.version)) {
          incompatible.push({
            id: dep.id,
            required: dep.version,
            installed: installedVersion,
          });
        }
      }
    }

    return {
      satisfied: missing.length === 0 && incompatible.length === 0,
      missing,
      incompatible,
    };
  }

  /**
   * Get dependency tree
   */
  getDependencyTree(moduleId: string, depth = 0, maxDepth = 10): any {
    if (depth > maxDepth) {
      return { error: 'Max depth exceeded' };
    }

    const module = this.registry.getModule(moduleId);
    if (!module) {
      return { error: 'Module not found' };
    }

    const dependencies = module.manifest.dependencies || [];
    return {
      id: moduleId,
      version: module.installedVersion,
      dependencies: dependencies.map((dep) => this.getDependencyTree(dep.id, depth + 1, maxDepth)),
    };
  }
}
