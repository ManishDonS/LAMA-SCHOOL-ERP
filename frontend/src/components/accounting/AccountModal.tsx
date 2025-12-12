import { useState, useEffect } from 'react'

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

interface AccountModalProps {
    account: Account | null
    accounts: Account[]
    onClose: (refresh?: boolean) => void
}

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']

export default function AccountModal({ account, accounts, onClose }: AccountModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'Asset',
        parent_id: '',
        description: '',
        opening_balance: '0',
        is_active: true,
        budget: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (account) {
            setFormData({
                code: account.code,
                name: account.name,
                type: account.type,
                parent_id: account.parent_id?.toString() || '',
                description: account.description,
                opening_balance: account.opening_balance.toString(),
                is_active: account.is_active,
                budget: '',
            })
            // Fetch existing budget
            fetch(`http://localhost:8009/api/v1/accounts/${account.id}/budgets`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        // Get current year budget or most recent
                        const currentYear = new Date().getFullYear()
                        const budget = data.find((b: any) => b.fiscal_year === currentYear) || data[0]
                        setFormData(prev => ({ ...prev, budget: budget.amount.toString() }))
                    }
                })
                .catch(err => console.error('Error fetching budget:', err))
        }
    }, [account])

    const flattenAccounts = (accs: Account[]): Account[] => {
        const result: Account[] = []
        const flatten = (items: Account[]) => {
            items.forEach(item => {
                result.push(item)
                if (item.children && item.children.length > 0) {
                    flatten(item.children)
                }
            })
        }
        flatten(accs)
        return result
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const payload = {
                code: formData.code,
                name: formData.name,
                type: formData.type,
                parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
                description: formData.description,
                opening_balance: parseFloat(formData.opening_balance),
                is_active: formData.is_active,
                school_id: 1,
            }

            const url = account
                ? `http://localhost:8009/api/v1/accounts/${account.id}`
                : 'http://localhost:8009/api/v1/accounts'

            const method = account ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                const savedAccount = await response.json()
                const accountId = account ? account.id : savedAccount.id

                // Save budget if provided
                if (formData.budget) {
                    await fetch(`http://localhost:8009/api/v1/accounts/${accountId}/budget`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            amount: parseFloat(formData.budget),
                            fiscal_year: new Date().getFullYear(),
                            notes: 'Set via Account Modal'
                        }),
                    })
                }

                onClose(true)
            } else {
                const errorData = await response.json()
                setError(errorData.error || 'Failed to save account')
            }
        } catch (err) {
            setError('An error occurred while saving the account')
            console.error('Error saving account:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))
    }

    const flatAccounts = flattenAccounts(accounts).filter(acc => acc.id !== account?.id)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {account ? 'Edit Account' : 'Add New Account'}
                    </h2>
                    <button
                        onClick={() => onClose()}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Account Code */}
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                            Account Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="e.g., 1000"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Account Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Cash"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Account Type */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            Account Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ACCOUNT_TYPES.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Parent Account */}
                    <div>
                        <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Parent Account
                        </label>
                        <select
                            id="parent_id"
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">None (Root Account)</option>
                            {flatAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Optional description"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Opening Balance */}
                    {!account && (
                        <div>
                            <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Balance
                            </label>
                            <input
                                type="number"
                                id="opening_balance"
                                name="opening_balance"
                                value={formData.opening_balance}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Budget */}
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                            Annual Budget (Current Year)
                        </label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : account ? 'Update Account' : 'Save Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
