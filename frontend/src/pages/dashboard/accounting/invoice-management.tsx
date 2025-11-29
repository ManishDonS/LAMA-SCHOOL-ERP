import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  studentName: string
  studentId: string
  class: string
  parentName: string
  parentEmail: string
  parentPhone: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  issueDate: string
  dueDate: string
  paidDate?: string
  notes?: string
  createdBy: string
  createdAt: string
}

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    studentName: 'John Doe',
    studentId: 'STU001',
    class: '10A',
    parentName: 'Robert Doe',
    parentEmail: 'robert.doe@email.com',
    parentPhone: '+1234567890',
    items: [
      { description: 'Tuition Fee - November 2024', quantity: 1, unitPrice: 5000, amount: 5000 },
      { description: 'Lab Fee', quantity: 1, unitPrice: 500, amount: 500 },
    ],
    subtotal: 5500,
    tax: 0,
    discount: 0,
    total: 5500,
    status: 'Paid',
    issueDate: '2024-11-01',
    dueDate: '2024-11-15',
    paidDate: '2024-11-10',
    notes: 'Payment received via bank transfer',
    createdBy: 'Admin',
    createdAt: '2024-11-01T10:00:00',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    studentName: 'Jane Smith',
    studentId: 'STU002',
    class: '9B',
    parentName: 'Mary Smith',
    parentEmail: 'mary.smith@email.com',
    parentPhone: '+1234567891',
    items: [
      { description: 'Tuition Fee - November 2024', quantity: 1, unitPrice: 5000, amount: 5000 },
    ],
    subtotal: 5000,
    tax: 0,
    discount: 500,
    total: 4500,
    status: 'Sent',
    issueDate: '2024-11-01',
    dueDate: '2024-11-20',
    notes: 'Early bird discount applied',
    createdBy: 'Admin',
    createdAt: '2024-11-01T11:00:00',
  },
]

export default function InvoiceManagementPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>(DEFAULT_INVOICES)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('All')

  // Form state for creating invoice
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    class: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
    discount: 0,
    tax: 0,
    notes: '',
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ])

  useEffect(() => {
    setIsHydrated(true)
    // Load invoices from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoices')
      if (saved) {
        try {
          setInvoices(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load invoices:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  // Save to localStorage whenever invoices change
  useEffect(() => {
    if (isHydrated && invoices.length > 0) {
      localStorage.setItem('invoices', JSON.stringify(invoices))
    }
  }, [invoices, isHydrated])

  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxAmount = (subtotal * formData.tax) / 100
    return subtotal + taxAmount - formData.discount
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate amount if quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = calculateItemAmount(
        Number(newItems[index].quantity),
        Number(newItems[index].unitPrice)
      )
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleCreateInvoice = () => {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      ...formData,
      items,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      status: 'Draft',
      createdBy: `${user?.firstName} ${user?.lastName}`,
      createdAt: new Date().toISOString(),
    }

    setInvoices([newInvoice, ...invoices])
    setShowCreateModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      studentName: '',
      studentId: '',
      class: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: 0,
      tax: 0,
      notes: '',
    })
    setItems([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }])
  }

  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId
        ? { ...inv, status: newStatus, ...(newStatus === 'Paid' ? { paidDate: new Date().toISOString().split('T')[0] } : {}) }
        : inv
    ))
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(inv => inv.id !== invoiceId))
    }
  }

  const filteredInvoices = filterStatus === 'All'
    ? invoices
    : invoices.filter(inv => inv.status === filterStatus)

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      case 'Cancelled': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link href="/dashboard/accounting" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Back to Accounting
            </Link>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Invoice Management</h2>
              <p className="text-gray-600 mt-1">Create and manage invoices for students and parents</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
            >
              <span>+</span>
              <span>Create Invoice</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {invoices.filter(inv => inv.status === 'Paid').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {invoices.filter(inv => inv.status === 'Sent').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {invoices.filter(inv => inv.status === 'Overdue').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Invoices</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No invoices found. Create your first invoice to get started.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{invoice.studentName}</div>
                        <div className="text-xs text-gray-500">{invoice.class}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{invoice.parentName}</div>
                        <div className="text-xs text-gray-500">{invoice.parentEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{invoice.total.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleStatusChange(invoice.id, e.target.value as Invoice['status'])}
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)} border-0`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.issueDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowViewModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Create New Invoice</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Student & Parent Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Email *</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone *</label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900">Invoice Items</h4>
                  <button
                    onClick={addItem}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={item.amount}
                          disabled
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="w-full px-2 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates and Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Invoice Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Tax (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.tax}
                        onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Discount (₹):</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="border-t border-gray-300 pt-3 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedInvoice(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Invoice Header */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                    <p className="text-gray-600">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </div>
                </div>
              </div>

              {/* Student & Parent Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                  <p className="text-gray-900 font-medium">{selectedInvoice.parentName}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.parentEmail}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.parentPhone}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Student:</h4>
                  <p className="text-gray-900 font-medium">{selectedInvoice.studentName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedInvoice.studentId}</p>
                  <p className="text-sm text-gray-600">Class: {selectedInvoice.class}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-600">Issue Date:</p>
                  <p className="font-medium">{selectedInvoice.issueDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Due Date:</p>
                  <p className="font-medium">{selectedInvoice.dueDate}</p>
                </div>
                {selectedInvoice.paidDate && (
                  <div>
                    <p className="text-gray-600">Paid Date:</p>
                    <p className="font-medium text-green-600">{selectedInvoice.paidDate}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">₹{item.unitPrice}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">₹{((selectedInvoice.subtotal * selectedInvoice.tax) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium">-₹{selectedInvoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                <p>Created by: {selectedInvoice.createdBy} on {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedInvoice(null)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
