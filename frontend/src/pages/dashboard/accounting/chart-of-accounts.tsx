import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import AccountModal from '@/components/accounting/AccountModal'
import AccountTree from '@/components/accounting/AccountTree'
import TemplateModal from '@/components/accounting/TemplateModal'

interface Account {
    id: number
    code: string
    name: string
    type: string
    parent_id?: number
    description: string
    balance: number
    opening_balance: number
    is_active: boolean
    level: number
    children?: Account[]
}

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']

export default function ChartOfAccountsPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    const [selectedType, setSelectedType] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showImportModal, setShowImportModal] = useState(false)
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)

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
            fetchAccounts()
        }
    }, [isHydrated, user])

    useEffect(() => {
        filterAccounts()
    }, [accounts, selectedType, searchQuery])

    const fetchAccounts = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost:8009/api/v1/accounts/tree?school_id=1')
            if (response.ok) {
                const data = await response.json()
                setAccounts(data || [])
            } else {
                console.error('Failed to fetch accounts')
            }
        } catch (error) {
            console.error('Error fetching accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterAccounts = () => {
        let filtered = accounts

        if (selectedType) {
            filtered = filterAccountsByType(filtered, selectedType)
        }

        if (searchQuery) {
            filtered = searchAccounts(filtered, searchQuery.toLowerCase())
        }

        setFilteredAccounts(filtered)
    }

    const filterAccountsByType = (accs: Account[], type: string): Account[] => {
        return accs
            .map(acc => {
                if (acc.type === type) {
                    return acc
                }
                if (acc.children && acc.children.length > 0) {
                    const filteredChildren = filterAccountsByType(acc.children, type)
                    if (filteredChildren.length > 0) {
                        return { ...acc, children: filteredChildren }
                    }
                }
                return null
            })
            .filter(acc => acc !== null) as Account[]
    }

    const searchAccounts = (accs: Account[], query: string): Account[] => {
        return accs
            .map(acc => {
                const matches = acc.code.toLowerCase().includes(query) || acc.name.toLowerCase().includes(query)
                if (matches) {
                    return acc
                }
                if (acc.children && acc.children.length > 0) {
                    const filteredChildren = searchAccounts(acc.children, query)
                    if (filteredChildren.length > 0) {
                        return { ...acc, children: filteredChildren }
                    }
                }
                return null
            })
            .filter(acc => acc !== null) as Account[]
    }

    const handleAddAccount = () => {
        setEditingAccount(null)
        setShowModal(true)
    }

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account)
        setShowModal(true)
    }

    const handleDeleteAccount = async (accountId: number) => {
        if (!confirm('Are you sure you want to delete this account?')) {
            return
        }

        try {
            const response = await fetch(`http://localhost:8009/api/v1/accounts/${accountId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchAccounts()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete account')
            }
        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Failed to delete account')
        }
    }

    const handleModalClose = (refresh?: boolean) => {
        setShowModal(false)
        setEditingAccount(null)
        if (refresh) {
            fetchAccounts()
        }
    }

    const getAccountTypeCount = (type: string) => {
        const countAccounts = (accs: Account[]): number => {
            return accs.reduce((count, acc) => {
                if (acc.type === type) {
                    count++
                }
                if (acc.children && acc.children.length > 0) {
                    count += countAccounts(acc.children)
                }
                return count
            }, 0)
        }
        return countAccounts(accounts)
    }

    const handleExport = () => {
        window.open('http://localhost:8009/api/v1/accounts/export?school_id=1', '_blank')
    }

    const handleImport = async () => {
        if (!importFile) {
            alert('Please select a file to import')
            return
        }

        setImporting(true)
        const formData = new FormData()
        formData.append('file', importFile)

        try {
            const response = await fetch('http://localhost:8009/api/v1/accounts/import', {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Import completed!\nImported: ${result.imported}\nTotal: ${result.total}\nErrors: ${result.errors.length}`)
                if (result.errors.length > 0) {
                    console.error('Import errors:', result.errors)
                }
                setShowImportModal(false)
                setImportFile(null)
                fetchAccounts()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to import accounts')
            }
        } catch (error) {
            console.error('Error importing accounts:', error)
            alert('Failed to import accounts')
        } finally {
            setImporting(false)
        }
    }

    if (!isHydrated || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar showBackButton={true} backLink="/dashboard/accounting" />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 py-8 px-6">
                    <div className="w-full">
                        {/* Header */}
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Chart of Accounts</h2>
                                <p className="text-gray-600">Manage your account hierarchy and financial structure</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExport}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <span className="text-xl">⬇️</span>
                                    Export
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <span className="text-xl">⬆️</span>
                                    Import
                                </button>
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                                    title="Load a standard chart of accounts"
                                >
                                    <span className="text-xl">📋</span>
                                    Templates
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard/accounting/account-analytics')}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <span className="text-xl">📊</span>
                                    Analytics
                                </button>
                                <button
                                    onClick={handleAddAccount}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <span className="text-xl">+</span>
                                    Add Account
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            {/* Sidebar Filters */}
                            <div className="w-64 flex-shrink-0">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-4">Account Types</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedType('')}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedType === ''
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>All Accounts</span>
                                                <span className="text-sm text-gray-500">{accounts.length}</span>
                                            </div>
                                        </button>
                                        {ACCOUNT_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedType(type)}
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedType === type
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{type}</span>
                                                    <span className="text-sm text-gray-500">{getAccountTypeCount(type)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1">
                                {/* Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search accounts by code or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Accounts Tree */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    {loading ? (
                                        <div className="p-8 text-center text-gray-500">Loading accounts...</div>
                                    ) : filteredAccounts.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <p className="text-lg mb-2">No accounts found</p>
                                            <div className="flex justify-center gap-3 mt-4">
                                                <button
                                                    onClick={() => setShowTemplateModal(true)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    Load a Template
                                                </button>
                                                <span className="text-gray-400">|</span>
                                                <button
                                                    onClick={handleAddAccount}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Create Manually
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4">
                                            <AccountTree
                                                accounts={filteredAccounts}
                                                onEdit={handleEditAccount}
                                                onDelete={handleDeleteAccount}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Account Modal */}
            {showModal && (
                <AccountModal
                    account={editingAccount}
                    accounts={accounts}
                    onClose={handleModalClose}
                />
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <TemplateModal
                    onClose={(refresh) => {
                        setShowTemplateModal(false)
                        if (refresh) fetchAccounts()
                    }}
                />
            )}

            {/* Import Modal */}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Import Accounts</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Upload a CSV file to bulk import accounts. The CSV should have the following headers:
                            Code, Name, Type, Parent Code, Description, Opening Balance, Active
                        </p>

                        <div className="mb-4">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowImportModal(false)
                                    setImportFile(null)
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                disabled={importing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!importFile || importing}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                    ${(!importFile || importing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {importing ? 'Importing...' : 'Upload & Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
