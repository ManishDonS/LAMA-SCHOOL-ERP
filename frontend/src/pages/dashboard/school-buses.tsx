import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { transportAPI } from '@/services/api'

// Type Definitions
interface Bus {
  id: string
  busNumber: string
  registrationNo: string
  model: string
  capacity: number
  currentStudents: number
  driverId: string
  driverName: string
  routeId: string
  routeName: string
  status: 'Active' | 'Inactive' | 'Maintenance'
  purchaseDate: string
  lastServiceDate: string
  traccarDeviceId: string
  description: string
}

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  assignedBusId: string
  assignedBusNumber: string
  status: 'Active' | 'On Leave' | 'Inactive'
  joinDate: string
  address: string
  emergencyContact: string
}

interface Route {
  id: string
  routeName: string
  routeNumber: string
  startPoint: string
  endPoint: string
  distance: number
  stops: number
  assignedBusId: string
  assignedBusNumber: string
  departureTime: string
  arrivalTime: string
  status: 'Active' | 'Inactive'
  description: string
}

interface StudentAssignment {
  id: string
  studentName: string
  studentId: string
  busId: string
  busNumber: string
  routeId: string
  routeName: string
  pickupStop: string
  dropoffStop: string
  status: 'Active' | 'Inactive'
}

interface TraccarPosition {
  id: number
  deviceId: number
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
  address: string
  serverTime: string
  attributes: {
    battery?: number
    distance?: number
    motion?: boolean
  }
}

interface TraccarDevice {
  id: number
  name: string
  uniqueId: string
  status: string
  lastUpdate: string
  attributes: Record<string, any>
}

// Form Data Types
interface BusFormData {
  busNumber: string
  registrationNo: string
  model: string
  capacity: number
  driverId: string
  routeId: string
  status: 'Active' | 'Inactive' | 'Maintenance'
  purchaseDate: string
  lastServiceDate: string
  traccarDeviceId: string
  description: string
}

interface DriverFormData {
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  assignedBusId: string
  status: 'Active' | 'On Leave' | 'Inactive'
  joinDate: string
  address: string
  emergencyContact: string
}

interface RouteFormData {
  routeName: string
  routeNumber: string
  startPoint: string
  endPoint: string
  distance: number
  stops: number
  assignedBusId: string
  departureTime: string
  arrivalTime: string
  status: 'Active' | 'Inactive'
  description: string
}

interface StudentAssignmentFormData {
  studentName: string
  studentId: string
  busId: string
  routeId: string
  pickupStop: string
  dropoffStop: string
  status: 'Active' | 'Inactive'
}

const DEFAULT_BUS_FORM: BusFormData = {
  busNumber: '',
  registrationNo: '',
  model: '',
  capacity: 50,
  driverId: '',
  routeId: '',
  status: 'Active',
  purchaseDate: '',
  lastServiceDate: '',
  traccarDeviceId: '',
  description: '',
}

const DEFAULT_DRIVER_FORM: DriverFormData = {
  name: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  assignedBusId: '',
  status: 'Active',
  joinDate: '',
  address: '',
  emergencyContact: '',
}

const DEFAULT_ROUTE_FORM: RouteFormData = {
  routeName: '',
  routeNumber: '',
  startPoint: '',
  endPoint: '',
  distance: 0,
  stops: 0,
  assignedBusId: '',
  departureTime: '',
  arrivalTime: '',
  status: 'Active',
  description: '',
}

const DEFAULT_STUDENT_FORM: StudentAssignmentFormData = {
  studentName: '',
  studentId: '',
  busId: '',
  routeId: '',
  pickupStop: '',
  dropoffStop: '',
  status: 'Active',
}

const DEFAULT_BUSES: Bus[] = [
  {
    id: '1',
    busNumber: 'BUS-001',
    registrationNo: 'MH01AB1234',
    model: 'Volvo B11R',
    capacity: 50,
    currentStudents: 42,
    driverId: '1',
    driverName: 'Rajesh Kumar',
    routeId: '1',
    routeName: 'Route A',
    status: 'Active',
    purchaseDate: '2022-01-15',
    lastServiceDate: '2024-10-20',
    traccarDeviceId: '123',
    description: 'Main school bus for Route A',
  },
  {
    id: '2',
    busNumber: 'BUS-002',
    registrationNo: 'MH01AB1235',
    model: 'Ashok Leyland',
    capacity: 45,
    currentStudents: 38,
    driverId: '2',
    driverName: 'Priya Singh',
    routeId: '2',
    routeName: 'Route B',
    status: 'Active',
    purchaseDate: '2022-06-10',
    lastServiceDate: '2024-09-15',
    traccarDeviceId: '124',
    description: 'Secondary school bus for Route B',
  },
]

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91-9876543210',
    licenseNumber: 'DL001234',
    licenseExpiry: '2025-12-31',
    assignedBusId: '1',
    assignedBusNumber: 'BUS-001',
    status: 'Active',
    joinDate: '2022-01-15',
    address: '123 Driver Lane, City',
    emergencyContact: '+91-9123456789',
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+91-9876543211',
    licenseNumber: 'DL001235',
    licenseExpiry: '2025-11-30',
    assignedBusId: '2',
    assignedBusNumber: 'BUS-002',
    status: 'Active',
    joinDate: '2022-06-10',
    address: '456 Driver Avenue, City',
    emergencyContact: '+91-9123456790',
  },
]

