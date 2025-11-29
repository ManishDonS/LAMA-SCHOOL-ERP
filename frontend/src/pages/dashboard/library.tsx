import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  availableCopies: number
  qrCode: string
  publicationYear: number
  description: string
}

interface BookIssue {
  id: string
  bookId: string
  bookTitle: string
  studentName: string
  issueDate: string
  dueDate: string
  returnDate?: string
  status: 'Issued' | 'Returned' | 'Overdue'
  fine: number
}

interface BookBooking {
  id: string
  bookId: string
  bookTitle: string
  studentName: string
  bookingDate: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Pending' | 'Approved' | 'Issued' | 'Cancelled'
}

interface FormData {
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  qrCode: string
  publicationYear: number
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
  totalCopies: 1,
  qrCode: '',
  publicationYear: new Date().getFullYear(),
  description: '',
}

const FINE_PER_DAY = 10 // ₹10 per day fine

export default function LibraryPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [bookIssues, setBookIssues] = useState<BookIssue[]>([])
  const [bookBookings, setBookBookings] = useState<BookBooking[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'books' | 'issues' | 'bookings' | 'history'>('books')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_STATE)

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/students', label: 'Students', icon: '👨‍🎓' },
    { href: '/dashboard/teachers', label: 'Teachers', icon: '👨‍🏫' },
    { href: '/dashboard/guardians', label: 'Guardians', icon: '👨‍👩‍👧' },
    { href: '/dashboard/staff', label: 'Staff', icon: '👔' },
    { href: '/dashboard/attendance', label: 'Attendance', icon: '📋' },
    { href: '/dashboard/fees', label: 'Fees', icon: '💰' },
    { href: '/dashboard/library', label: 'Library', icon: '📚' },
    { href: '/dashboard/classes', label: 'Classes', icon: '🏫' },
    { href: '/dashboard/school-buses', label: 'School Buses', icon: '🚌' },
    { href: '/dashboard/exams', label: 'Exams', icon: '📝' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ]

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBooks = localStorage.getItem('libraryBooks')
      const savedIssues = localStorage.getItem('libraryIssues')
      const savedBookings = localStorage.getItem('libraryBookings')

      if (savedBooks) {
        try {
          setBooks(JSON.parse(savedBooks))
        } catch (error) {
          console.error('Failed to load books:', error)
          setDefaultData()
        }
      } else {
        setDefaultData()
      }

      if (savedIssues) {
        try {
          setBookIssues(JSON.parse(savedIssues))
        } catch (error) {
          console.error('Failed to load book issues:', error)
        }
      }

      if (savedBookings) {
        try {
          setBookBookings(JSON.parse(savedBookings))
        } catch (error) {
          console.error('Failed to load bookings:', error)
        }
      }

      setIsHydrated(true)
    }
  }, [])

  // Calculate fines for overdue books
  useEffect(() => {
    if (isHydrated) {
      const today = new Date().toISOString().split('T')[0]
      setBookIssues((prev) =>
        prev.map((issue) => {
          if (issue.status === 'Issued' && issue.dueDate < today) {
            const daysOverdue = Math.floor(
              (new Date(today).getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            return {
              ...issue,
              status: 'Overdue',
              fine: daysOverdue * FINE_PER_DAY,
            }
          }
          return issue
        })
      )
    }
  }, [isHydrated])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('libraryBooks', JSON.stringify(books))
      localStorage.setItem('libraryIssues', JSON.stringify(bookIssues))
      localStorage.setItem('libraryBookings', JSON.stringify(bookBookings))
    }
  }, [books, bookIssues, bookBookings, isHydrated])

  const setDefaultData = () => {
    const defaultBooks: Book[] = [
      {
        id: '1',
        title: 'Advanced Mathematics',
        author: 'R.S. Aggarwal',
        isbn: 'ISBN-001',
        category: 'Mathematics',
        totalCopies: 5,
        availableCopies: 3,
        qrCode: 'QR-001',
        publicationYear: 2020,
        description: 'Comprehensive mathematics book for advanced studies',
      },
      {
        id: '2',
        title: 'Physics Fundamentals',
        author: 'H.C. Verma',
        isbn: 'ISBN-002',
        category: 'Physics',
        totalCopies: 4,
        availableCopies: 2,
        qrCode: 'QR-002',
        publicationYear: 2019,
        description: 'Core physics concepts and practical applications',
      },
      {
        id: '3',
        title: 'Biology for Students',
        author: 'NCERT',
        isbn: 'ISBN-003',
        category: 'Biology',
        totalCopies: 6,
        availableCopies: 4,
        qrCode: 'QR-003',
        publicationYear: 2021,
        description: 'Standard biology textbook with illustrations',
      },
    ]
    setBooks(defaultBooks)

    const defaultIssues: BookIssue[] = [
      {
        id: '1',
        bookId: '1',
        bookTitle: 'Advanced Mathematics',
        studentName: 'Raj Kumar',
        issueDate: '2024-10-15',
        dueDate: '2024-11-15',
        status: 'Issued',
        fine: 0,
      },
      {
        id: '2',
        bookId: '2',
        bookTitle: 'Physics Fundamentals',
        studentName: 'Priya Singh',
        issueDate: '2024-10-20',
        dueDate: '2024-11-20',
        returnDate: '2024-11-08',
        status: 'Returned',
        fine: 0,
      },
    ]
    setBookIssues(defaultIssues)
  }

  const handleAddBook = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_STATE)
    setShowModal(true)
  }

  const handleEditBook = (book: Book) => {
    setEditingId(book.id)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies,
      qrCode: book.qrCode,
      publicationYear: book.publicationYear,
      description: book.description,
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFormData(DEFAULT_FORM_STATE)
    setEditingId(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalCopies' || name === 'publicationYear' ? parseInt(value) || 0 : value,
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Please enter book title')
      return false
    }
    if (!formData.author.trim()) {
      alert('Please enter author name')
      return false
    }
    if (!formData.isbn.trim()) {
      alert('Please enter ISBN')
      return false
    }
    if (formData.totalCopies <= 0) {
      alert('Total copies must be greater than 0')
      return false
    }
    return true
  }

  const handleSaveBook = () => {
    if (!validateForm()) return

    if (editingId) {
      setBooks((prev) =>
        prev.map((book) =>
          book.id === editingId
            ? {
              ...book,
              title: formData.title,
              author: formData.author,
              isbn: formData.isbn,
              category: formData.category,
              totalCopies: formData.totalCopies,
              qrCode: formData.qrCode,
              publicationYear: formData.publicationYear,
              description: formData.description,
            }
            : book
        )
      )
    } else {
      const newBook: Book = {
        id: Date.now().toString(),
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        totalCopies: formData.totalCopies,
        availableCopies: formData.totalCopies,
        qrCode: formData.qrCode,
        publicationYear: formData.publicationYear,
        description: formData.description,
      }
      setBooks((prev) => [newBook, ...prev])
    }

    handleCloseModal()
  }

  const handleDeleteBook = (id: string) => {
    if (confirm('Are you sure you want to delete this book?')) {
      setBooks((prev) => prev.filter((book) => book.id !== id))
    }
  }

  const handleIssueBook = () => {
    const bookId = prompt('Enter Book ID:')
    const studentName = prompt('Enter Student Name:')
    const dueDays = prompt('Enter borrowing period (days):', '30')

    if (bookId && studentName && dueDays) {
      const book = books.find((b) => b.id === bookId)
      if (!book) {
        alert('Book not found')
        return
      }
      if (book.availableCopies <= 0) {
        alert('No copies available')
        return
      }

      const issueDate = new Date().toISOString().split('T')[0]
      const dueDate = new Date(new Date().setDate(new Date().getDate() + parseInt(dueDays)))
        .toISOString()
        .split('T')[0]

      const newIssue: BookIssue = {
        id: Date.now().toString(),
        bookId,
        bookTitle: book.title,
        studentName,
        issueDate,
        dueDate,
        status: 'Issued',
        fine: 0,
      }

      setBookIssues((prev) => [newIssue, ...prev])
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? {
              ...b,
              availableCopies: b.availableCopies - 1,
            }
            : b
        )
      )

      alert(`Book issued successfully to ${studentName}`)
    }
  }

  const handleReturnBook = (issueId: string) => {
    const issue = bookIssues.find((i) => i.id === issueId)
    if (!issue || issue.status === 'Returned') {
      alert('Invalid issue or already returned')
      return
    }

    const returnDate = new Date().toISOString().split('T')[0]
    const book = books.find((b) => b.id === issue.bookId)

    setBookIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? {
            ...i,
            returnDate,
            status: 'Returned',
          }
          : i
      )
    )

    if (book) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id
            ? {
              ...b,
              availableCopies: b.availableCopies + 1,
            }
            : b
        )
      )
    }

    alert('Book returned successfully')
  }

  const handleBookBook = () => {
    const bookId = prompt('Enter Book ID to book:')
    const studentName = prompt('Enter Student Name:')
    const priority = prompt('Enter priority (Low/Medium/High):', 'Medium')

    if (bookId && studentName && priority) {
      const book = books.find((b) => b.id === bookId)
      if (!book) {
        alert('Book not found')
        return
      }

      const newBooking: BookBooking = {
        id: Date.now().toString(),
        bookId,
        bookTitle: book.title,
        studentName,
        bookingDate: new Date().toISOString().split('T')[0],
        priority: (priority as 'Low' | 'Medium' | 'High') || 'Medium',
        status: 'Pending',
      }

      setBookBookings((prev) => [newBooking, ...prev])
      alert(`Book booked successfully for ${studentName}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Issued':
        return 'bg-blue-100 text-blue-800'
      case 'Returned':
        return 'bg-green-100 text-green-800'
      case 'Overdue':
        return 'bg-red-100 text-red-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Approved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalFines = bookIssues.reduce((sum, issue) => sum + issue.fine, 0)
  const overdueBooks = bookIssues.filter((i) => i.status === 'Overdue').length
  const issuedBooks = bookIssues.filter((i) => i.status === 'Issued').length

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Library Management</h2>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('books')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'books'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  📚 Books ({books.length})
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'issues'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  📤 Issues ({bookIssues.length})
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'bookings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  🗂️ Bookings ({bookBookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-3 px-4 font-semibold border-b-2 transition-all ${activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  📋 History
                </button>
              </div>
            </div>
          </div>

          {/* Books Tab */}
          {activeTab === 'books' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Book Management</h3>
                <button
                  onClick={handleAddBook}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                >
                  + Add New Book
                </button>
              </div>

              {books.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No books added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {books.map((book) => (
                    <div key={book.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {book.category}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            <span className="font-semibold">Author:</span> {book.author}
                          </p>
                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-500">ISBN</p>
                              <p className="font-semibold text-gray-900">{book.isbn}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Total Copies</p>
                              <p className="font-semibold text-gray-900">{book.totalCopies}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Available</p>
                              <p className="font-semibold text-green-600">{book.availableCopies}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Year</p>
                              <p className="font-semibold text-gray-900">{book.publicationYear}</p>
                            </div>
                          </div>
                          {book.description && <p className="text-gray-600 mt-3">{book.description}</p>}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditBook(book)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-600 hover:text-red-800 font-semibold hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Book Issue/Return</h3>
                <button
                  onClick={handleIssueBook}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  📤 Issue Book
                </button>
              </div>

              {bookIssues.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No book issues yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookIssues.map((issue) => (
                    <div key={issue.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{issue.bookTitle}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            <span className="font-semibold">Student:</span> {issue.studentName}
                          </p>
                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-500">Issue Date</p>
                              <p className="font-semibold text-gray-900">📅 {issue.issueDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Due Date</p>
                              <p className="font-semibold text-gray-900">📅 {issue.dueDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fine (₹)</p>
                              <p className={`font-semibold ${issue.fine > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {issue.fine}
                              </p>
                            </div>
                            {issue.returnDate && (
                              <div>
                                <p className="text-sm text-gray-500">Return Date</p>
                                <p className="font-semibold text-gray-900">📅 {issue.returnDate}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {issue.status === 'Issued' && (
                          <button
                            onClick={() => handleReturnBook(issue.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                          >
                            Return Book
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Book Bookings</h3>
                <button
                  onClick={handleBookBook}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
                >
                  🗂️ Book Now
                </button>
              </div>

              {bookBookings.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookBookings.map((booking) => (
                    <div key={booking.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{booking.bookTitle}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(booking.priority)}`}>
                              {booking.priority}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            <span className="font-semibold">Student:</span> {booking.studentName}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-500">Booking Date</p>
                              <p className="font-semibold text-gray-900">📅 {booking.bookingDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Priority</p>
                              <p className="font-semibold text-gray-900">{booking.priority}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Issue/Return History</h3>

              {bookIssues.filter((i) => i.status === 'Returned').length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <p className="text-gray-500 text-lg">No return history yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookIssues
                    .filter((i) => i.status === 'Returned')
                    .map((issue) => (
                      <div key={issue.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.bookTitle}</h3>
                            <p className="text-gray-600 mb-2">
                              <span className="font-semibold">Student:</span> {issue.studentName}
                            </p>
                            <div className="grid grid-cols-5 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Issue Date</p>
                                <p className="font-semibold text-gray-900">{issue.issueDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Due Date</p>
                                <p className="font-semibold text-gray-900">{issue.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Return Date</p>
                                <p className="font-semibold text-green-600">{issue.returnDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Days Borrowed</p>
                                <p className="font-semibold text-gray-900">
                                  {Math.floor(
                                    (new Date(issue.returnDate || '').getTime() - new Date(issue.issueDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Fine</p>
                                <p className="font-semibold text-gray-900">₹{issue.fine}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-5 gap-4 mt-8">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm font-medium">Total Books</p>
              <p className="text-3xl font-bold text-blue-600">{books.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm font-medium">Books Issued</p>
              <p className="text-3xl font-bold text-orange-600">{issuedBooks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm font-medium">Overdue Books</p>
              <p className="text-3xl font-bold text-red-600">{overdueBooks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm font-medium">Total Fine (₹)</p>
              <p className="text-3xl font-bold text-red-600">{totalFines}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-gray-600 text-sm font-medium">Pending Bookings</p>
              <p className="text-3xl font-bold text-purple-600">
                {bookBookings.filter((b) => b.status === 'Pending').length}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Book Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-8 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Book' : 'Add New Book'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter book title"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter author name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN *</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ISBN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Copies *</label>
                  <input
                    type="number"
                    name="totalCopies"
                    value={formData.totalCopies}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                  <input
                    type="text"
                    name="qrCode"
                    value={formData.qrCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., QR-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publication Year</label>
                  <input
                    type="number"
                    name="publicationYear"
                    value={formData.publicationYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter book description"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBook}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                {editingId ? 'Update Book' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
