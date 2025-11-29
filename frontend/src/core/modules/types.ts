/**
 * Advanced Module System Types
 * Inspired by Odoo's architecture with modern TypeScript patterns
 */

import { ReactNode, ComponentType } from 'react';

/**
 * Module Manifest - Defines all module metadata and configuration
 */
export interface ModuleManifest {
  // Basic Information
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  icon?: string;
  category: ModuleCategory;

  // Dependencies
  dependencies?: ModuleDependency[];
  optionalDependencies?: string[];
  conflicts?: string[];

  // Lifecycle
  autoInstall?: boolean;
  autoEnable?: boolean;
  installable?: boolean;
  uninstallable?: boolean;

  // Features
  features?: ModuleFeature[];
  permissions?: ModulePermission[];
  routes?: ModuleRoute[];
  menus?: ModuleMenu[];
  widgets?: ModuleWidget[];
  models?: ModuleModel[];
  views?: ModuleView[];
  templates?: ModuleTemplate[];
  assets?: ModuleAssets;

  // Hooks
  hooks?: ModuleHooks;

  // Configuration
  config?: Record<string, any>;
  settings?: ModuleSetting[];

  // Metadata
  tags?: string[];
  keywords?: string[];
  repository?: string;
  homepage?: string;
  bugs?: string;
  documentation?: string;
  screenshots?: string[];

  // Advanced
  extends?: string; // Module ID to extend
  inherits?: string[]; // Module IDs to inherit from
  priority?: number; // Load priority (higher = earlier)
  sandboxed?: boolean; // Run in isolated context
  lazy?: boolean; // Lazy load the module
}

export interface ModuleDependency {
  id: string;
  version?: string; // Semver range
  required?: boolean;
  reason?: string;
}

export type ModuleCategory =
  | 'academic'
  | 'administrative'
  | 'communication'
  | 'finance'
  | 'hr'
  | 'reporting'
  | 'system'
  | 'integration'
  | 'custom';

export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  configurable?: boolean;
}

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  default?: boolean; // Default granted to all users
}

/**
 * Module Route Configuration
 */
export interface ModuleRoute {
  path: string;
  component: string | ComponentType;
  exact?: boolean;
  layout?: string;
  auth?: boolean;
  permissions?: string[];
  meta?: {
    title?: string;
    description?: string;
    icon?: string;
  };
}

/**
 * Module Menu Configuration
 */
export interface ModuleMenu {
  id: string;
  name: string;
  icon?: string;
  path?: string;
  parent?: string; // Parent menu ID
  order?: number;
  permissions?: string[];
  badge?: string | (() => Promise<string | number>);
  children?: ModuleMenu[];
  action?: () => void;
}

/**
 * Module Widget Configuration
 */
export interface ModuleWidget {
  id: string;
  name: string;
  component: ComponentType<any>;
  category: string;
  configurable?: boolean;
  defaultConfig?: Record<string, any>;
  previewImage?: string;
}

/**
 * Module Model (Data Model)
 */
export interface ModuleModel {
  name: string;
  tableName?: string;
  fields: ModelField[];
  relations?: ModelRelation[];
  methods?: Record<string, Function>;
  hooks?: ModelHooks;
  inherits?: string; // Inherit from another model
  extends?: string; // Extend another model
}

export interface ModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'relation' | 'file' | 'computed';
  required?: boolean;
  unique?: boolean;
  default?: any;
  validation?: (value: any) => boolean | string;
  computed?: (record: any) => any;
  stored?: boolean; // For computed fields
  searchable?: boolean;
  sortable?: boolean;
}

export interface ModelRelation {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  model: string;
  field?: string;
  foreignKey?: string;
  through?: string; // For many-to-many
}

export interface ModelHooks {
  beforeCreate?: (data: any) => Promise<any>;
  afterCreate?: (record: any) => Promise<void>;
  beforeUpdate?: (id: string, data: any) => Promise<any>;
  afterUpdate?: (record: any) => Promise<void>;
  beforeDelete?: (id: string) => Promise<void>;
  afterDelete?: (id: string) => Promise<void>;
}

/**
 * Module View Configuration
 */
export interface ModuleView {
  id: string;
  name: string;
  model: string;
  type: 'list' | 'form' | 'kanban' | 'calendar' | 'graph' | 'pivot' | 'custom';
  template?: string;
  component?: ComponentType<any>;
  fields?: string[];
  filters?: ViewFilter[];
  actions?: ViewAction[];
  inherits?: string; // Inherit from another view
}

export interface ViewFilter {
  id: string;
  name: string;
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between';
  value?: any;
  default?: boolean;
}

export interface ViewAction {
  id: string;
  name: string;
  icon?: string;
  type: 'button' | 'menu' | 'bulk';
  handler: (selected: any[]) => Promise<void>;
  permissions?: string[];
  condition?: (selected: any[]) => boolean;
}

/**
 * Module Template System
 */
export interface ModuleTemplate {
  id: string;
  name: string;
  path: string;
  type: 'component' | 'page' | 'layout' | 'email' | 'pdf' | 'report';
  extends?: string; // Template to extend
  slots?: TemplateSlot[];
  props?: Record<string, any>;
}

export interface TemplateSlot {
  name: string;
  required?: boolean;
  default?: ReactNode;
  validation?: (content: ReactNode) => boolean;
}

/**
 * Module Assets
 */
