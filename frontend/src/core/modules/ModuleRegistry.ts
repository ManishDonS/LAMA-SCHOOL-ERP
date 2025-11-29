/**
 * Module Registry - Core module management system
 */

import {
  ModuleManifest,
  ModuleInstance,
  ModuleState,
  ModuleRegistryEntry,
  ModuleEvent,
  ModuleEventPayload,
  ModuleAPI,
  ModuleFilter,
  ModuleModel,
  ModuleView,
  ModuleMenu,
} from './types';
import { DependencyResolver } from './DependencyResolver';
import { ModuleLoader } from './ModuleLoader';
import { EventEmitter } from './EventEmitter';
import { ModuleValidator } from './ModuleValidator';

export class ModuleRegistry implements ModuleAPI {
  private static instance: ModuleRegistry;
  private registry: Map<string, ModuleRegistryEntry> = new Map();
  private instances: Map<string, ModuleInstance> = new Map();
  private dependencyResolver: DependencyResolver;
  private moduleLoader: ModuleLoader;
  private eventEmitter: EventEmitter;
  private validator: ModuleValidator;
  private hooks: Map<string, Array<(...args: any[]) => Promise<any>>> = new Map();
  private extensions: {
    models: Map<string, Partial<ModuleModel>[]>;
    views: Map<string, Partial<ModuleView>[]>;
    menus: Map<string, Partial<ModuleMenu>[]>;
  };

  private constructor() {
    this.dependencyResolver = new DependencyResolver(this);
    this.moduleLoader = new ModuleLoader(this);
    this.eventEmitter = new EventEmitter();
    this.validator = new ModuleValidator();
    this.extensions = {
      models: new Map(),
      views: new Map(),
      menus: new Map(),
    };
    this.initializeCore();
  }

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  private async initializeCore(): Promise<void> {
    // Load module state from storage
    await this.loadPersistedState();

    // Auto-install and auto-enable modules
    await this.autoInstallModules();
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const stored = localStorage.getItem('module_registry_state');
      if (stored) {
        const state = JSON.parse(stored);
        // Restore module instances
        for (const [id, instance] of Object.entries(state.instances || {})) {
          this.instances.set(id, instance as ModuleInstance);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted module state:', error);
    }
  }

  private async persistState(): Promise<void> {
    try {
      const state = {
        instances: Object.fromEntries(this.instances),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('module_registry_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist module state:', error);
    }
  }

  private async autoInstallModules(): Promise<void> {
    for (const [id, entry] of this.registry) {
      if (entry.manifest.autoInstall && !this.isInstalled(id)) {
        try {
          await this.install(id);
        } catch (error) {
          console.error(`Failed to auto-install module ${id}:`, error);
        }
      }

      if (entry.manifest.autoEnable && this.isInstalled(id) && !this.isEnabled(id)) {
        try {
          await this.enable(id);
        } catch (error) {
          console.error(`Failed to auto-enable module ${id}:`, error);
        }
      }
    }
  }

  // Registry Management
  async register(manifest: ModuleManifest, loader?: () => Promise<any>): Promise<void> {
    // Validate manifest
    const validation = this.validator.validate(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid module manifest: ${validation.errors?.join(', ')}`);
    }

    // Check for conflicts
    const conflicts = this.checkConflicts(manifest);
    if (conflicts.length > 0) {
      throw new Error(`Module conflicts with: ${conflicts.join(', ')}`);
    }

    // Register the module
    this.registry.set(manifest.id, {
      manifest,
      loader,
      source: 'local',
    });

    console.log(`Module registered: ${manifest.id} v${manifest.version}`);
  }

  async unregister(moduleId: string): Promise<void> {
    // Check if module is enabled
    if (this.isEnabled(moduleId)) {
      await this.disable(moduleId);
    }

    // Check if module is installed
    if (this.isInstalled(moduleId)) {
      await this.uninstall(moduleId);
    }

    this.registry.delete(moduleId);
    this.instances.delete(moduleId);

    console.log(`Module unregistered: ${moduleId}`);
  }

  private checkConflicts(manifest: ModuleManifest): string[] {
    const conflicts: string[] = [];

    if (manifest.conflicts) {
      for (const conflictId of manifest.conflicts) {
        if (this.isInstalled(conflictId)) {
          conflicts.push(conflictId);
        }
      }
    }

    return conflicts;
  }

  // Lifecycle Management
  async install(moduleId: string): Promise<void> {
    const entry = this.registry.get(moduleId);
    if (!entry) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    const instance = this.instances.get(moduleId);
    if (instance && instance.state !== ModuleState.UNINSTALLED) {
      throw new Error(`Module already installed: ${moduleId}`);
    }

    try {
      // Update state
      this.updateModuleState(moduleId, ModuleState.INSTALLING);

      // Resolve and install dependencies
      const dependencies = await this.dependencyResolver.resolve(entry.manifest);
      for (const depId of dependencies) {
        if (!this.isInstalled(depId)) {
          await this.install(depId);
        }
      }

      // Execute before install hook
      await this.executeModuleHook(entry.manifest, 'beforeInstall');

      // Load module
      const moduleExports = entry.loader ? await entry.loader() : {};

      // Create instance
      const newInstance: ModuleInstance = {
        manifest: entry.manifest,
        state: ModuleState.INSTALLED,
        installedVersion: entry.manifest.version,
        installedAt: new Date(),
        config: { ...entry.manifest.config },
        exports: moduleExports,
      };

      this.instances.set(moduleId, newInstance);

      // Execute install hook
      await this.executeModuleHook(entry.manifest, 'onInstall');

      // Execute after install hook
      await this.executeModuleHook(entry.manifest, 'afterInstall');

      // Persist state
      await this.persistState();

      // Emit event
      this.emit(ModuleEvent.INSTALLED, {
        moduleId,
        event: ModuleEvent.INSTALLED,
        timestamp: new Date(),
      });

      console.log(`Module installed: ${moduleId}`);
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR, error);
      throw error;
    }
  }

  async uninstall(moduleId: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not installed: ${moduleId}`);
    }

    if (instance.state === ModuleState.ENABLED) {
      await this.disable(moduleId);
    }

    try {
      this.updateModuleState(moduleId, ModuleState.UNINSTALLING);

      // Check for dependent modules
      const dependents = this.findDependentModules(moduleId);
      if (dependents.length > 0) {
        throw new Error(`Cannot uninstall. Required by: ${dependents.join(', ')}`);
      }

      // Execute hooks
      await this.executeModuleHook(instance.manifest, 'beforeUninstall');
      await this.executeModuleHook(instance.manifest, 'onUninstall');
      await this.executeModuleHook(instance.manifest, 'afterUninstall');

      // Remove instance
      this.instances.delete(moduleId);

      // Persist state
      await this.persistState();

      // Emit event
      this.emit(ModuleEvent.UNINSTALLED, {
        moduleId,
        event: ModuleEvent.UNINSTALLED,
        timestamp: new Date(),
      });

      console.log(`Module uninstalled: ${moduleId}`);
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR, error);
      throw error;
    }
  }

