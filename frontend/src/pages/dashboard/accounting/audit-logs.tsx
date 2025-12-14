import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface AuditLog {
    id: number
    user_id: number
    action: string
    entity: string
    entity_id: number
    details: string
    created_at: string
}

export default function AuditLogsPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEntity, setSelectedEntity] = useState<string>('')
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (isHydrated && !user) {
            router.push('/auth/login')
        }
    }, [user, router, isHydrated])

    useEffect(() => {
        if (isHydrated && user) {
            fetchLogs()
        }
    }, [isHydrated, user, selectedEntity])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            let url = 'http://localhost:8009/api/v1/accounts/audit-logs?limit=100'
            if (selectedEntity) {
                url += `&entity=${selectedEntity}`
            }
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setLogs(data || [])
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatAction = (action: string) => {
        switch (action) {
            case 'CREATE':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">CREATE</span>
            case 'UPDATE':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">UPDATE</span>
            case 'DELETE (SOFT)':
            case 'DELETE (HARD)':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{action}</span>
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{action}</span>
        }
    }

    const formatDetails = (details: string) => {
        try {
            const parsed = JSON.parse(details)
            return (
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            )
        } catch (e) {
            return <p className="text-sm text-gray-600">{details}</p>
        }
    }

    if (!isHydrated || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar showBackButton={true} backLink="/dashboard/accounting/chart-of-accounts" />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 py-8 px-6">
                    <div className="w-full">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit Trail</h2>
                                <p className="text-gray-600">Track all changes and activities in the system</p>
                            </div>
                            <div className="flex gap-4">
                                <select
                                    value={selectedEntity}
                                    onChange={(e) => setSelectedEntity(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Entities</option>
                                    <option value="ACCOUNT">Accounts</option>
                                    <option value="TRANSACTION">Transactions</option>
                                </select>
                                <button
                                    onClick={fetchLogs}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500">Loading audit logs...</div>
                            ) : logs.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No audit logs found</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {formatAction(log.action)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                        {log.entity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.entity_id}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <button
                                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                        >
                                                            {expandedLogId === log.id ? 'Hide Details' : 'View Details'}
                                                        </button>
                                                        {expandedLogId === log.id && (
                                                            <div className="mt-2">
                                                                {formatDetails(log.details)}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