const DEFAULT_ROUTES: Route[] = [
  {
    id: '1',
    routeName: 'Morning Route A',
    routeNumber: 'R001',
    startPoint: 'School',
    endPoint: 'Residential Area A',
    distance: 25.5,
    stops: 12,
    assignedBusId: '1',
    assignedBusNumber: 'BUS-001',
    departureTime: '07:00',
    arrivalTime: '08:00',
    status: 'Active',
    description: 'Main morning route covering east side',
  },
  {
    id: '2',
    routeName: 'Morning Route B',
    routeNumber: 'R002',
    startPoint: 'School',
    endPoint: 'Residential Area B',
    distance: 20.0,
    stops: 10,
    assignedBusId: '2',
    assignedBusNumber: 'BUS-002',
    departureTime: '07:15',
    arrivalTime: '08:15',
    status: 'Active',
    description: 'Secondary morning route covering west side',
  },
]

export default function SchoolBusesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<'buses' | 'drivers' | 'routes' | 'map' | 'assignments' | 'settings'>('buses')

  // Buses State
  const [buses, setBuses] = useState<Bus[]>([])
  const [showBusModal, setShowBusModal] = useState(false)
  const [editingBusId, setEditingBusId] = useState<string | null>(null)
  const [busFormData, setBusFormData] = useState<BusFormData>(DEFAULT_BUS_FORM)
  const [busSearchTerm, setBusSearchTerm] = useState('')

  // Drivers State
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverFormData, setDriverFormData] = useState<DriverFormData>(DEFAULT_DRIVER_FORM)
  const [driverSearchTerm, setDriverSearchTerm] = useState('')

  // Routes State
  const [routes, setRoutes] = useState<Route[]>([])
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null)
  const [routeFormData, setRouteFormData] = useState<RouteFormData>(DEFAULT_ROUTE_FORM)
  const [routeSearchTerm, setRouteSearchTerm] = useState('')

  // Student Assignments State
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([])
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [studentFormData, setStudentFormData] = useState<StudentAssignmentFormData>(DEFAULT_STUDENT_FORM)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')

  // Traccar State
  const [traccarPositions, setTraccarPositions] = useState<Map<number, TraccarPosition>>(new Map())
  const [traccarDevices, setTraccarDevices] = useState<TraccarDevice[]>([])
  const [traccarToken, setTraccarToken] = useState('')
  const [selectedBusForTracking, setSelectedBusForTracking] = useState<Bus | null>(null)

  // Traccar Settings State
  const [traccarUrl, setTraccarUrl] = useState('https://system.geotrack.com.np')
  const [traccarUsername, setTraccarUsername] = useState('')
  const [traccarPassword, setTraccarPassword] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testConnectionMessage, setTestConnectionMessage] = useState('')

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
      const savedBuses = localStorage.getItem('buses')
      const savedDrivers = localStorage.getItem('drivers')
      const savedRoutes = localStorage.getItem('routes')
      const savedStudentAssignments = localStorage.getItem('studentAssignments')

      if (savedBuses) {
        try {
          setBuses(JSON.parse(savedBuses))
        } catch (error) {
          console.error('Failed to load buses:', error)
          setBuses(DEFAULT_BUSES)
        }
      } else {
        setBuses(DEFAULT_BUSES)
      }

      if (savedDrivers) {
        try {
          setDrivers(JSON.parse(savedDrivers))
        } catch (error) {
          console.error('Failed to load drivers:', error)
          setDrivers(DEFAULT_DRIVERS)
        }
      } else {
        setDrivers(DEFAULT_DRIVERS)
      }

      if (savedRoutes) {
        try {
          setRoutes(JSON.parse(savedRoutes))
        } catch (error) {
          console.error('Failed to load routes:', error)
          setRoutes(DEFAULT_ROUTES)
        }
      } else {
        setRoutes(DEFAULT_ROUTES)
      }

      if (savedStudentAssignments) {
        try {
          setStudentAssignments(JSON.parse(savedStudentAssignments))
        } catch (error) {
          console.error('Failed to load student assignments:', error)
        }
      }

      // Load Traccar credentials
      const savedTraccarUrl = localStorage.getItem('traccarUrl')
      const savedTraccarUsername = localStorage.getItem('traccarUsername')
      const savedTraccarPassword = localStorage.getItem('traccarPassword')

      if (savedTraccarUrl) setTraccarUrl(savedTraccarUrl)
      if (savedTraccarUsername) setTraccarUsername(savedTraccarUsername)
      if (savedTraccarPassword) setTraccarPassword(savedTraccarPassword)

      if (savedTraccarUrl && savedTraccarUsername && savedTraccarPassword) {
        setSettingsSaved(true)
      }

      setIsHydrated(true)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('buses', JSON.stringify(buses))
      localStorage.setItem('drivers', JSON.stringify(drivers))
      localStorage.setItem('routes', JSON.stringify(routes))
      localStorage.setItem('studentAssignments', JSON.stringify(studentAssignments))
    }
  }, [buses, drivers, routes, studentAssignments, isHydrated])

  // Traccar API Integration
  const fetchTraccarToken = async () => {
    try {
      // Get credentials from localStorage
      const savedUrl = localStorage.getItem('traccarUrl') || traccarUrl
      const savedUsername = localStorage.getItem('traccarUsername')
      const savedPassword = localStorage.getItem('traccarPassword')

      if (!savedUsername || !savedPassword) {
        console.error('Traccar credentials not configured')
        return null
      }

      const credentials = btoa(`${savedUsername}:${savedPassword}`)

      const response = await fetch(`${savedUrl}/api/session/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `expiration=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`,
      })

      if (response.ok) {
        const token = await response.text()
        setTraccarToken(token)
        localStorage.setItem('traccarToken', token)
        return token
      }
    } catch (error) {
      console.error('Failed to fetch Traccar token:', error)
    }
    return null
  }

  const fetchTraccarDevices = async () => {
    try {
      let token = traccarToken
      if (!token) {
        token = localStorage.getItem('traccarToken') || ''
        if (!token) {
          token = (await fetchTraccarToken()) || ''
        }
      }

      // Get URL from localStorage
      const savedUrl = localStorage.getItem('traccarUrl') || traccarUrl

      const response = await fetch(`${savedUrl}/api/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const devices = await response.json()
        setTraccarDevices(devices)
        console.log('Available Traccar devices:', devices)
        return devices
      } else {
        console.error('Failed to fetch devices:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch Traccar devices:', error)
    }
    return []
  }

  const fetchTraccarDevicePosition = async (deviceId: string) => {
    try {
      // Use the transport-service proxy instead of calling Traccar directly
      const response = await transportAPI.proxyTraccar('GET', `/api/positions?deviceId=${deviceId}`)

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setTraccarPositions((prev) => new Map(prev).set(parseInt(deviceId), response.data[0]))
      } else {
        console.warn(`No positions found for device ${deviceId}. Response:`, response.data)
      }
    } catch (error) {
      console.error(`Failed to fetch position for device ${deviceId}:`, error)
    }
  }

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  // Bus Handlers
  const handleAddBus = () => {
    setEditingBusId(null)
    setBusFormData(DEFAULT_BUS_FORM)
    setShowBusModal(true)
  }

  const handleEditBus = (bus: Bus) => {
    setEditingBusId(bus.id)
    setBusFormData({
      busNumber: bus.busNumber,
      registrationNo: bus.registrationNo,
      model: bus.model,
      capacity: bus.capacity,
      driverId: bus.driverId,
      routeId: bus.routeId,
      status: bus.status,
      purchaseDate: bus.purchaseDate,
      lastServiceDate: bus.lastServiceDate,
      traccarDeviceId: bus.traccarDeviceId,
      description: bus.description,
    })
    setShowBusModal(true)
  }

  const handleSaveBus = async () => {
    if (!busFormData.busNumber.trim() || !busFormData.registrationNo.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const busData = {
        bus_number: busFormData.busNumber,
        registration_no: busFormData.registrationNo,
        model: busFormData.model,
        capacity: busFormData.capacity,
        driver_id: busFormData.driverId || null,
        route_id: busFormData.routeId || null,
        status: busFormData.status,
        purchase_date: busFormData.purchaseDate || null,
        last_service_date: busFormData.lastServiceDate || null,
        traccar_device_id: busFormData.traccarDeviceId || null,
        description: busFormData.description,
      }

      if (editingBusId) {
        // Update existing bus
        await transportAPI.updateBus(editingBusId, busData)
        alert('Bus updated successfully!')
      } else {
        // Create new bus
        await transportAPI.createBus(busData)
        alert('Bus created successfully!')
      }

      setShowBusModal(false)
      setBusFormData(DEFAULT_BUS_FORM)
      setEditingBusId(null)

      // Refresh the bus list from server
    } catch (error) {
      console.error('Failed to save bus:', error)
      alert('Failed to save bus. Please try again.')
    }
  }

  const handleDeleteBus = (id: string) => {
    if (confirm('Are you sure you want to delete this bus?')) {
      setBuses((prev) => prev.filter((bus) => bus.id !== id))
    }
  }

  // Driver Handlers
  const handleAddDriver = () => {
    setEditingDriverId(null)
    setDriverFormData(DEFAULT_DRIVER_FORM)
    setShowDriverModal(true)
  }

  const handleEditDriver = (driver: Driver) => {
    setEditingDriverId(driver.id)
    setDriverFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      assignedBusId: driver.assignedBusId,
      status: driver.status,
      joinDate: driver.joinDate,
      address: driver.address,
      emergencyContact: driver.emergencyContact,
    })
    setShowDriverModal(true)
  }

  const handleSaveDriver = () => {
    if (!driverFormData.name.trim() || !driverFormData.email.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (editingDriverId) {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === editingDriverId
            ? {
              ...driver,
              name: driverFormData.name,
              email: driverFormData.email,
              phone: driverFormData.phone,
              licenseNumber: driverFormData.licenseNumber,
              licenseExpiry: driverFormData.licenseExpiry,
              assignedBusId: driverFormData.assignedBusId,
              assignedBusNumber: buses.find((b) => b.id === driverFormData.assignedBusId)?.busNumber || '',
              status: driverFormData.status,
              joinDate: driverFormData.joinDate,
              address: driverFormData.address,
              emergencyContact: driverFormData.emergencyContact,
            }
            : driver
        )
      )
    } else {
      const newDriver: Driver = {
        id: Date.now().toString(),
        name: driverFormData.name,
        email: driverFormData.email,
        phone: driverFormData.phone,
        licenseNumber: driverFormData.licenseNumber,
        licenseExpiry: driverFormData.licenseExpiry,
        assignedBusId: driverFormData.assignedBusId,
        assignedBusNumber: buses.find((b) => b.id === driverFormData.assignedBusId)?.busNumber || '',
        status: driverFormData.status,
        joinDate: driverFormData.joinDate,
        address: driverFormData.address,
        emergencyContact: driverFormData.emergencyContact,
      }
      setDrivers((prev) => [newDriver, ...prev])
    }

    setShowDriverModal(false)
    setDriverFormData(DEFAULT_DRIVER_FORM)
  }

  const handleDeleteDriver = (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      setDrivers((prev) => prev.filter((driver) => driver.id !== id))
    }
  }

  // Route Handlers
  const handleAddRoute = () => {
    setEditingRouteId(null)
    setRouteFormData(DEFAULT_ROUTE_FORM)
    setShowRouteModal(true)
  }

  const handleEditRoute = (route: Route) => {
    setEditingRouteId(route.id)
    setRouteFormData({
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance,
      stops: route.stops,
      assignedBusId: route.assignedBusId,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      status: route.status,
      description: route.description,
    })
    setShowRouteModal(true)
  }

  const handleSaveRoute = () => {
    if (!routeFormData.routeName.trim() || !routeFormData.routeNumber.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (editingRouteId) {
      setRoutes((prev) =>
        prev.map((route) =>
          route.id === editingRouteId
            ? {
              ...route,
              routeName: routeFormData.routeName,
              routeNumber: routeFormData.routeNumber,
              startPoint: routeFormData.startPoint,
              endPoint: routeFormData.endPoint,
              distance: routeFormData.distance,
              stops: routeFormData.stops,
              assignedBusId: routeFormData.assignedBusId,
              assignedBusNumber: buses.find((b) => b.id === routeFormData.assignedBusId)?.busNumber || '',
              departureTime: routeFormData.departureTime,
              arrivalTime: routeFormData.arrivalTime,
              status: routeFormData.status,
              description: routeFormData.description,
            }
            : route
        )
      )
    } else {
      const newRoute: Route = {
        id: Date.now().toString(),
        routeName: routeFormData.routeName,
        routeNumber: routeFormData.routeNumber,
        startPoint: routeFormData.startPoint,
        endPoint: routeFormData.endPoint,
        distance: routeFormData.distance,
        stops: routeFormData.stops,
        assignedBusId: routeFormData.assignedBusId,
        assignedBusNumber: buses.find((b) => b.id === routeFormData.assignedBusId)?.busNumber || '',
        departureTime: routeFormData.departureTime,
        arrivalTime: routeFormData.arrivalTime,
        status: routeFormData.status,
        description: routeFormData.description,
      }
      setRoutes((prev) => [newRoute, ...prev])
    }

    setShowRouteModal(false)
    setRouteFormData(DEFAULT_ROUTE_FORM)
  }

  const handleDeleteRoute = (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      setRoutes((prev) => prev.filter((route) => route.id !== id))
    }
  }

  // Student Assignment Handlers
  const handleAddStudent = () => {
    setEditingStudentId(null)
    setStudentFormData(DEFAULT_STUDENT_FORM)
    setShowStudentModal(true)
  }

  const handleEditStudent = (assignment: StudentAssignment) => {
    setEditingStudentId(assignment.id)
    setStudentFormData({
      studentName: assignment.studentName,
      studentId: assignment.studentId,
      busId: assignment.busId,
      routeId: assignment.routeId,
      pickupStop: assignment.pickupStop,
      dropoffStop: assignment.dropoffStop,
      status: assignment.status,
    })
    setShowStudentModal(true)
  }

  const handleSaveStudent = () => {
    if (!studentFormData.studentName.trim() || !studentFormData.busId) {
      alert('Please fill in all required fields')
      return
    }

    if (editingStudentId) {
      setStudentAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === editingStudentId
            ? {
              ...assignment,
              studentName: studentFormData.studentName,
              studentId: studentFormData.studentId,
              busId: studentFormData.busId,
              busNumber: buses.find((b) => b.id === studentFormData.busId)?.busNumber || '',
              routeId: studentFormData.routeId,
              routeName: routes.find((r) => r.id === studentFormData.routeId)?.routeName || '',
              pickupStop: studentFormData.pickupStop,
              dropoffStop: studentFormData.dropoffStop,
              status: studentFormData.status,
            }
            : assignment
        )
      )
    } else {
      const newAssignment: StudentAssignment = {
        id: Date.now().toString(),
        studentName: studentFormData.studentName,
        studentId: studentFormData.studentId,
        busId: studentFormData.busId,
        busNumber: buses.find((b) => b.id === studentFormData.busId)?.busNumber || '',
        routeId: studentFormData.routeId,
        routeName: routes.find((r) => r.id === studentFormData.routeId)?.routeName || '',
        pickupStop: studentFormData.pickupStop,
        dropoffStop: studentFormData.dropoffStop,
        status: studentFormData.status,
      }
      setStudentAssignments((prev) => [newAssignment, ...prev])

      // Update bus student count
      setBuses((prev) =>
        prev.map((bus) =>
          bus.id === studentFormData.busId ? { ...bus, currentStudents: bus.currentStudents + 1 } : bus
        )
      )
    }

    setShowStudentModal(false)
    setStudentFormData(DEFAULT_STUDENT_FORM)
  }

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      const assignment = studentAssignments.find((a) => a.id === id)
      if (assignment) {
        setBuses((prev) =>
          prev.map((bus) =>
            bus.id === assignment.busId ? { ...bus, currentStudents: Math.max(0, bus.currentStudents - 1) } : bus
          )
        )
      }
      setStudentAssignments((prev) => prev.filter((a) => a.id !== id))
    }
  }

  // Traccar Settings Handlers
  const handleSaveTraccarSettings = () => {
    if (!traccarUrl || !traccarUsername || !traccarPassword) {
      alert('Please fill in all Traccar credentials')
      return
    }

    localStorage.setItem('traccarUrl', traccarUrl)
    localStorage.setItem('traccarUsername', traccarUsername)
    localStorage.setItem('traccarPassword', traccarPassword)

    setSettingsSaved(true)
    setTestConnectionStatus('idle')
    alert('Traccar settings saved successfully!')
  }

  const handleTestTraccarConnection = async () => {
    if (!traccarUrl || !traccarUsername || !traccarPassword) {
      alert('Please fill in all Traccar credentials first')
      return
    }

    setTestConnectionStatus('testing')
    setTestConnectionMessage('Testing connection...')

    try {
      // Generate token using Basic auth
      const credentials = btoa(`${traccarUsername}:${traccarPassword}`)

      const response = await fetch(`${traccarUrl}/api/session/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (response.ok) {
        const token = await response.text()
        setTraccarToken(token)
        localStorage.setItem('traccarToken', token)
        setTestConnectionStatus('success')
        setTestConnectionMessage('✅ Connection successful! Token generated.')
      } else {
        setTestConnectionStatus('error')
        setTestConnectionMessage(`❌ Connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setTestConnectionStatus('error')
      setTestConnectionMessage(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Filter functions
  const filteredBuses = buses.filter(
    (bus) =>
      bus.busNumber.toLowerCase().includes(busSearchTerm.toLowerCase()) ||
      bus.registrationNo.toLowerCase().includes(busSearchTerm.toLowerCase())
  )

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(driverSearchTerm.toLowerCase())
  )

  const filteredRoutes = routes.filter(
    (route) =>
      route.routeName.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
      route.routeNumber.toLowerCase().includes(routeSearchTerm.toLowerCase())
  )

  const filteredStudents = studentAssignments.filter(
    (assignment) =>
      assignment.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      assignment.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase())
  )

  // Statistics
  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0)
  const totalStudents = buses.reduce((sum, b) => sum + b.currentStudents, 0)
  const activeDrivers = drivers.filter((d) => d.status === 'Active').length

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content */}
      <div className="flex flex-1">
        <Sidebar userRole={user?.role} />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">School Bus Management</h2>
            <p className="text-gray-600 mb-8">Manage buses, drivers, routes, and student assignments with real-time GPS tracking</p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
                <h3 className="text-gray-500 text-sm font-medium">Total Buses</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{buses.length}</p>
                <p className="text-xs text-gray-600 mt-1">Active: {activeBuses}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
                <h3 className="text-gray-500 text-sm font-medium">Active Drivers</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeDrivers}</p>
                <p className="text-xs text-gray-600 mt-1">Total: {drivers.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-600">
                <h3 className="text-gray-500 text-sm font-medium">Student Capacity</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">{totalStudents}</p>
                <p className="text-xs text-gray-600 mt-1">of {totalCapacity}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
                <h3 className="text-gray-500 text-sm font-medium">Total Routes</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{routes.length}</p>
                <p className="text-xs text-gray-600 mt-1">Active: {routes.filter((r) => r.status === 'Active').length}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {[
                  { key: 'buses', label: 'Buses', icon: '🚌' },
                  { key: 'drivers', label: 'Drivers', icon: '👨‍💼' },
                  { key: 'routes', label: 'Routes', icon: '🛣️' },
                  { key: 'tracking', label: 'Live Tracking', icon: '📍' },
                  { key: 'students', label: 'Student Assignments', icon: '👨‍🎓' },
                  { key: 'settings', label: 'Traccar Settings', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${activeTab === tab.key
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Buses Tab */}
              {activeTab === 'buses' && (
                <div className="p-6">
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search buses..."
                      value={busSearchTerm}
                      onChange={(e) => setBusSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddBus}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      + Add Bus
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus No.</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registration</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Driver</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Capacity</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBuses.map((bus) => (
                          <tr key={bus.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{bus.busNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{bus.registrationNo}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{bus.driverName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{bus.routeName}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${bus.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : bus.status === 'Maintenance'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {bus.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {bus.currentStudents}/{bus.capacity}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditBus(bus)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteBus(bus.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Drivers Tab */}
              {activeTab === 'drivers' && (
                <div className="p-6">
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search drivers..."
                      value={driverSearchTerm}
                      onChange={(e) => setDriverSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddDriver}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      + Add Driver
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">License No.</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned Bus</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDrivers.map((driver) => (
                          <tr key={driver.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{driver.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{driver.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{driver.phone}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{driver.licenseNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{driver.assignedBusNumber}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${driver.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : driver.status === 'On Leave'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditDriver(driver)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(driver.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Routes Tab */}
              {activeTab === 'routes' && (
                <div className="p-6">
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search routes..."
                      value={routeSearchTerm}
                      onChange={(e) => setRouteSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddRoute}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      + Add Route
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">From - To</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Distance</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stops</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoutes.map((route) => (
                          <tr key={route.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{route.routeName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {route.startPoint} → {route.endPoint}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{route.distance} km</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{route.stops}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{route.assignedBusNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {route.departureTime} - {route.arrivalTime}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${route.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {route.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditRoute(route)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteRoute(route.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Live Tracking Tab */}
              {activeTab === 'map' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Live Tracking</h3>
                    <p className="text-sm text-gray-600 mb-4">Integration with Traccar API for real-time GPS tracking</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> Make sure each bus has the correct <strong>Traccar Device ID</strong> (numeric ID like 123, NOT IMEI).
                        Edit the bus to find devices and get the correct ID.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchTraccarToken()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                      >
                        Connect to Traccar
                      </button>
                      <button
                        onClick={() => {
                          buses.forEach(bus => {
                            if (bus.traccarDeviceId && bus.traccarDeviceId.trim()) {
                              fetchTraccarDevicePosition(bus.traccarDeviceId)
                            }
                          })
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                      >
                        Refresh All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {buses.map((bus) => {
                        const position = traccarPositions.get(parseInt(bus.traccarDeviceId))
                        return (
                          <div key={bus.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-semibold text-gray-900">{bus.busNumber}</h4>
                                <p className="text-sm text-gray-600">{bus.registrationNo}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${position
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                                  }`}
                              >
                                {position ? 'Online' : 'Offline'}
                              </span>
                            </div>

                            {position ? (
                              <div className="space-y-2 text-sm">
                                <p>
                                  <span className="font-semibold">Location:</span> {position.latitude}, {position.longitude}
                                </p>
                                <p>
                                  <span className="font-semibold">Speed:</span> {position.speed} knots
                                </p>
                                <p>
                                  <span className="font-semibold">Address:</span> {position.address}
                                </p>
                                <p>
                                  <span className="font-semibold">Last Update:</span> {position.serverTime}
                                </p>
                                {position.attributes?.battery && (
                                  <p>
                                    <span className="font-semibold">Battery:</span> {position.attributes.battery}%
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {!bus.traccarDeviceId || bus.traccarDeviceId.trim() === '' ? (
                                  <div className="bg-red-50 p-3 rounded border border-red-200">
                                    <p className="text-red-700 font-semibold">❌ No Device ID configured</p>
                                    <p className="text-red-600 text-xs mt-1">
                                      Edit this bus and add the Traccar Device ID (numeric ID, not IMEI)
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                    <p className="text-orange-700 font-semibold">⚠️ No tracking data</p>
                                    <p className="text-orange-600 text-xs mt-1">Device ID: {bus.traccarDeviceId}</p>
                                    <p className="text-orange-600 text-xs mt-1">
                                      This could mean: GPS is offline, wrong Device ID, or device hasn't reported yet.
                                    </p>
                                    <button
                                      onClick={() => fetchTraccarDevicePosition(bus.traccarDeviceId)}
                                      className="mt-2 px-3 py-1 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 text-xs font-semibold transition"
                                    >
                                      Retry Refresh
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Student Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="p-6">
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search student assignments..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddStudent}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      + Assign Student
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pickup - Dropoff</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((assignment) => (
                          <tr key={assignment.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{assignment.studentName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{assignment.studentId}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{assignment.busNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{assignment.routeName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {assignment.pickupStop} → {assignment.dropoffStop}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                                  }`}
                              >
                                {assignment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditStudent(assignment)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(assignment.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Traccar GPS Tracking Settings</h3>
                    <p className="text-gray-600 mb-6">Configure your Traccar server credentials to enable live GPS tracking for buses.</p>

                    {settingsSaved && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold">✅ Settings Saved</p>
                        <p className="text-green-700 text-sm mt-1">Your Traccar credentials have been saved locally.</p>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Traccar Server URL *
                        </label>
                        <input
                          type="text"
                          placeholder="https://system.geotrack.com.np"
                          value={traccarUrl}
                          onChange={(e) => setTraccarUrl(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Default Traccar server URL (pre-filled)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Username (Email) *
                        </label>
                        <input
                          type="email"
                          placeholder="e.g., admin@example.com"
                          value={traccarUsername}
                          onChange={(e) => setTraccarUsername(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Your Traccar account email</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your password"
                          value={traccarPassword}
                          onChange={(e) => setTraccarPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Your Traccar account password</p>
                      </div>

                      <div className="pt-4 border-t border-gray-200 flex gap-3">
                        <button
                          onClick={handleSaveTraccarSettings}
                          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                        >
                          💾 Save Settings
                        </button>
                        <button
                          onClick={handleTestTraccarConnection}
                          disabled={testConnectionStatus === 'testing'}
                          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${testConnectionStatus === 'testing'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        >
                          {testConnectionStatus === 'testing' ? '🔄 Testing...' : '🔌 Test Connection'}
                        </button>
                      </div>

                      {testConnectionMessage && (
                        <div className={`p-4 rounded-lg ${testConnectionStatus === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : testConnectionStatus === 'error'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-blue-50 border border-blue-200'
                          }`}>
                          <p className={`font-semibold ${testConnectionStatus === 'success'
                            ? 'text-green-800'
                            : testConnectionStatus === 'error'
                              ? 'text-red-800'
                              : 'text-blue-800'
                            }`}>
                            {testConnectionMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">📚 API Documentation</h4>
                      <p className="text-sm text-blue-800 mb-2">The system uses Traccar API with Bearer token authentication:</p>
                      <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                        <li>Token is generated using your username and password</li>
                        <li>Token is valid for 7 days by default</li>
                        <li>All device and position data is fetched using the token</li>
                        <li>Configure device IDs in the "Buses" tab to link buses to GPS trackers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Bus Modal */}
      {showBusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBusId ? 'Edit Bus' : 'Add New Bus'}
              </h3>
              <button
                onClick={() => setShowBusModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bus Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., BUS-001"
                    value={busFormData.busNumber}
                    onChange={(e) => setBusFormData({ ...busFormData, busNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration No. *</label>
                  <input
                    type="text"
                    placeholder="e.g., MH01AB1234"
                    value={busFormData.registrationNo}
                    onChange={(e) => setBusFormData({ ...busFormData, registrationNo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={busFormData.model}
                    onChange={(e) => setBusFormData({ ...busFormData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity</label>
                  <input
                    type="number"
                    value={busFormData.capacity}
                    onChange={(e) => setBusFormData({ ...busFormData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver</label>
                  <select
                    value={busFormData.driverId}
                    onChange={(e) => setBusFormData({ ...busFormData, driverId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                  <select
                    value={busFormData.routeId}
                    onChange={(e) => setBusFormData({ ...busFormData, routeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={busFormData.purchaseDate}
                    onChange={(e) => setBusFormData({ ...busFormData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Service Date</label>
                  <input
                    type="date"
                    value={busFormData.lastServiceDate}
                    onChange={(e) => setBusFormData({ ...busFormData, lastServiceDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Traccar Device ID (Numeric ID from Traccar, NOT IMEI)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., 123"
                      value={busFormData.traccarDeviceId}
                      onChange={(e) => setBusFormData({ ...busFormData, traccarDeviceId: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const devices = await fetchTraccarDevices()
                        if (devices.length > 0) {
                          alert(`Found ${devices.length} devices. Check browser console for details:\n\n${devices.map(d => `ID: ${d.id}, Name: ${d.name}, IMEI: ${d.uniqueId}`).join('\n')}`)
                        } else {
                          alert('No devices found or authentication failed. Make sure you\'re connected to Traccar.')
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition whitespace-nowrap"
                    >
                      Find Devices
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Click "Find Devices" to see all registered GPS devices with their IDs and IMEIs
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={busFormData.status}
                    onChange={(e) => setBusFormData({ ...busFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={busFormData.description}
                  onChange={(e) => setBusFormData({ ...busFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBusModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Save Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDriverId ? 'Edit Driver' : 'Add New Driver'}
              </h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={driverFormData.name}
                    onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={driverFormData.email}
                    onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={driverFormData.phone}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={driverFormData.licenseNumber}
                    onChange={(e) => setDriverFormData({ ...driverFormData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiry</label>
                  <input
                    type="date"
                    value={driverFormData.licenseExpiry}
                    onChange={(e) => setDriverFormData({ ...driverFormData, licenseExpiry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Bus</label>
                  <select
                    value={driverFormData.assignedBusId}
                    onChange={(e) => setDriverFormData({ ...driverFormData, assignedBusId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
                  <input
                    type="date"
                    value={driverFormData.joinDate}
                    onChange={(e) => setDriverFormData({ ...driverFormData, joinDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={driverFormData.status}
                    onChange={(e) => setDriverFormData({ ...driverFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={driverFormData.address}
                  onChange={(e) => setDriverFormData({ ...driverFormData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="tel"
                  value={driverFormData.emergencyContact}
                  onChange={(e) => setDriverFormData({ ...driverFormData, emergencyContact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDriver}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Save Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRouteId ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button
                onClick={() => setShowRouteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Morning Route A"
                    value={routeFormData.routeName}
                    onChange={(e) => setRouteFormData({ ...routeFormData, routeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., R001"
                    value={routeFormData.routeNumber}
                    onChange={(e) => setRouteFormData({ ...routeFormData, routeNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Point</label>
                  <input
                    type="text"
                    value={routeFormData.startPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, startPoint: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Point</label>
                  <input
                    type="text"
                    value={routeFormData.endPoint}
                    onChange={(e) => setRouteFormData({ ...routeFormData, endPoint: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={routeFormData.distance}
                    onChange={(e) => setRouteFormData({ ...routeFormData, distance: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stops</label>
                  <input
                    type="number"
                    value={routeFormData.stops}
                    onChange={(e) => setRouteFormData({ ...routeFormData, stops: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Bus</label>
                  <select
                    value={routeFormData.assignedBusId}
                    onChange={(e) => setRouteFormData({ ...routeFormData, assignedBusId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Departure Time</label>
                  <input
                    type="time"
                    value={routeFormData.departureTime}
                    onChange={(e) => setRouteFormData({ ...routeFormData, departureTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Arrival Time</label>
                  <input
                    type="time"
                    value={routeFormData.arrivalTime}
                    onChange={(e) => setRouteFormData({ ...routeFormData, arrivalTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={routeFormData.status}
                    onChange={(e) => setRouteFormData({ ...routeFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={routeFormData.description}
                  onChange={(e) => setRouteFormData({ ...routeFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowRouteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoute}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStudentId ? 'Edit Assignment' : 'Assign Student to Bus'}
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={studentFormData.studentName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, studentName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={studentFormData.studentId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bus *</label>
                  <select
                    value={studentFormData.busId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, busId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busNumber} ({bus.currentStudents}/{bus.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                  <select
                    value={studentFormData.routeId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, routeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Stop</label>
                  <input
                    type="text"
                    value={studentFormData.pickupStop}
                    onChange={(e) => setStudentFormData({ ...studentFormData, pickupStop: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dropoff Stop</label>
                  <input
                    type="text"
                    value={studentFormData.dropoffStop}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dropoffStop: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={studentFormData.status}
                    onChange={(e) => setStudentFormData({ ...studentFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
