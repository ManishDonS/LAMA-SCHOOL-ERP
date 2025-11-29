/**
 * Module Context - React context for module system
 */

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { moduleRegistry } from './ModuleRegistry';
import { ModuleAPI, ModuleEvent, ModuleEventPayload } from './types';

interface ModuleContextValue {
  api: ModuleAPI;
  ready: boolean;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export const useModuleContext = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within ModuleProvider');
  }
  return context;
};

interface ModuleProviderProps {
  children: ReactNode;
  onReady?: () => void;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children, onReady }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize module system
    const initialize = async () => {
      try {
        // Load enabled modules
        const enabledModules = moduleRegistry.getModules({ enabled: true });
        console.log(`Loaded ${enabledModules.length} enabled modules`);

        setReady(true);
        onReady?.();
      } catch (error) {
        console.error('Failed to initialize module system:', error);
      }
    };

    initialize();
  }, [onReady]);

  const value: ModuleContextValue = {
    api: moduleRegistry,
    ready,
  };

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
};
