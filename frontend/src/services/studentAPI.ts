// Student API Service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003/api'

export interface StudentDetails {
    student: {
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
    guardians: Array<{
        id: number
        guardianType: string
        name: string
        relationship: string
        phone: string
        email: string
        occupation: string
        address: string
        isPrimary: boolean
    }>
    emergencyContacts: Array<{
        id: number
        name: string
        relationship: string
        phone: string
        alternatePhone: string
        address: string
        priority: number
    }>
    currentPerformance: {
        id: number
        academicYear: string
        term: string
        gpa: number
        percentage: number
        rank: number
        totalStudents: number
        remarks: string
    } | null
    attendanceSummary: {
        id: number
        academicYear: string
        month: number
        totalDays: number
        presentDays: number
        absentDays: number
        lateDays: number
        excusedDays: number
        attendancePercentage: number
    } | null
    feeSummary: {
        id: number
        academicYear: string
        totalFee: number
        paidAmount: number
        outstandingAmount: number
        lastPaymentDate: string
    } | null
    recentActivities: Array<{
        id: number
        activityType: string
        title: string
        description: string
        activityDate: string
    }>
}

export interface StudentStatistics {
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

export interface AcademicData {
    records: Array<{
        id: number
        academicYear: string
        term: string
        subject: string
        marksObtained: number
        totalMarks: number
        grade: string
        percentage: number
        remarks: string
    }>
    performance: Array<{
        id: number
        academicYear: string
        term: string
        gpa: number
        percentage: number
        rank: number
        totalStudents: number
        remarks: string
    }>
}

export interface AttendanceData {
    records: Array<{
        id: number
        date: string
        status: string
        checkInTime: string
        checkOutTime: string
        reason: string
    }>
    summaries: Array<{
        id: number
        academicYear: string
        month: number
        totalDays: number
        presentDays: number
        absentDays: number
        lateDays: number
        excusedDays: number
        attendancePercentage: number
    }>
}

export interface FeeData {
    payments: Array<{
        id: number
        academicYear: string
        feeType: string
        amountPaid: number
        paymentDate: string
        paymentMethod: string
        transactionId: string
        receiptNumber: string
        remarks: string
    }>
    summaries: Array<{
        id: number
        academicYear: string
        totalFee: number
        paidAmount: number
        outstandingAmount: number
        lastPaymentDate: string
    }>
}

export const studentAPI = {
    // Get complete student details
    getStudentDetails: async (studentId: number): Promise<StudentDetails> => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`)
        if (!response.ok) throw new Error('Failed to fetch student details')
        return response.json()
    },

    // Get student statistics
    getStatistics: async (studentId: number): Promise<StudentStatistics> => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/statistics`)
        if (!response.ok) throw new Error('Failed to fetch statistics')
        return response.json()
    },

    // Get academic records
    getAcademics: async (studentId: number): Promise<AcademicData> => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/academics`)
        if (!response.ok) throw new Error('Failed to fetch academic records')
        return response.json()
    },

    // Get attendance records
    getAttendance: async (studentId: number): Promise<AttendanceData> => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/attendance`)
        if (!response.ok) throw new Error('Failed to fetch attendance')
        return response.json()
    },

    // Get fee records
    getFees: async (studentId: number): Promise<FeeData> => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/fees`)
        if (!response.ok) throw new Error('Failed to fetch fees')
        return response.json()
    },

    // Get health records
    getHealth: async (studentId: number) => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/health`)
        if (!response.ok) throw new Error('Failed to fetch health records')
        return response.json()
    },

    // Get behavioral records
    getBehavioral: async (studentId: number) => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/behavioral`)
        if (!response.ok) throw new Error('Failed to fetch behavioral records')
        return response.json()
    },

    // Get documents
    getDocuments: async (studentId: number) => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/documents`)
        if (!response.ok) throw new Error('Failed to fetch documents')
        return response.json()
    },

    // Get communications
    getCommunications: async (studentId: number) => {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}/communications`)
        if (!response.ok) throw new Error('Failed to fetch communications')
        return response.json()
    },
}
