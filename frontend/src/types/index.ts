export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent' | 'staff'
  schoolId: number
  status: 'active' | 'inactive'
  createdAt: string
}

export interface AuthResponse {
  message: string
  data: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  schoolId: number
  role: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

export interface Student {
  id: number
  schoolId: number
  userId: number
  rollNumber: string
  class: string
  section: string
  admissionDate: string
  status: string
  createdAt: string
}

export interface Teacher {
  id: number
  schoolId: number
  userId: number
  qualification: string
  department: string
  employeeId: string
  joinDate: string
  status: string
  createdAt: string
}

export interface Attendance {
  id: number
  schoolId: number
  studentId: number
  class: string
  date: string
  status: 'present' | 'absent' | 'leave'
  remarks?: string
  createdAt: string
}

export interface ApiError {
  error: string
  message?: string
  status?: number
}