  async enable(moduleId: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not installed: ${moduleId}`);
    }

    if (instance.state === ModuleState.ENABLED) {
      return;
    }

    try {
      this.updateModuleState(moduleId, ModuleState.ENABLING);

      // Enable dependencies first
      const deps = instance.manifest.dependencies || [];
      for (const dep of deps) {
        if (dep.required && !this.isEnabled(dep.id)) {
          await this.enable(dep.id);
        }
      }

      // Execute hooks
      await this.executeModuleHook(instance.manifest, 'beforeEnable');
      await this.executeModuleHook(instance.manifest, 'onEnable');

      // Load module
      await this.moduleLoader.load(moduleId);

      // Execute after enable hook
      await this.executeModuleHook(instance.manifest, 'afterEnable');

      // Update state
      instance.state = ModuleState.ENABLED;
      instance.enabledAt = new Date();

      // Persist state
      await this.persistState();

      // Emit event
      this.emit(ModuleEvent.ENABLED, {
        moduleId,
        event: ModuleEvent.ENABLED,
        timestamp: new Date(),
      });

      console.log(`Module enabled: ${moduleId}`);
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR, error);
      throw error;
    }
  }

  async disable(moduleId: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not installed: ${moduleId}`);
    }

    if (instance.state !== ModuleState.ENABLED) {
      return;
    }

    try {
      this.updateModuleState(moduleId, ModuleState.DISABLING);

      // Check for dependent modules
      const dependents = this.findEnabledDependents(moduleId);
      if (dependents.length > 0) {
        throw new Error(`Cannot disable. Required by enabled modules: ${dependents.join(', ')}`);
      }

      // Execute hooks
      await this.executeModuleHook(instance.manifest, 'beforeDisable');
      await this.executeModuleHook(instance.manifest, 'onDisable');

      // Unload module
      await this.moduleLoader.unload(moduleId);

      // Execute after disable hook
      await this.executeModuleHook(instance.manifest, 'afterDisable');

      // Update state
      instance.state = ModuleState.DISABLED;

      // Persist state
      await this.persistState();

      // Emit event
      this.emit(ModuleEvent.DISABLED, {
        moduleId,
        event: ModuleEvent.DISABLED,
        timestamp: new Date(),
      });

      console.log(`Module disabled: ${moduleId}`);
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR, error);
      throw error;
    }
  }

  async upgrade(moduleId: string, version: string): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not installed: ${moduleId}`);
    }

    try {
      this.updateModuleState(moduleId, ModuleState.UPGRADING);

      const fromVersion = instance.installedVersion || '0.0.0';

      // Execute upgrade hooks
      await this.executeModuleHook(instance.manifest, 'beforeUpgrade', fromVersion, version);
      await this.executeModuleHook(instance.manifest, 'onUpgrade', fromVersion, version);

      // Update version
      instance.installedVersion = version;

      // Execute after upgrade hook
      await this.executeModuleHook(instance.manifest, 'afterUpgrade', fromVersion, version);

      // Restore previous state
      instance.state = instance.state === ModuleState.ENABLED ? ModuleState.ENABLED : ModuleState.INSTALLED;

      // Persist state
      await this.persistState();

      // Emit event
      this.emit(ModuleEvent.UPGRADED, {
        moduleId,
        event: ModuleEvent.UPGRADED,
        data: { fromVersion, toVersion: version },
        timestamp: new Date(),
      });

      console.log(`Module upgraded: ${moduleId} (${fromVersion} → ${version})`);
    } catch (error) {
      this.updateModuleState(moduleId, ModuleState.ERROR, error);
      throw error;
    }
  }

  // Query Methods
  getModule(moduleId: string): ModuleInstance | undefined {
    return this.instances.get(moduleId);
  }

  getModules(filter?: ModuleFilter): ModuleInstance[] {
    let modules = Array.from(this.instances.values());

    if (filter) {
      if (filter.state) {
        const states = Array.isArray(filter.state) ? filter.state : [filter.state];
        modules = modules.filter((m) => states.includes(m.state));
      }

      if (filter.category) {
        const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
        modules = modules.filter((m) => categories.includes(m.manifest.category));
      }

      if (filter.tags && filter.tags.length > 0) {
        modules = modules.filter((m) =>
          filter.tags!.some((tag) => m.manifest.tags?.includes(tag))
        );
      }

      if (filter.search) {
        const search = filter.search.toLowerCase();
        modules = modules.filter(
          (m) =>
            m.manifest.name.toLowerCase().includes(search) ||
            m.manifest.description.toLowerCase().includes(search) ||
            m.manifest.id.toLowerCase().includes(search)
        );
      }

      if (filter.enabled !== undefined) {
        modules = modules.filter((m) =>
          filter.enabled ? m.state === ModuleState.ENABLED : m.state !== ModuleState.ENABLED
        );
      }

      if (filter.installed !== undefined) {
        modules = modules.filter((m) =>
          filter.installed
            ? m.state !== ModuleState.UNINSTALLED
            : m.state === ModuleState.UNINSTALLED
        );
      }
    }

    return modules;
  }

  isInstalled(moduleId: string): boolean {
    const instance = this.instances.get(moduleId);
    return instance !== undefined && instance.state !== ModuleState.UNINSTALLED;
  }

  isEnabled(moduleId: string): boolean {
    const instance = this.instances.get(moduleId);
    return instance !== undefined && instance.state === ModuleState.ENABLED;
  }

  // Configuration
  getConfig(moduleId: string, key?: string): any {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      return undefined;
    }

    if (key) {
      return instance.config[key];
    }

    return instance.config;
  }

  async setConfig(moduleId: string, key: string, value: any): Promise<void> {
    const instance = this.instances.get(moduleId);
    if (!instance) {
      throw new Error(`Module not installed: ${moduleId}`);
    }

    // Validate setting
    const setting = instance.manifest.settings?.find((s) => s.key === key);
    if (setting && setting.validation) {
      const result = setting.validation(value);
      if (result !== true) {
        throw new Error(typeof result === 'string' ? result : 'Invalid value');
      }
    }

    instance.config[key] = value;

    // Persist state
    await this.persistState();

    // Emit event
    this.emit(ModuleEvent.CONFIG_CHANGED, {
      moduleId,
      event: ModuleEvent.CONFIG_CHANGED,
      data: { key, value },
      timestamp: new Date(),
    });
  }

  // Events
  on(event: ModuleEvent, handler: (payload: ModuleEventPayload) => void): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: ModuleEvent, handler: (payload: ModuleEventPayload) => void): void {
    this.eventEmitter.off(event, handler);
  }

  emit(event: ModuleEvent, payload: ModuleEventPayload): void {
    this.eventEmitter.emit(event, payload);
  }

  // Extension Points
  extendModel(modelName: string, extension: Partial<ModuleModel>): void {
    if (!this.extensions.models.has(modelName)) {
      this.extensions.models.set(modelName, []);
    }
    this.extensions.models.get(modelName)!.push(extension);
  }

  extendView(viewId: string, extension: Partial<ModuleView>): void {
    if (!this.extensions.views.has(viewId)) {
      this.extensions.views.set(viewId, []);
    }
    this.extensions.views.get(viewId)!.push(extension);
  }

  extendMenu(menuId: string, extension: Partial<ModuleMenu>): void {
    if (!this.extensions.menus.has(menuId)) {
      this.extensions.menus.set(menuId, []);
    }
    this.extensions.menus.get(menuId)!.push(extension);
  }

  getModelExtensions(modelName: string): Partial<ModuleModel>[] {
    return this.extensions.models.get(modelName) || [];
  }

  getViewExtensions(viewId: string): Partial<ModuleView>[] {
    return this.extensions.views.get(viewId) || [];
  }

  getMenuExtensions(menuId: string): Partial<ModuleMenu>[] {
    return this.extensions.menus.get(menuId) || [];
  }

  // Hooks
  registerHook(hookName: string, handler: (...args: any[]) => Promise<any>): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(handler);
  }

  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const handlers = this.hooks.get(hookName) || [];
    const results: any[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        console.error(`Hook execution failed: ${hookName}`, error);
      }
    }

    return results;
  }

  private async executeModuleHook(
    manifest: ModuleManifest,
    hookName: keyof ModuleManifest['hooks'],
    ...args: any[]
  ): Promise<void> {
    const hook = manifest.hooks?.[hookName];
    if (hook && typeof hook === 'function') {
      try {
        await hook(...args);
      } catch (error) {
        console.error(`Module hook failed: ${manifest.id}.${hookName}`, error);
        throw error;
      }
    }
  }

  // Helper Methods
  private updateModuleState(moduleId: string, state: ModuleState, error?: any): void {
    let instance = this.instances.get(moduleId);

    if (!instance) {
      const entry = this.registry.get(moduleId);
      if (!entry) return;

      instance = {
        manifest: entry.manifest,
        state,
        config: {},
      };
      this.instances.set(moduleId, instance);
    }

    instance.state = state;

    if (error) {
      instance.lastError = error instanceof Error ? error.message : String(error);
      this.emit(ModuleEvent.ERROR, {
        moduleId,
        event: ModuleEvent.ERROR,
        data: { error: instance.lastError },
        timestamp: new Date(),
      });
    }
  }

  private findDependentModules(moduleId: string): string[] {
    const dependents: string[] = [];

    for (const [id, instance] of this.instances) {
      if (instance.state === ModuleState.UNINSTALLED) continue;

      const deps = instance.manifest.dependencies || [];
      if (deps.some((dep) => dep.id === moduleId && dep.required)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  private findEnabledDependents(moduleId: string): string[] {
    const dependents: string[] = [];

    for (const [id, instance] of this.instances) {
      if (instance.state !== ModuleState.ENABLED) continue;

      const deps = instance.manifest.dependencies || [];
      if (deps.some((dep) => dep.id === moduleId && dep.required)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  // Export registry for debugging
  getRegistrySnapshot() {
    return {
      registered: Array.from(this.registry.keys()),
      instances: Array.from(this.instances.entries()).map(([id, instance]) => ({
        id,
        state: instance.state,
        version: instance.installedVersion,
      })),
      extensions: {
        models: Array.from(this.extensions.models.keys()),
        views: Array.from(this.extensions.views.keys()),
        menus: Array.from(this.extensions.menus.keys()),
      },
      hooks: Array.from(this.hooks.keys()),
    };
  }
}

// Export singleton instance
export const moduleRegistry = ModuleRegistry.getInstance();
