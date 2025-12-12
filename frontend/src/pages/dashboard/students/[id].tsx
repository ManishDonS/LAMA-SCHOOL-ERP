import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'

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

    useEffect(() => {
        if (!id) return

        // Mock data for demonstration
        const mockStudent: Student = {
            id: Number(id),
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '2008-05-15',
            gender: 'Male',
            nationality: 'Nepalese',
            studentIdNumber: 'STU202400001',
            enrollmentDate: '2020-06-01',
            class: '10A',
            section: 'A',
            rollNumber: '1',
            bloodGroup: 'O+',
            photoUrl: '',
            email: 'john.doe@school.com',
            phone: '+977-9841234567',
            address: '123 Main Street, Kathmandu',
            status: 'Active',
        }

        const mockGuardians: Guardian[] = [
            {
                id: 1,
                guardianType: 'father',
                name: 'Robert Doe',
                relationship: 'Father',
                phone: '+977-9841234567',
                email: 'robert.doe@email.com',
                occupation: 'Engineer',
                address: '123 Main Street, Kathmandu',
                isPrimary: true,
            },
            {
                id: 2,
                guardianType: 'mother',
                name: 'Mary Doe',
                relationship: 'Mother',
                phone: '+977-9841234568',
                email: 'mary.doe@email.com',
                occupation: 'Teacher',
                address: '123 Main Street, Kathmandu',
                isPrimary: false,
            },
        ]

        const mockStatistics: Statistics = {
            overallAttendance: 92.5,
            currentGpa: 3.8,
            currentPercentage: 85.5,
            totalFeesPaid: 45000,
            outstandingFees: 5000,
            behaviorPoints: 95,
            totalAbsences: 8,
            totalLateDays: 3,
            documentsCount: 12,
            healthRecordsCount: 5,
        }

        setStudent(mockStudent)
        setGuardians(mockGuardians)
        setStatistics(mockStatistics)
        setLoading(false)
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
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {student.firstName[0]}{student.lastName[0]}
                                </div>

                                {/* Student Info */}
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                                        {student.firstName} {student.lastName}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                        <span className="font-semibold">ID: {student.studentIdNumber}</span>
                                        <span>•</span>
                                        <span>Class: {student.class}</span>
                                        <span>•</span>
                                        <span>Roll No: {student.rollNumber}</span>
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
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
                                    ✏️ Edit
                                </button>
                                <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold transition-colors">
                                    📧 Message
                                </button>
                                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold transition-colors">
                                    🖨️ Print
                                </button>
                                <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-semibold transition-colors">
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
                                                <p className="text-gray-800">{student.dateOfBirth}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Gender</label>
                                                <p className="text-gray-800">{student.gender}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Nationality</label>
                                                <p className="text-gray-800">{student.nationality}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Blood Group</label>
                                                <p className="text-gray-800">{student.bloodGroup}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Email</label>
                                                <p className="text-gray-800">{student.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">Phone</label>
                                                <p className="text-gray-800">{student.phone}</p>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-sm font-semibold text-gray-600">Address</label>
                                                <p className="text-gray-800">{student.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian Information */}
                                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>👨‍👩‍👧</span> Guardian Information
                                        </h3>
                                        <div className="space-y-4">
                                            {guardians.map((guardian) => (
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
                                            ))}
                                        </div>
                                    </div>

                                    {/* Academic Summary */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📚</span> Academic Summary
                                        </h3>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                                                <div className="text-3xl font-bold text-purple-600">{statistics?.currentGpa}</div>
                                                <div className="text-sm text-gray-600 mt-1">Current GPA</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                                                <div className="text-3xl font-bold text-blue-600">{statistics?.currentPercentage}%</div>
                                                <div className="text-sm text-gray-600 mt-1">Percentage</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                                                <div className="text-3xl font-bold text-green-600">{statistics?.overallAttendance}%</div>
                                                <div className="text-sm text-gray-600 mt-1">Attendance</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                                                <div className="text-3xl font-bold text-orange-600">{statistics?.behaviorPoints}</div>
                                                <div className="text-sm text-gray-600 mt-1">Behavior Points</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Academics Tab */}
                            {activeTab === 'academics' && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Academic Records</h3>
                                    <p className="text-gray-600">Detailed academic performance and grade history will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including subject-wise grades, GPA trends, and performance charts.</p>
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
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💰</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Fee Management</h3>
                                    <p className="text-gray-600">Fee structure, payment history, and outstanding balance will be displayed here.</p>
                                    <p className="text-sm text-gray-500 mt-2">Including payment receipts and fee category breakdown.</p>
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
                </main>
            </div>
        </div>
    )
}
