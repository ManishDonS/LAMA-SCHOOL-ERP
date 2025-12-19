import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import PhotoUploadModal from '../../../components/PhotoUploadModal'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { studentAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface Student {
    id: number
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    nationality: string
    studentIdNumber: string
    enrollmentDate: string
    class: string
    section: string
    rollNumber: string
    bloodGroup: string
    photoUrl: string
    email: string
    phone: string
    address: string
    status: string
    username: string
    // Health & Safety
    medicalConditions: string
    allergies: string
    medications: string
    specialNeeds: string
    // Academics
    previousSchool: string
    subjects: string
    house: string
    // Transport
    rfidNumber: string
    busRoute: string
    uniformSize: string
    pickupAddress: string
    dropoffAddress: string
    driverInfo: string
}

const COUNTRIES = [
    "Nepal", "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "United Arab Emirates", "Saudi Arabia", "Qatar", "Others"
]

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
        return dateStr.split('T')[0]
    }
    return dateStr
}

interface Guardian {
    id: number
    guardianType: string
    name: string
    relationship: string
    phone: string
    email: string
    occupation: string
    address: string
    isPrimary: boolean
}

interface EmergencyContact {
    id: number
    name: string
    relationship: string
    phone: string
    alternatePhone: string
    address: string
    priority: number
}

interface AcademicRecord {
    id: number
    academicYear: string
    term: string
    subject: string
    marksObtained: number
    totalMarks: number
    grade: string
    percentage: number
    remarks: string
}

interface AcademicPerformance {
    id: number
    academicYear: string
    term: string
    gpa: number
    percentage: number
    rank: number
    totalStudents: number
    remarks: string
}

interface AttendanceRecord {
    id: number
    date: string
    status: string
    checkInTime: string
    checkOutTime: string
    reason: string
}

interface AttendanceSummary {
    id: number
    academicYear: string
    month: number
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    excusedDays: number
    attendancePercentage: number
}

interface FeePayment {
    id: number
    academicYear: string
    feeType: string
    amountPaid: number
    paymentDate: string
    paymentMethod: string
    transactionId: string
    receiptNumber: string
    remarks: string
}

interface FeeSummary {
    id: number
    academicYear: string
    totalFee: number
    paidAmount: number
    outstandingAmount: number
    lastPaymentDate: string
}

interface HealthRecord {
    id: number
    recordType: string
    title: string
    description: string
    severity: string
    diagnosedDate: string
    doctorName: string
    hospital: string
    prescription: string
    notes: string
}

interface BehavioralRecord {
    id: number
    recordType: string
    category: string
    title: string
    description: string
    incidentDate: string
    actionTaken: string
    severity: string
    points: number
}

interface StudentDocument {
    id: number
    documentType: string
    title: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    isVerified: boolean
    createdAt: string
}

interface ParentCommunication {
    id: number
    communicationType: string
    subject: string
    message: string
    communicationDate: string
    initiatedBy: string
    status: string
    notes: string
}

interface StudentActivity {
    id: number
    activityType: string
    title: string
    description: string
    activityDate: string
}

interface Statistics {
    overallAttendance: number
    currentGpa: number
    currentPercentage: number
    totalFeesPaid: number
    outstandingFees: number
    behaviorPoints: number
    totalAbsences: number
    totalLateDays: number
    documentsCount: number
    healthRecordsCount: number
}

const TABS = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'academics', label: 'Academics', icon: '📚' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'fees', label: 'Fees', icon: '💰' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'behavioral', label: 'Behavioral', icon: '⭐' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'communications', label: 'Communications', icon: '💬' },
]

