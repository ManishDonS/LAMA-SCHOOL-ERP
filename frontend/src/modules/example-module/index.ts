/**
 * Example Module
 * Demonstrates all features of the module system
 */

import manifest from './manifest.json';
import { ModuleManifest } from '../../core/modules/types';

// Export manifest
export { default as manifest } from './manifest.json';

// Export components
export * from './components';

// Export services
export * from './services';

// Export hooks
export * from './hooks';

// Module lifecycle hooks
const hooks = {
  async beforeInstall() {
    console.log('[Example Module] Before install');
  },

  async onInstall() {
    console.log('[Example Module] Installing...');
    // Initialize database tables, etc.
  },

  async afterInstall() {
    console.log('[Example Module] Installed successfully');
  },

  async beforeEnable() {
    console.log('[Example Module] Before enable');
  },

  async onEnable() {
    console.log('[Example Module] Enabling...');
    // Load services, initialize connections, etc.
  },

  async afterEnable() {
    console.log('[Example Module] Enabled successfully');
  },

  async beforeDisable() {
    console.log('[Example Module] Before disable');
  },

  async onDisable() {
    console.log('[Example Module] Disabling...');
    // Cleanup connections, stop services, etc.
  },

  async afterDisable() {
    console.log('[Example Module] Disabled successfully');
  },

  async beforeUninstall() {
    console.log('[Example Module] Before uninstall');
  },

  async onUninstall() {
    console.log('[Example Module] Uninstalling...');
    // Remove data, cleanup resources, etc.
  },

  async afterUninstall() {
    console.log('[Example Module] Uninstalled successfully');
  },

  async onLoad() {
    console.log('[Example Module] Loaded');
  },

  async onUnload() {
    console.log('[Example Module] Unloaded');
  },

  async onError(error: Error) {
    console.error('[Example Module] Error:', error);
  },
};

// Add hooks to manifest
const manifestWithHooks: ModuleManifest = {
  ...(manifest as any),
  hooks,
};

export default {
  manifest: manifestWithHooks,
  hooks,
};
