/**
 * Example Page Component
 */

import React, { useState, useEffect } from 'react';
import { useModuleConfig } from '../../../core/modules/hooks';

export const ExamplePage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [enableNotifications, setEnableNotifications] = useModuleConfig<boolean>(
    'example-module',
    'enable_notifications'
  );

  useEffect(() => {
    // Load data
    setData([
      { id: '1', name: 'Example 1', status: 'active' },
      { id: '2', name: 'Example 2', status: 'inactive' },
    ]);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Example Module</h1>
        <p className="mt-2 text-gray-600">
          This is an example page demonstrating the module system
        </p>
      </div>

      {/* Settings */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Module Settings</h2>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="notifications"
            checked={enableNotifications || false}
            onChange={(e) => setEnableNotifications(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="notifications" className="text-sm text-gray-700">
            Enable Notifications
          </label>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Example Data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