export default function StudentDetailsPage() {
    const router = useRouter()
    const { id } = router.query
    const { user } = useAuthStore()

    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    // State for Photo Modal
    const [showPhotoModal, setShowPhotoModal] = useState(false)
    const [showViewPhotoModal, setShowViewPhotoModal] = useState(false)

    // Handlers
    const handlePhotoUpload = async (photoDataUrl: string) => {
        if (student) {
            try {
                // Persist to backend
                await studentAPI.update(Number(id), { photo_url: photoDataUrl })

                const updatedStudent = { ...student, photoUrl: photoDataUrl }
                setStudent(updatedStudent)

                // Save to LocalStorage (Legacy fallback)
                const savedStudents = localStorage.getItem('students')
                if (savedStudents) {
                    const parsedStudents = JSON.parse(savedStudents)
                    const updatedStudents = parsedStudents.map((s: any) =>
                        s.id === student.id ? { ...s, photoUrl: photoDataUrl } : s
                    )
                    localStorage.setItem('students', JSON.stringify(updatedStudents))
                }

                toast.success('Profile photo updated successfully')
            } catch (error) {
                console.error('Failed to update photo:', error)
                toast.error('Failed to update profile photo')
            }
        }
    }
    const [student, setStudent] = useState<Student | null>(null)
    const [guardians, setGuardians] = useState<Guardian[]>([])
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
    const [statistics, setStatistics] = useState<Statistics | null>(null)
    const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([])
    const [academicPerformance, setAcademicPerformance] = useState<AcademicPerformance[]>([])
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummary[]>([])
    const [feePayments, setFeePayments] = useState<FeePayment[]>([])
    const [feeSummaries, setFeeSummaries] = useState<FeeSummary[]>([])
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
    const [behavioralRecords, setBehavioralRecords] = useState<BehavioralRecord[]>([])
    const [documents, setDocuments] = useState<StudentDocument[]>([])
    const [communications, setCommunications] = useState<ParentCommunication[]>([])
    const [activities, setActivities] = useState<StudentActivity[]>([])

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Student>>({})

    const handleSaveEdit = async () => {
        if (!student) return
        try {
            setLoading(true)
            await studentAPI.update(Number(id), {
                first_name: editForm.firstName,
                last_name: editForm.lastName,
                date_of_birth: editForm.dateOfBirth,
                gender: editForm.gender,
                nationality: editForm.nationality,
                blood_group: editForm.bloodGroup,
                email: editForm.email,
                phone: editForm.phone,
                address: editForm.address,
                class: editForm.class,
                section: editForm.section,
                roll_number: editForm.rollNumber,
            })

            setStudent({ ...student, ...editForm })
            setIsEditing(false)
            toast.success('Profile updated successfully')
        } catch (error) {
            console.error('Failed to update student:', error)
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!id) return

        const fetchStudentDetails = async () => {
            setLoading(true)
            try {
                // Fetch student data from API
                const response = await studentAPI.get(Number(id))
                const studentData = response.data

                // Map the API response to the component's expected format
                const s = studentData.student || {}
                const mappedStudent: Student = {
                    id: s.id,
                    firstName: s.firstName || s.first_name || '',
                    lastName: s.lastName || s.last_name || '',
                    dateOfBirth: s.dateOfBirth || s.date_of_birth || '',
                    gender: s.gender || '',
                    nationality: s.nationality || '',
                    studentIdNumber: s.studentIdNumber || s.student_id_number || '',
                    enrollmentDate: s.enrollmentDate || s.enrollment_date || '',
                    class: s.currentClass || s.current_class || s.class || '',
                    section: s.section || '',
                    rollNumber: s.rollNumber || s.roll_number || '',
                    bloodGroup: s.bloodGroup || s.blood_group || '',
                    photoUrl: s.photoUrl || s.photo_url || '',
                    email: s.email || '',
                    phone: s.phone || s.primary_phone || '',
                    address: s.address || s.home_address || '',
                    status: s.status || 'Active',
                    username: s.username || '',
                    // Health & Safety
                    medicalConditions: s.medicalConditions || s.medical_conditions || '',
                    allergies: s.allergies || '',
                    medications: s.medications || '',
                    specialNeeds: s.specialNeeds || s.special_needs || '',
                    // Academics
                    previousSchool: s.previousSchool || s.previous_school || '',
                    subjects: s.subjects || '',
                    house: s.house || '',
                    // Transport
                    rfidNumber: s.rfidNumber || s.rfid_number || '',
                    busRoute: s.busRoute || s.bus_route || '',
                    uniformSize: s.uniformSize || s.uniform_size || '',
                    pickupAddress: s.pickupAddress || s.pickup_address || '',
                    dropoffAddress: s.dropoffAddress || s.dropoff_address || '',
                    driverInfo: s.driverInfo || s.driver_info || '',
                }

                // Map guardian info from API response
                const mappedGuardians: Guardian[] = []
                if (studentData.guardians && Array.isArray(studentData.guardians)) {
                    studentData.guardians.forEach((guardian: any, index: number) => {
                        mappedGuardians.push({
                            id: guardian.id || index + 1,
                            guardianType: guardian.guardianType || guardian.guardian_type || 'guardian',
                            name: guardian.name || '',
                            relationship: guardian.relationship || '',
                            phone: guardian.phone || '',
                            email: guardian.email || '',
                            occupation: guardian.occupation || '',
                            address: guardian.address || '',
                            isPrimary: guardian.isPrimary || guardian.is_primary || false,
                        })
                    })
                } else {
                    // Fallback to legacy fields if guardians array not present
                    if (studentData.fatherName || studentData.father_name) {
                        mappedGuardians.push({
                            id: 1,
                            guardianType: 'father',
                            name: studentData.fatherName || studentData.father_name,
                            relationship: 'Father',
                            phone: studentData.primaryPhone || studentData.primary_phone || '',
                            email: studentData.email || '',
                            occupation: '',
                            address: studentData.homeAddress || studentData.home_address || '',
                            isPrimary: true,
                        })
                    }
                    if (studentData.motherName || studentData.mother_name) {
                        mappedGuardians.push({
                            id: 2,
                            guardianType: 'mother',
                            name: studentData.motherName || studentData.mother_name,
                            relationship: 'Mother',
                            phone: '',
                            email: '',
                            occupation: '',
                            address: studentData.homeAddress || studentData.home_address || '',
                            isPrimary: false,
                        })
                    }
                }

                // Mock statistics based on real data where possible, or defaults
                const derivedStatistics: Statistics = {
                    overallAttendance: studentData.overallAttendance || studentData.overall_attendance || 0,
                    currentGpa: studentData.currentGpa || studentData.current_gpa || 0,
                    currentPercentage: studentData.currentPercentage || studentData.current_percentage || 0,
                    totalFeesPaid: studentData.totalFeesPaid || studentData.total_fees_paid || 0,
                    outstandingFees: studentData.outstandingFees || studentData.outstanding_fees || 0,
                    behaviorPoints: studentData.behaviorPoints || studentData.behavior_points || 100,
                    totalAbsences: studentData.totalAbsences || studentData.total_absences || 0,
                    totalLateDays: studentData.totalLateDays || studentData.total_late_days || 0,
                    documentsCount: studentData.documentsCount || studentData.documents_count || 0,
                    healthRecordsCount: studentData.healthRecordsCount || studentData.health_records_count || 0,
                }

                setStudent(mappedStudent)
                setGuardians(mappedGuardians)
                setStatistics(derivedStatistics)
            } catch (error) {
                console.error('Failed to fetch student details:', error)
                setStudent(null)
            } finally {
                setLoading(false)
            }
        }

        fetchStudentDetails()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Loading student details...</p>
                </div>
            </div>
        )
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600">Student not found</p>
                    <Link href="/dashboard/students">
                        <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Back to Students
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
            <Navbar showBackButton={true} backLink="/dashboard/students" />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 py-8 px-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-6">
                                {/* Student Photo */}
                                {/* Student Photo */}
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-4 border-white">
                                        {student.photoUrl ? (
                                            <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{student.firstName[0]}{student.lastName[0]}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[2px]">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowViewPhotoModal(true); }}
                                            className="text-white hover:text-blue-200 transform hover:scale-110 transition-transform p-1"
                                            title="View Photo"
                                        >
                                            <span className="text-lg">👁️</span>
                                        </button>
                                        <div className="w-8 h-[1px] bg-white/30 my-0.5"></div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowPhotoModal(true); }}
                                            className="text-white hover:text-blue-200 transform hover:scale-110 transition-transform p-1"
                                            title="Change Photo"
                                        >
                                            <span className="text-lg">📷</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Student Info */}
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-2 mb-1">
                                            <input
                                                type="text"
                                                className="text-2xl font-bold border rounded px-2 py-1 w-40"
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                                placeholder="First Name"
                                            />
                                            <input
                                                type="text"
                                                className="text-2xl font-bold border rounded px-2 py-1 w-40"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                                placeholder="Last Name"
                                            />
                                        </div>
                                    ) : (
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                                            {student.firstName} {student.lastName}
                                        </h1>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                        {isEditing ? (
                                            <>
                                                <div className="flex items-center gap-1">
                                                    <label className="font-semibold text-xs">Class:</label>
                                                    <input
                                                        type="text"
                                                        className="border rounded px-1 w-16 text-xs"
                                                        value={editForm.class}
                                                        onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <label className="font-semibold text-xs">Section:</label>
                                                    <input
                                                        type="text"
                                                        className="border rounded px-1 w-12 text-xs"
                                                        value={editForm.section}
                                                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <label className="font-semibold text-xs">Roll:</label>
                                                    <input
                                                        type="text"
                                                        className="border rounded px-1 w-16 text-xs"
                                                        value={editForm.rollNumber}
                                                        onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-semibold">ID: {student.studentIdNumber}</span>
                                                <span>•</span>
                                                <span>Class: {student.class}</span>
                                                <span>•</span>
                                                <span>Roll No: {student.rollNumber}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 print:hidden">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                                        >
                                            💾 Save Changes
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditForm({ ...student })
                                            setIsEditing(true)
                                        }}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors"
                                    >
                                        ✏️ Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => alert('Opening message dialog...')}
                                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold transition-colors"
                                >
                                    📧 Message
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold transition-colors"
                                >
                                    🖨️ Print
                                </button>
                                <button
                                    onClick={() => alert(`Exporting profile for ${student.firstName}...`)}
                                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-semibold transition-colors"
                                >
                                    📥 Export
                                </button>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        {statistics && (
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div className="text-sm text-blue-600 font-semibold mb-1">Attendance</div>
                                    <div className="text-2xl font-bold text-blue-700">{statistics.overallAttendance}%</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div className="text-sm text-purple-600 font-semibold mb-1">GPA</div>
                                    <div className="text-2xl font-bold text-purple-700">{statistics.currentGpa}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div className="text-sm text-green-600 font-semibold mb-1">Percentage</div>
                                    <div className="text-2xl font-bold text-green-700">{statistics.currentPercentage}%</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                    <div className="text-sm text-orange-600 font-semibold mb-1">Outstanding Fees</div>
                                    <div className="text-2xl font-bold text-orange-700">₹{statistics.outstandingFees}</div>
                                </div>
                                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                                    <div className="text-sm text-pink-600 font-semibold mb-1">Behavior Points</div>
                                    <div className="text-2xl font-bold text-pink-700">{statistics.behaviorPoints}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabs Navigation */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="flex border-b border-gray-200 overflow-x-auto">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-[120px] px-6 py-4 font-semibold transition-all duration-200 relative ${activeTab === tab.id
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Personal Information */}
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>👤</span> Personal Information
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Date of Birth</label>
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={formatDate(editForm.dateOfBirth)}
                                                        onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className="text-gray-800">{formatDate(student.dateOfBirth)}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Gender</label>
                                                {isEditing ? (
                                                    <select
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={editForm.gender}
                                                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-gray-800">{student.gender}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Nationality</label>
                                                {isEditing ? (
                                                    <select
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={editForm.nationality}
                                                        onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                                                    >
                                                        <option value="">Select Country</option>
                                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                ) : (
                                                    <p className="text-gray-800">{student.nationality}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Blood Group</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={editForm.bloodGroup}
                                                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className="text-gray-800">{student.bloodGroup}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Email</label>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={editForm.email}
                                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className="text-gray-800">{student.email || '-'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Username</label>
                                                <p className="text-gray-800">{student.username}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Phone</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        value={editForm.phone}
                                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className="text-gray-800">{student.phone}</p>
                                                )}
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-sm font-semibold text-gray-600">Address</label>
                                                {isEditing ? (
                                                    <textarea
                                                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                                                        rows={2}
                                                        value={editForm.address}
                                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className="text-gray-800">{student.address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian Information */}
                                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>👨‍👩‍👧</span> Guardian Information
                                        </h3>
                                        <div className="space-y-4">
                                            {guardians.length > 0 ? guardians.map((guardian) => (
                                                <div key={guardian.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-800">{guardian.name}</h4>
                                                        {guardian.isPrimary && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                            <label className="text-gray-600 font-semibold">Relationship</label>
                                                            <p className="text-gray-800">{guardian.relationship}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-600 font-semibold">Phone</label>
                                                            <p className="text-gray-800">{guardian.phone}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-600 font-semibold">Email</label>
                                                            <p className="text-gray-800">{guardian.email}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-600 font-semibold">Occupation</label>
                                                            <p className="text-gray-800">{guardian.occupation}</p>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-gray-600 font-semibold">Address</label>
                                                            <p className="text-gray-800">{guardian.address}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 italic">No guardian information available.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transport Details */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🚌</span> Transport Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Bus Route</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🛣️</span>
                                                    <span className="text-lg font-medium text-gray-900">{student.busRoute || 'No Route Assigned'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">RFID / Barcode</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🆔</span>
                                                    <span className="text-lg font-medium text-gray-900">{student.rfidNumber || 'Not Assigned'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Pickup Address</label>
                                                <p className="text-gray-800">{student.pickupAddress || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Drop-off Address</label>
                                                <p className="text-gray-800">{student.dropoffAddress || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <label className="text-sm font-semibold text-gray-600 block mb-1">Driver & Vehicle Info</label>
                                            <p className="text-gray-800">{student.driverInfo || 'No details available'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Academics Tab */}
                            {activeTab === 'academics' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <span>🏫</span> Current Enrollment
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Class</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="border rounded px-2 w-24 text-sm"
                                                            value={editForm.class}
                                                            onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="font-semibold">{student.class}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Section</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="border rounded px-2 w-24 text-sm"
                                                            value={editForm.section}
                                                            onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="font-semibold">{student.section}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-gray-600">Roll Number</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            className="border rounded px-2 w-24 text-sm"
                                                            value={editForm.rollNumber}
                                                            onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="font-semibold">{student.rollNumber}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Enrollment Date</span>
                                                    <span className="font-semibold">{formatDate(student.enrollmentDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <span>📜</span> Previous Education
                                            </h3>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Previous School</label>
                                                <p className="text-gray-800 font-medium">{student.previousSchool || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📚</span> Subjects & House
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">House / Group</label>
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${student.house === 'Red' ? 'bg-red-100 text-red-800' :
                                                    student.house === 'Blue' ? 'bg-blue-100 text-blue-800' :
                                                        student.house === 'Green' ? 'bg-green-100 text-green-800' :
                                                            student.house === 'Yellow' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {student.house || 'Not Assigned'}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Selected Subjects</label>
                                                <p className="text-gray-800">{student.subjects || 'General Curriculum'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Health Tab */}
                            {activeTab === 'health' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>🏥</span> Medical Profile
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Blood Group</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🩸</span>
                                                    <span className="text-lg font-medium text-gray-900">{student.bloodGroup || 'Not specified'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-1">Medical Conditions</label>
                                                <p className="text-gray-800 bg-red-50 p-3 rounded-lg border border-red-100">
                                                    {student.medicalConditions || 'None reported'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <span>💊</span> Medications
                                            </h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {student.medications || 'No current medications'}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <span>⚠️</span> Allergies
                                            </h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {student.allergies || 'No known allergies'}
                                            </p>
                                        </div>
                                    </div>

                                    {student.specialNeeds && (
                                        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                                            <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                                <span>♿</span> Special Needs / Learning Support
                                            </h3>
                                            <p className="text-yellow-900">
                                                {student.specialNeeds}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Attendance Tab */}
                            {activeTab === 'attendance' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📅</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Attendance Records</h3>
                                    <p className="text-gray-600">Comprehensive attendance history and statistics will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including calendar heatmap, monthly summaries, and absence reasons.</p>
                                </div>
                            )}

                            {/* Fees Tab */}
                            {activeTab === 'fees' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>💰</span> Fee Status
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                                <div className="text-sm text-green-600 font-semibold">Total Paid</div>
                                                <div className="text-2xl font-bold text-green-700">₹{statistics?.totalFeesPaid || 0}</div>
                                            </div>
                                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                                <div className="text-sm text-red-600 font-semibold">Outstanding</div>
                                                <div className="text-2xl font-bold text-red-700">₹{statistics?.outstandingFees || 0}</div>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="text-sm text-blue-600 font-semibold">Fee Category</div>
                                                <div className="text-2xl font-bold text-blue-700">Regular</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500">No transaction history available.</p>
                                    </div>
                                </div>
                            )}

                            {/* Behavioral Tab */}
                            {activeTab === 'behavioral' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⭐</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Behavioral Records</h3>
                                    <p className="text-gray-600">Current Behavior Points: <span className="font-bold text-blue-600">{statistics?.behaviorPoints || 100}</span></p>
                                    <p className="text-sm text-gray-500 mt-4">No incidents recorded.</p>
                                </div>
                            )}

                            {/* Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📄</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Student Documents</h3>
                                    <p className="text-gray-600">No documents uploaded for {student.firstName}.</p>
                                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                        Upload Document
                                    </button>
                                </div>
                            )}

                            {/* Health Tab */}
                            {activeTab === 'health' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🏥</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Health Records</h3>
                                    <p className="text-gray-600">Medical history, allergies, and health information will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including vaccinations, medical conditions, and emergency medical info.</p>
                                </div>
                            )}

                            {/* Behavioral Tab */}
                            {activeTab === 'behavioral' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⭐</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Behavioral Records</h3>
                                    <p className="text-gray-600">Disciplinary actions and positive behavior recognition will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including teacher remarks and behavioral trends.</p>
                                </div>
                            )}

                            {/* Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📄</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Documents & Certificates</h3>
                                    <p className="text-gray-600">Student documents, certificates, and reports will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including upload functionality and document verification status.</p>
                                </div>
                            )}

                            {/* Communications Tab */}
                            {activeTab === 'communications' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💬</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Parent Communications</h3>
                                    <p className="text-gray-600">Communication history with parents and guardians will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including meetings, messages, calls, and email correspondence.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main >
            </div >
            {/* Photo Upload Modal */}
            {
                student && (
                    <PhotoUploadModal
                        isOpen={showPhotoModal}
                        onClose={() => setShowPhotoModal(false)}
                        onUpload={handlePhotoUpload}
                        studentId={student.id}
                        studentName={`${student.firstName} ${student.lastName}`}
                    />
                )
            }

            {/* View Photo Modal */}
            {
                showViewPhotoModal && student && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowViewPhotoModal(false)}>
                        <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                            <button
                                onClick={() => setShowViewPhotoModal(false)}
                                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                            >
                                <span className="text-4xl">×</span>
                            </button>
                            {student.photoUrl ? (
                                <img
                                    src={student.photoUrl}
                                    alt={`${student.firstName} ${student.lastName}`}
                                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border-4 border-white/10"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-6xl font-bold shadow-lg border-4 border-white">
                                    {student.firstName[0]}{student.lastName[0]}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    )
}

