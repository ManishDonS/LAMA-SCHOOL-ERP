import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { libraryAPI, studentAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  total_copies: number
  available_copies: number
  qr_code: string
  publication_year: number
  description: string
}

interface BookIssue {
  id: string
  book_id: string
  student_id: string
  issue_date: string
  due_date: string
  return_date?: string
  status: 'Issued' | 'Returned' | 'Overdue'
  fine: number
}

interface BookBooking {
  id: string
  book_id: string
  student_id: string
  booking_date: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Pending' | 'Approved' | 'Issued' | 'Cancelled'
}

interface Student {
  id: string
  first_name: string
  last_name: string
  roll_number: string
}

interface FormData {
  title: string
  author: string
  isbn: string
  category: string
  total_copies: number
  qr_code: string
  publication_year: number
  description: string
}

const CATEGORIES = [
  'Mathematics',
  'Science',
  'English Literature',
  'History',
  'Geography',
  'Computer Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Reference',
  'General Knowledge',
  'Fiction',
  'Non-Fiction',
]

const DEFAULT_FORM_STATE: FormData = {
  title: '',
  author: '',
  isbn: '',
  category: 'Reference',
  total_copies: 1,
  qr_code: '',
  publication_year: new Date().getFullYear(),
  description: '',
}

export default function LibraryPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [bookIssues, setBookIssues] = useState<BookIssue[]>([])
  const [bookBookings, setBookBookings] = useState<BookBooking[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'books' | 'issues' | 'bookings' | 'history'>('books')
  const [showModal, setShowModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)
  const [searchTerm, setSearchTerm] = useState('')

  // Selection states for Issue/Booking
  const [selectedBookId, setSelectedBookId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [dueDate, setDueDate] = useState('')

  const fetchBooks = useCallback(async (search = '') => {
    try {
      const res = await libraryAPI.listBooks({ search })
      setBooks(res.data || [])
    } catch (error) {
      console.error('Failed to fetch books:', error)
      toast.error('Failed to load books')
    }
  }, [])

  const fetchIssues = useCallback(async () => {
    try {
      const res = await libraryAPI.listIssues()
      setBookIssues(res.data || [])
    } catch (error) {
      console.error('Failed to fetch issues:', error)
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    try {
      const res = await libraryAPI.listBookings()
      setBookBookings(res.data || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await studentAPI.list()
      // Backend returns { message: "...", students: [...] }
      if (res.data && res.data.students) {
        setStudents(res.data.students.map((s: any) => ({
          ...s,
          id: String(s.id)
        })))
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchBooks(), fetchIssues(), fetchBookings(), fetchStudents()])
      setLoading(false)
    }
    init()
  }, [fetchBooks, fetchIssues, fetchBookings, fetchStudents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBooks(searchTerm)
  }

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await libraryAPI.updateBook(editingBook.id, formData)
        toast.success('Book updated successfully')
      } else {
        await libraryAPI.createBook(formData)
        toast.success('Book added successfully')
      }
      setShowModal(false)
      fetchBooks()
    } catch (error) {
      toast.error('Failed to save book')
    }
  }

  const handleDeleteBook = async (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await libraryAPI.deleteBook(id)
        toast.success('Book deleted')
        fetchBooks()
      } catch (error) {
        toast.error('Failed to delete book')
      }
    }
  }

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await libraryAPI.issueBook({
        book_id: selectedBookId,
        student_id: selectedStudentId,
        due_date: dueDate
      })
      toast.success('Book issued successfully')
      setShowIssueModal(false)
      fetchIssues()
      fetchBooks()
    } catch (error) {
      toast.error('Failed to issue book')
    }
  }

  const handleReturnBook = async (id: string) => {
    try {
      await libraryAPI.returnBook(id)
      toast.success('Book returned')
      fetchIssues()
      fetchBooks()
    } catch (error) {
      toast.error('Failed to return book')
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await libraryAPI.createBooking({
        book_id: selectedBookId,
        student_id: selectedStudentId,
        priority: 'Medium'
      })
      toast.success('Booking created')
      setShowBookingModal(false)
      fetchBookings()
    } catch (error) {
      toast.error('Failed to create booking')
    }
  }

  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id)
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'
  }

  const getBookTitle = (id: string) => {
    const book = books.find(b => b.id === id)
    return book ? book.title : 'Unknown Book'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Issued': return 'bg-blue-100 text-blue-800'
      case 'Returned': return 'bg-green-100 text-green-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Library Management</h2>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6 p-1 flex space-x-1">
              {['books', 'issues', 'bookings', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 capitalize ${activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {tab === 'books' && '📚 '}
                  {tab === 'issues' && '📤 '}
                  {tab === 'bookings' && '🗂️ '}
                  {tab === 'history' && '📋 '}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search books by title, author, ISBN..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">🔍</span>
            </form>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => { setFormData(DEFAULT_FORM_STATE); setEditingBook(null); setShowModal(true); }}
                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200"
              >
                + Add Book
              </button>
              <button
                onClick={() => setShowIssueModal(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-200"
              >
                Issue Book
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Books Grid */}
              {activeTab === 'books' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(books || []).map((book) => (
                    <div key={book.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => { setEditingBook(book); setFormData(book); setShowModal(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                        <button onClick={() => handleDeleteBook(book.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                      </div>
                      <div className="mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 uppercase tracking-wider">
                          {book.category}
                        </span>
                        <h3 className="text-xl font-extrabold text-gray-900 mt-2 line-clamp-1">{book.title}</h3>
                        <p className="text-gray-500 font-medium">{book.author}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Available</p>
                          <p className="text-lg font-black text-green-600">{book.available_copies} / {book.total_copies}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">ISBN</p>
                          <p className="text-sm font-bold text-gray-700">{book.isbn || 'N/A'}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px] italic">{book.description || 'No description available.'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Issues List */}
              {activeTab === 'issues' && (
                <div className="space-y-4">
                  {(bookIssues || []).map((issue) => (
                    <div key={issue.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{getBookTitle(issue.book_id)}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-gray-500 font-medium">Student: <span className="text-gray-900 font-bold">{getStudentName(issue.student_id)}</span></p>

                        <div className="flex gap-6 mt-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Issue Date</p>
                            <p className="text-sm font-bold">📅 {new Date(issue.issue_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Due Date</p>
                            <p className="text-sm font-bold text-orange-600">📅 {new Date(issue.due_date).toLocaleDateString()}</p>
                          </div>
                          {issue.fine > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Fine</p>
                              <p className="text-sm font-black text-red-600">₹{issue.fine}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {issue.status === 'Issued' && (
                        <button
                          onClick={() => handleReturnBook(issue.id)}
                          className="px-6 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all font-bold border border-orange-100"
                        >
                          Return Book
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bookings List */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  {(bookBookings || []).map(booking => (
                    <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{getBookTitle(booking.book_id)}</h4>
                          <p className="text-gray-500">Booked by: <span className="text-gray-900 font-bold">{getStudentName(booking.student_id)}</span></p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Add/Edit Book Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-2xl font-black text-gray-900">{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-black">×</button>
                </div>
                <form onSubmit={handleSaveBook} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Title</label>
                    <input name="title" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Author</label>
                    <input name="author" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">ISBN</label>
                    <input name="isbn" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Category</label>
                    <select name="category" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Total Copies</label>
                    <input type="number" min="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.total_copies} onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Pub. Year</label>
                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" value={formData.publication_year} onChange={(e) => setFormData({ ...formData, publication_year: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase ml-1">Description</label>
                    <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="col-span-full flex justify-end gap-3 pt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Save Book</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Issue Book Modal */}
          {showIssueModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="p-8 border-b border-gray-100 bg-green-50">
                  <h3 className="text-2xl font-black text-gray-900">Issue Book</h3>
                  <p className="text-green-600 font-bold text-xs uppercase tracking-widest mt-1">Lending Management</p>
                </div>
                <form onSubmit={handleIssueBook} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">Select Book</label>
                    <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)}>
                      <option value="">Choose a book...</option>
                      {books.filter(b => b.available_copies > 0).map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.available_copies} avail.)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">Select Student</label>
                    <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                      <option value="">Choose a student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.roll_number})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase">Due Date</label>
                    <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200">Confirm Issue</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
