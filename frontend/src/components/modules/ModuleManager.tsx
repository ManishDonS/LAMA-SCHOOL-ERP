/**
 * Module Manager - Advanced UI for managing modules
 */

import React, { useState, useEffect, useMemo } from 'react';
import { moduleRegistry } from '../../core/modules/ModuleRegistry';
import {
  ModuleInstance,
  ModuleState,
  ModuleEvent,
  ModuleCategory,
  ModuleFilter,
} from '../../core/modules/types';
import {
  Search,
  Download,
  Trash2,
  Power,
  PowerOff,
  Settings,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Filter,
  Grid,
  List,
  ChevronDown,
  ExternalLink,
  Info,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

export const ModuleManager: React.FC = () => {
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedModule, setSelectedModule] = useState<ModuleInstance | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ModuleFilter>({});

  // Load modules
  useEffect(() => {
    loadModules();

    // Listen to module events
    const handleModuleEvent = () => {
      loadModules();
    };

    moduleRegistry.on(ModuleEvent.INSTALLED, handleModuleEvent);
    moduleRegistry.on(ModuleEvent.UNINSTALLED, handleModuleEvent);
    moduleRegistry.on(ModuleEvent.ENABLED, handleModuleEvent);
    moduleRegistry.on(ModuleEvent.DISABLED, handleModuleEvent);
    moduleRegistry.on(ModuleEvent.UPGRADED, handleModuleEvent);

    return () => {
      moduleRegistry.off(ModuleEvent.INSTALLED, handleModuleEvent);
      moduleRegistry.off(ModuleEvent.UNINSTALLED, handleModuleEvent);
      moduleRegistry.off(ModuleEvent.ENABLED, handleModuleEvent);
      moduleRegistry.off(ModuleEvent.DISABLED, handleModuleEvent);
      moduleRegistry.off(ModuleEvent.UPGRADED, handleModuleEvent);
    };
  }, []);

  const loadModules = () => {
    const allModules = moduleRegistry.getModules({
      ...filters,
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    });
    setModules(allModules);
  };

  // Filter modules
  useEffect(() => {
    loadModules();
  }, [searchQuery, selectedCategory, filters]);

  // Categorized modules
  const modulesByCategory = useMemo(() => {
    const grouped = new Map<ModuleCategory, ModuleInstance[]>();

    for (const module of modules) {
      const category = module.manifest.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(module);
    }

    return grouped;
  }, [modules]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: modules.length,
      installed: modules.filter((m) => m.state !== ModuleState.UNINSTALLED).length,
      enabled: modules.filter((m) => m.state === ModuleState.ENABLED).length,
      disabled: modules.filter((m) => m.state === ModuleState.DISABLED).length,
      error: modules.filter((m) => m.state === ModuleState.ERROR).length,
    };
  }, [modules]);

  // Actions
  const handleInstall = async (moduleId: string) => {
    setLoading(true);
    try {
      await moduleRegistry.install(moduleId);
    } catch (error) {
      console.error('Failed to install module:', error);
      alert(`Failed to install module: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (moduleId: string) => {
    if (!confirm('Are you sure you want to uninstall this module?')) {
      return;
    }

    setLoading(true);
    try {
      await moduleRegistry.uninstall(moduleId);
    } catch (error) {
      console.error('Failed to uninstall module:', error);
      alert(`Failed to uninstall module: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (moduleId: string) => {
    setLoading(true);
    try {
      await moduleRegistry.enable(moduleId);
    } catch (error) {
      console.error('Failed to enable module:', error);
      alert(`Failed to enable module: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (moduleId: string) => {
    setLoading(true);
    try {
      await moduleRegistry.disable(moduleId);
    } catch (error) {
      console.error('Failed to disable module:', error);
      alert(`Failed to disable module: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Module Manager</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and configure system modules
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadModules()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-5 gap-4">
            <StatCard
              label="Total Modules"
              value={stats.total}
              icon={<Package size={20} />}
              color="blue"
            />
            <StatCard
              label="Installed"
              value={stats.installed}
              icon={<CheckCircle size={20} />}
              color="green"
            />
            <StatCard
              label="Enabled"
              value={stats.enabled}
              icon={<Power size={20} />}
              color="emerald"
            />
            <StatCard
              label="Disabled"
              value={stats.disabled}
              icon={<PowerOff size={20} />}
              color="gray"
            />
            <StatCard
              label="Errors"
              value={stats.error}
              icon={<AlertCircle size={20} />}
              color="red"
            />
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="administrative">Administrative</option>
              <option value="communication">Communication</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="reporting">Reporting</option>
              <option value="system">System</option>
              <option value="integration">Integration</option>
              <option value="custom">Custom</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={16} />
              Filters
              <ChevronDown size={16} />
            </button>

            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        state: e.target.value ? (e.target.value as ModuleState) : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All</option>
                    <option value={ModuleState.ENABLED}>Enabled</option>
                    <option value={ModuleState.DISABLED}>Disabled</option>
                    <option value={ModuleState.INSTALLED}>Installed</option>
                    <option value={ModuleState.ERROR}>Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installed
                  </label>
                  <select
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        installed: e.target.value ? e.target.value === 'true' : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin" size={32} />
          </div>
        )}

        {!loading && modules.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No modules found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {!loading && modules.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.manifest.id}
                    module={module}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onEnable={handleEnable}
                    onDisable={handleDisable}
                    onSelect={setSelectedModule}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((module) => (
                  <ModuleListItem
                    key={module.manifest.id}
                    module={module}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onEnable={handleEnable}
                    onDisable={handleDisable}
                    onSelect={setSelectedModule}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <ModuleDetailModal module={selectedModule} onClose={() => setSelectedModule(null)} />
      )}
    </div>
  );
};

// Supporting Components
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ModuleCardProps {
  module: ModuleInstance;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onSelect: (module: ModuleInstance) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onInstall,
  onUninstall,
  onEnable,
  onDisable,
  onSelect,
}) => {
  const { manifest, state } = module;

  const stateConfig = {
    [ModuleState.ENABLED]: { color: 'green', label: 'Enabled', icon: <CheckCircle size={16} /> },
    [ModuleState.DISABLED]: { color: 'gray', label: 'Disabled', icon: <PowerOff size={16} /> },
    [ModuleState.INSTALLED]: { color: 'blue', label: 'Installed', icon: <Package size={16} /> },
    [ModuleState.UNINSTALLED]: { color: 'gray', label: 'Not Installed', icon: <Package size={16} /> },
    [ModuleState.ERROR]: { color: 'red', label: 'Error', icon: <XCircle size={16} /> },
    [ModuleState.INSTALLING]: { color: 'blue', label: 'Installing...', icon: <Loader size={16} /> },
    [ModuleState.ENABLING]: { color: 'blue', label: 'Enabling...', icon: <Loader size={16} /> },
    [ModuleState.DISABLING]: { color: 'gray', label: 'Disabling...', icon: <Loader size={16} /> },
    [ModuleState.UNINSTALLING]: { color: 'red', label: 'Uninstalling...', icon: <Loader size={16} /> },
    [ModuleState.UPGRADING]: { color: 'blue', label: 'Upgrading...', icon: <Loader size={16} /> },
  };

  const config = stateConfig[state];

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {manifest.icon ? (
              <img src={manifest.icon} alt="" className="w-12 h-12 rounded" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xl">
                {manifest.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{manifest.name}</h3>
              <p className="text-sm text-gray-500">v{manifest.version}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}
          >
            {config.icon}
            {config.label}
          </span>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-gray-600 line-clamp-2">{manifest.description}</p>

        {/* Tags */}
        {manifest.tags && manifest.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {manifest.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {manifest.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{manifest.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {state === ModuleState.UNINSTALLED && (
            <button
              onClick={() => onInstall(manifest.id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Install
            </button>
          )}

          {state === ModuleState.INSTALLED && (
            <>
              <button
                onClick={() => onEnable(manifest.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Power size={16} />
                Enable
              </button>
              <button
                onClick={() => onUninstall(manifest.id)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {state === ModuleState.DISABLED && (
            <>
              <button
                onClick={() => onEnable(manifest.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Power size={16} />
                Enable
              </button>
              <button
                onClick={() => onUninstall(manifest.id)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {state === ModuleState.ENABLED && (
            <>
              <button
                onClick={() => onDisable(manifest.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <PowerOff size={16} />
                Disable
              </button>
              <button
                onClick={() => onSelect(module)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings size={16} />
              </button>
            </>
          )}

          <button
            onClick={() => onSelect(module)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Placeholder for ModuleListItem
const ModuleListItem: React.FC<ModuleCardProps> = (props) => {
  return <div className="bg-white p-4 rounded-lg border">List view coming soon...</div>;
};

// Placeholder for ModuleDetailModal
const ModuleDetailModal: React.FC<{ module: ModuleInstance; onClose: () => void }> = ({
  module,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{module.manifest.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="text-gray-600">{module.manifest.description}</p>
            </div>
            {/* Add more details here */}
          </div>
        </div>
      </div>
    </div>
  );
};
