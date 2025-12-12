import { useState } from 'react'

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

interface AccountTreeProps {
    accounts: Account[]
    onEdit: (account: Account) => void
    onDelete: (accountId: number) => void
    level?: number
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
    Asset: 'bg-green-100 text-green-800',
    Liability: 'bg-red-100 text-red-800',
    Equity: 'bg-blue-100 text-blue-800',
    Revenue: 'bg-purple-100 text-purple-800',
    Expense: 'bg-orange-100 text-orange-800',
}

export default function AccountTree({ accounts, onEdit, onDelete, level = 0 }: AccountTreeProps) {
    const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set())

    const toggleExpand = (accountId: number) => {
        const newExpanded = new Set(expandedAccounts)
        if (newExpanded.has(accountId)) {
            newExpanded.delete(accountId)
        } else {
            newExpanded.add(accountId)
        }
        setExpandedAccounts(newExpanded)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount)
    }

    return (
        <div className="space-y-1">
            {accounts.map((account) => {
                const hasChildren = account.children && account.children.length > 0
                const isExpanded = expandedAccounts.has(account.id)

                return (
                    <div key={account.id}>
                        <div
                            className="group flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                            style={{ paddingLeft: `${level * 24 + 12}px` }}
                        >
                            {/* Expand/Collapse Button */}
                            <button
                                onClick={() => hasChildren && toggleExpand(account.id)}
                                className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${hasChildren ? 'text-gray-600 hover:text-gray-900' : 'text-transparent'
                                    }`}
                            >
                                {hasChildren && (
                                    <span className="text-sm">
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                )}
                            </button>

                            {/* Account Code */}
                            <div className="flex-shrink-0 w-24">
                                <code className="text-sm font-mono text-gray-700">{account.code}</code>
                            </div>

                            {/* Account Name */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">{account.name}</span>
                                    {!account.is_active && (
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Account Type Badge */}
                            <div className="flex-shrink-0">
                                <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${ACCOUNT_TYPE_COLORS[account.type] || 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    {account.type}
                                </span>
                            </div>

                            {/* Balance */}
                            <div className="flex-shrink-0 w-32 text-right">
                                <span className={`font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(account.balance)}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(account)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit account"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onDelete(account.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete account"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Render Children */}
                        {hasChildren && isExpanded && (
                            <AccountTree
                                accounts={account.children!}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                level={level + 1}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
