/**
 * Module System - Advanced modular architecture for School ERP
 * Inspired by Odoo's module system with modern React/TypeScript patterns
 */

// Core exports
export * from './types';
export { moduleRegistry, ModuleRegistry } from './ModuleRegistry';
export { ModuleLoader } from './ModuleLoader';
export { DependencyResolver } from './DependencyResolver';
export { ModuleValidator } from './ModuleValidator';
export { EventEmitter } from './EventEmitter';

// Template engine
export * from './TemplateEngine';
export { templateEngine } from './TemplateEngine';

// Marketplace
export { moduleMarketplace, ModuleMarketplace } from './ModuleMarketplace';

// React hooks
export { useModule, useModules, useModuleConfig } from './hooks';

// Module context
export { ModuleProvider, useModuleContext } from './ModuleContext';
