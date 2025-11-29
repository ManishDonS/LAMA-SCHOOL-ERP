/**
 * React Hooks for Module System
 */

import { useState, useEffect, useCallback } from 'react';
import { moduleRegistry } from './ModuleRegistry';
import {
  ModuleInstance,
  ModuleState,
  ModuleEvent,
  ModuleFilter,
  ModuleEventPayload,
} from './types';

/**
 * Hook to get a single module
 */
export function useModule(moduleId: string): ModuleInstance | undefined {
  const [module, setModule] = useState<ModuleInstance | undefined>(() =>
    moduleRegistry.getModule(moduleId)
  );

  useEffect(() => {
    const handleUpdate = (payload: ModuleEventPayload) => {
      if (payload.moduleId === moduleId) {
        setModule(moduleRegistry.getModule(moduleId));
      }
    };

    // Subscribe to all module events for this module
    moduleRegistry.on(ModuleEvent.INSTALLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.UNINSTALLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.ENABLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.DISABLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.UPGRADED, handleUpdate);
    moduleRegistry.on(ModuleEvent.CONFIG_CHANGED, handleUpdate);

    return () => {
      moduleRegistry.off(ModuleEvent.INSTALLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.UNINSTALLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.ENABLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.DISABLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.UPGRADED, handleUpdate);
      moduleRegistry.off(ModuleEvent.CONFIG_CHANGED, handleUpdate);
    };
  }, [moduleId]);

  return module;
}

/**
 * Hook to get multiple modules with filtering
 */
export function useModules(filter?: ModuleFilter): ModuleInstance[] {
  const [modules, setModules] = useState<ModuleInstance[]>(() =>
    moduleRegistry.getModules(filter)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setModules(moduleRegistry.getModules(filter));
    };

    // Subscribe to all module events
    moduleRegistry.on(ModuleEvent.INSTALLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.UNINSTALLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.ENABLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.DISABLED, handleUpdate);
    moduleRegistry.on(ModuleEvent.UPGRADED, handleUpdate);

    return () => {
      moduleRegistry.off(ModuleEvent.INSTALLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.UNINSTALLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.ENABLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.DISABLED, handleUpdate);
      moduleRegistry.off(ModuleEvent.UPGRADED, handleUpdate);
    };
  }, [filter]);

  return modules;
}

/**
 * Hook to get and set module configuration
 */
export function useModuleConfig<T = any>(
  moduleId: string,
  key?: string
): [T | undefined, (value: T) => Promise<void>] {
  const [config, setConfigState] = useState<T | undefined>(() =>
    moduleRegistry.getConfig(moduleId, key)
  );

  useEffect(() => {
    const handleConfigChange = (payload: ModuleEventPayload) => {
      if (payload.moduleId === moduleId) {
        if (!key || payload.data?.key === key) {
          setConfigState(moduleRegistry.getConfig(moduleId, key));
        }
      }
    };

    moduleRegistry.on(ModuleEvent.CONFIG_CHANGED, handleConfigChange);

    return () => {
      moduleRegistry.off(ModuleEvent.CONFIG_CHANGED, handleConfigChange);
    };
  }, [moduleId, key]);

  const setConfig = useCallback(
    async (value: T) => {
      if (!key) {
        throw new Error('Cannot set config without a key');
      }
      await moduleRegistry.setConfig(moduleId, key, value);
    },
    [moduleId, key]
  );

  return [config, setConfig];
}

/**
 * Hook to check if a module is installed
 */
export function useModuleInstalled(moduleId: string): boolean {
  const module = useModule(moduleId);
  return module !== undefined && module.state !== ModuleState.UNINSTALLED;
}

/**
 * Hook to check if a module is enabled
 */
export function useModuleEnabled(moduleId: string): boolean {
  const module = useModule(moduleId);
  return module !== undefined && module.state === ModuleState.ENABLED;
}

/**
 * Hook for module actions
 */
export function useModuleActions(moduleId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const install = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await moduleRegistry.install(moduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  const uninstall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await moduleRegistry.uninstall(moduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await moduleRegistry.enable(moduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await moduleRegistry.disable(moduleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  const upgrade = useCallback(
    async (version: string) => {
      setLoading(true);
      setError(null);
      try {
        await moduleRegistry.upgrade(moduleId, version);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [moduleId]
  );

  return {
    install,
    uninstall,
    enable,
    disable,
    upgrade,
    loading,
    error,
  };
}