export interface ModuleAssets {
  styles?: string[];
  scripts?: string[];
  fonts?: string[];
  images?: Record<string, string>;
  icons?: Record<string, string>;
}

/**
 * Module Settings
 */
export interface ModuleSetting {
  key: string;
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'color' | 'file';
  default?: any;
  options?: { label: string; value: any }[];
  validation?: (value: any) => boolean | string;
  group?: string;
  order?: number;
  required?: boolean;
}

/**
 * Module Lifecycle Hooks
 */
export interface ModuleHooks {
  // Installation
  beforeInstall?: () => Promise<void>;
  onInstall?: () => Promise<void>;
  afterInstall?: () => Promise<void>;

  // Enabling/Disabling
  beforeEnable?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  afterEnable?: () => Promise<void>;
  beforeDisable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  afterDisable?: () => Promise<void>;

  // Uninstallation
  beforeUninstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  afterUninstall?: () => Promise<void>;

  // Upgrade
  beforeUpgrade?: (fromVersion: string, toVersion: string) => Promise<void>;
  onUpgrade?: (fromVersion: string, toVersion: string) => Promise<void>;
  afterUpgrade?: (fromVersion: string, toVersion: string) => Promise<void>;

  // Runtime
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;

  // Custom hooks
  [key: string]: ((...args: any[]) => Promise<any>) | undefined;
}

/**
 * Module State
 */
export enum ModuleState {
  UNINSTALLED = 'uninstalled',
  INSTALLING = 'installing',
  INSTALLED = 'installed',
  ENABLING = 'enabling',
  ENABLED = 'enabled',
  DISABLING = 'disabling',
  DISABLED = 'disabled',
  UNINSTALLING = 'uninstalling',
  ERROR = 'error',
  UPGRADING = 'upgrading',
}

/**
 * Module Instance
 */
export interface ModuleInstance {
  manifest: ModuleManifest;
  state: ModuleState;
  installedVersion?: string;
  enabledAt?: Date;
  installedAt?: Date;
  lastError?: string;
  config: Record<string, any>;
  context?: Record<string, any>; // Module-specific context
  exports?: Record<string, any>; // Exported functionality
}

/**
 * Module Registry Entry
 */
export interface ModuleRegistryEntry {
  manifest: ModuleManifest;
  instance?: ModuleInstance;
  loader?: () => Promise<any>;
  source: 'local' | 'marketplace' | 'custom';
}

/**
 * Module Events
 */
export enum ModuleEvent {
  INSTALLED = 'module:installed',
  UNINSTALLED = 'module:uninstalled',
  ENABLED = 'module:enabled',
  DISABLED = 'module:disabled',
  UPGRADED = 'module:upgraded',
  ERROR = 'module:error',
  CONFIG_CHANGED = 'module:config-changed',
}

export interface ModuleEventPayload {
  moduleId: string;
  event: ModuleEvent;
  data?: any;
  timestamp: Date;
}

/**
 * Module API
 */
export interface ModuleAPI {
  // Registry Management
  register: (manifest: ModuleManifest, loader?: () => Promise<any>) => Promise<void>;
  unregister: (moduleId: string) => Promise<void>;

  // Lifecycle
  install: (moduleId: string) => Promise<void>;
  uninstall: (moduleId: string) => Promise<void>;
  enable: (moduleId: string) => Promise<void>;
  disable: (moduleId: string) => Promise<void>;
  upgrade: (moduleId: string, version: string) => Promise<void>;

  // Query
  getModule: (moduleId: string) => ModuleInstance | undefined;
  getModules: (filter?: ModuleFilter) => ModuleInstance[];
  isInstalled: (moduleId: string) => boolean;
  isEnabled: (moduleId: string) => boolean;

  // Configuration
  getConfig: (moduleId: string, key?: string) => any;
  setConfig: (moduleId: string, key: string, value: any) => Promise<void>;

  // Events
  on: (event: ModuleEvent, handler: (payload: ModuleEventPayload) => void) => void;
  off: (event: ModuleEvent, handler: (payload: ModuleEventPayload) => void) => void;
  emit: (event: ModuleEvent, payload: ModuleEventPayload) => void;

  // Extension Points
  extendModel: (modelName: string, extension: Partial<ModuleModel>) => void;
  extendView: (viewId: string, extension: Partial<ModuleView>) => void;
  extendMenu: (menuId: string, extension: Partial<ModuleMenu>) => void;

  // Hooks
  registerHook: (hookName: string, handler: (...args: any[]) => Promise<any>) => void;
  executeHook: (hookName: string, ...args: any[]) => Promise<any[]>;
}

export interface ModuleFilter {
  state?: ModuleState | ModuleState[];
  category?: ModuleCategory | ModuleCategory[];
  tags?: string[];
  search?: string;
  enabled?: boolean;
  installed?: boolean;
}

/**
 * Module Marketplace
 */
export interface MarketplaceModule {
  manifest: ModuleManifest;
  downloads: number;
  rating: number;
  reviews: number;
  publishedAt: Date;
  updatedAt: Date;
  verified: boolean;
  price?: number; // 0 for free
  downloadUrl: string;
}

export interface MarketplaceFilter {
  category?: ModuleCategory;
  tags?: string[];
  search?: string;
  priceMin?: number;
  priceMax?: number;
  verified?: boolean;
  sortBy?: 'downloads' | 'rating' | 'recent' | 'name';
}
