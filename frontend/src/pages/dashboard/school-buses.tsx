import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { transportAPI, studentAPI } from '@/services/api'
// Removed unused NepaliDatePicker import

// Type Definitions
interface Bus {
  id: string
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
  createdAt: string
  updatedAt: string
}

interface Driver {
  id: string
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

interface Route {
  id: string
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

interface StudentAssignment {
  id: string
  studentId: string
  studentName: string
  busId: string
  routeId: string
  pickupStop: string
  dropoffStop: string
  status: 'Active' | 'Inactive'
}

interface MaintenanceRecord {
  id: string
  busId: string
  serviceDate: string
  description: string
  cost: number
  performedBy: string
  nextServiceDate: string
}

interface FuelLog {
  id: string
  busId: string
  date: string
  fuelQuantity: number
  cost: number
  odometerReading: number
  filledBy: string
  remarks: string
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

interface MaintenanceFormData {
  busId: string
  serviceDate: string
  description: string
  cost: number
  performedBy: string
  nextServiceDate: string
}

interface FuelFormData {
  busId: string
  date: string
  fuelQuantity: number
  cost: number
  odometerReading: number
  filledBy: string
  remarks: string
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

const DEFAULT_MAINTENANCE_FORM: MaintenanceFormData = {
  busId: '',
  serviceDate: new Date().toISOString().split('T')[0],
  description: '',
  cost: 0,
  performedBy: '',
  nextServiceDate: '',
}

const DEFAULT_FUEL_FORM: FuelFormData = {
  busId: '',
  date: new Date().toISOString().split('T')[0],
  fuelQuantity: 0,
  cost: 0,
  odometerReading: 0,
  filledBy: '',
  remarks: '',
}

type TabType = 'buses' | 'drivers' | 'routes' | 'map' | 'assignments' | 'maintenance' | 'fuel' | 'settings'

export default function SchoolBusesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('buses')

  // Core Data State
  const [buses, setBuses] = useState<Bus[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])

  // Modal State
  const [showBusModal, setShowBusModal] = useState(false)
  const [editingBusId, setEditingBusId] = useState<string | null>(null)
  const [busFormData, setBusFormData] = useState<BusFormData>(DEFAULT_BUS_FORM)

  const [showDriverModal, setShowDriverModal] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [driverFormData, setDriverFormData] = useState<DriverFormData>(DEFAULT_DRIVER_FORM)

  const [showRouteModal, setShowRouteModal] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null)
  const [routeFormData, setRouteFormData] = useState<RouteFormData>(DEFAULT_ROUTE_FORM)

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [studentFormData, setStudentFormData] = useState<StudentAssignmentFormData>(DEFAULT_STUDENT_FORM)

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceFormData, setMaintenanceFormData] = useState<MaintenanceFormData>(DEFAULT_MAINTENANCE_FORM)

  const [showFuelModal, setShowFuelModal] = useState(false)
  const [fuelFormData, setFuelFormData] = useState<FuelFormData>(DEFAULT_FUEL_FORM)

  // Search Terms
  const [busSearchTerm, setBusSearchTerm] = useState('')
  const [driverSearchTerm, setDriverSearchTerm] = useState('')
  const [routeSearchTerm, setRouteSearchTerm] = useState('')
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [maintenanceSearchTerm, setMaintenanceSearchTerm] = useState('')
  const [fuelSearchTerm, setFuelSearchTerm] = useState('')

  // Traccar State
  const [traccarPositions, setTraccarPositions] = useState<Map<number, TraccarPosition>>(new Map())
  const [traccarDevices, setTraccarDevices] = useState<TraccarDevice[]>([])
  const [traccarToken, setTraccarToken] = useState('')
  const [traccarUrl, setTraccarUrl] = useState('')
  const [traccarUsername, setTraccarUsername] = useState('')
  const [traccarPassword, setTraccarPassword] = useState('')
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testConnectionMessage, setTestConnectionMessage] = useState('')

  // Load Data from API
  const fetchData = async () => {
    setLoading(true)
    try {
      const [busesRes, driversRes, routesRes, assignmentsRes, maintenanceRes, fuelRes, settingsRes, studentsRes] = await Promise.all([
        transportAPI.listBuses(),
        transportAPI.listDrivers(),
        transportAPI.listRoutes(),
        transportAPI.listAssignments(),
        transportAPI.listMaintenance(),
        transportAPI.listFuelLogs(),
        transportAPI.getSettings(),
        studentAPI.list()
      ])

      setBuses(busesRes.data || [])
      setDrivers(driversRes.data || [])
      setRoutes(routesRes.data || [])
      setStudentAssignments(assignmentsRes.data || [])
      setMaintenanceRecords(maintenanceRes.data || [])
      setFuelLogs(fuelRes.data || [])
      setAllStudents(studentsRes.data?.students || studentsRes.data || [])

      if (settingsRes.data) {
        setTraccarUrl(settingsRes.data.traccar_url || '')
        setTraccarUsername(settingsRes.data.traccar_username || '')
        setTraccarPassword(settingsRes.data.traccar_password || '')
      }
    } catch (error) {
      console.error('Failed to fetch transport data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsHydrated(true)
    if (user) {
      fetchData()
    } else if (typeof window !== 'undefined') {
      router.push('/auth/login')
    }
  }, [user])

  // Traccar Handlers
  const fetchTraccarToken = async () => {
    try {
      const res = await transportAPI.getTraccarToken()
      setTraccarToken(res.data)
      return res.data
    } catch (error) {
      console.error('Failed to fetch Traccar token:', error)
      return null
    }
  }

  const fetchTraccarDevices = async () => {
    try {
      const res = await transportAPI.proxyTraccar('GET', '/api/devices')
      if (res.data) {
        setTraccarDevices(res.data)
        return res.data
      }
    } catch (error) {
      console.error('Failed to fetch Traccar devices:', error)
    }
    return []
  }

  const fetchTraccarDevicePosition = async (deviceId: string) => {
    try {
      const res = await transportAPI.proxyTraccar('GET', `/api/positions?deviceId=${deviceId}`)
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTraccarPositions((prev) => new Map(prev).set(parseInt(deviceId), res.data[0]))
      }
    } catch (error) {
      console.error(`Failed to fetch position for device ${deviceId}:`, error)
    }
  }

  const handleTestTraccarConnection = async () => {
    setTestConnectionStatus('testing')
    setTestConnectionMessage('Testing connection via transport service...')
    try {
      const token = await fetchTraccarToken()
      if (token) {
        setTestConnectionStatus('success')
        setTestConnectionMessage('✅ Connection successful! Token generated.')
        fetchTraccarDevices()
      } else {
        setTestConnectionStatus('error')
        setTestConnectionMessage('❌ Connection failed. Check service logs.')
      }
    } catch (error) {
      setTestConnectionStatus('error')
      setTestConnectionMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSaveTraccarSettings = async () => {
    try {
      await transportAPI.updateSettings({
        traccar_url: traccarUrl,
        traccar_username: traccarUsername,
        traccar_password: traccarPassword
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings.')
    }
  }

  // CRUD Handlers - Bus
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
      alert('Required fields missing')
      return
    }
    try {
      const payload = {
        busNumber: busFormData.busNumber,
        registrationNo: busFormData.registrationNo,
        model: busFormData.model,
        capacity: busFormData.capacity,
        driverId: busFormData.driverId || null,
        routeId: busFormData.routeId || null,
        status: busFormData.status,
        purchaseDate: busFormData.purchaseDate ? new Date(busFormData.purchaseDate).toISOString() : null,
        lastServiceDate: busFormData.lastServiceDate ? new Date(busFormData.lastServiceDate).toISOString() : null,
        traccarDeviceId: busFormData.traccarDeviceId,
        description: busFormData.description
      }

      if (editingBusId) {
        await transportAPI.updateBus(editingBusId, payload)
      } else {
        await transportAPI.createBus(payload)
      }
      setShowBusModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to save bus.')
    }
  }

  const handleDeleteBus = async (id: string) => {
    if (confirm('Delete this bus?')) {
      try {
        await transportAPI.deleteBus(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete bus.')
      }
    }
  }

  // CRUD Handlers - Driver
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
      licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
      assignedBusId: driver.assignedBusId,
      status: driver.status,
      joinDate: driver.joinDate ? new Date(driver.joinDate).toISOString().split('T')[0] : '',
      address: driver.address,
      emergencyContact: driver.emergencyContact,
    })
    setShowDriverModal(true)
  }

  const handleSaveDriver = async () => {
    if (!driverFormData.name.trim() || !driverFormData.phone.trim()) {
      alert('Name and Phone are required')
      return
    }
    try {
      const payload = {
        ...driverFormData,
        licenseExpiry: driverFormData.licenseExpiry ? new Date(driverFormData.licenseExpiry).toISOString() : null,
        joinDate: driverFormData.joinDate ? new Date(driverFormData.joinDate).toISOString() : null,
      }

      if (editingDriverId) {
        await transportAPI.updateDriver(editingDriverId, payload)
      } else {
        await transportAPI.createDriver(payload)
      }
      setShowDriverModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to save driver.')
    }
  }

  const handleDeleteDriver = async (id: string) => {
    if (confirm('Delete this driver?')) {
      try {
        await transportAPI.deleteDriver(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete driver.')
      }
    }
  }

  // CRUD Handlers - Route
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

  const handleSaveRoute = async () => {
    if (!routeFormData.routeName.trim() || !routeFormData.routeNumber.trim()) {
      alert('Route Name and Number are required')
      return
    }
    try {
      if (editingRouteId) {
        await transportAPI.updateRoute(editingRouteId, routeFormData)
      } else {
        await transportAPI.createRoute(routeFormData)
      }
      setShowRouteModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to save route.')
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (confirm('Delete this route?')) {
      try {
        await transportAPI.deleteRoute(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete route.')
      }
    }
  }

  // CRUD Handlers - Assignment
  const handleAddAssignment = () => {
    setEditingStudentId(null)
    setStudentFormData(DEFAULT_STUDENT_FORM)
    setShowStudentModal(true)
  }

  const handleSaveAssignment = async () => {
    if (!studentFormData.studentId || !studentFormData.busId) {
      alert('Student and Bus are required')
      return
    }
    try {
      await transportAPI.createAssignment(studentFormData)
      setShowStudentModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to save assignment.')
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Delete this assignment?')) {
      try {
        await transportAPI.deleteAssignment(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete assignment.')
      }
    }
  }

  // CRUD Handlers - Maintenance
  const handleAddMaintenance = (busId?: string) => {
    setMaintenanceFormData({ ...DEFAULT_MAINTENANCE_FORM, busId: busId || '' })
    setShowMaintenanceModal(true)
  }

  const handleSaveMaintenance = async () => {
    if (!maintenanceFormData.busId || !maintenanceFormData.description) {
      alert('Missing bus or description')
      return
    }
    try {
      await transportAPI.createMaintenance({
        ...maintenanceFormData,
        serviceDate: new Date(maintenanceFormData.serviceDate).toISOString(),
        nextServiceDate: maintenanceFormData.nextServiceDate ? new Date(maintenanceFormData.nextServiceDate).toISOString() : null
      })
      setShowMaintenanceModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to record maintenance.')
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    if (confirm('Delete this record?')) {
      try {
        await transportAPI.deleteMaintenance(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete maintenance record.')
      }
    }
  }

  // CRUD Handlers - Fuel
  const handleAddFuel = (busId?: string) => {
    setFuelFormData({ ...DEFAULT_FUEL_FORM, busId: busId || '' })
    setShowFuelModal(true)
  }

  const handleSaveFuel = async () => {
    if (!fuelFormData.busId || fuelFormData.fuelQuantity <= 0) {
      alert('Invalid data')
      return
    }
    try {
      await transportAPI.createFuelLog({
        ...fuelFormData,
        date: new Date(fuelFormData.date).toISOString()
      })
      setShowFuelModal(false)
      fetchData()
    } catch (error) {
      alert('Failed to record fuel log.')
    }
  }

  const handleDeleteFuel = async (id: string) => {
    if (confirm('Delete this log?')) {
      try {
        await transportAPI.deleteFuelLog(id)
        fetchData()
      } catch (error) {
        alert('Failed to delete fuel log.')
      }
    }
  }

  // Helper mapping
  const getHelperData = (id: string, type: 'bus' | 'driver' | 'route') => {
    if (type === 'bus') return buses.find(b => b.id === id)?.busNumber || 'None'
    if (type === 'driver') return drivers.find(d => d.id === id)?.name || 'None'
    if (type === 'route') return routes.find(r => r.id === id)?.routeName || 'None'
    return 'None'
  }

  // Filtering
  const filteredBuses = buses.filter(b => b.busNumber.toLowerCase().includes(busSearchTerm.toLowerCase()) || b.registrationNo.toLowerCase().includes(busSearchTerm.toLowerCase()))
  const filteredDrivers = drivers.filter(d => d.name.toLowerCase().includes(driverSearchTerm.toLowerCase()))
  const filteredRoutes = routes.filter(r => r.routeName.toLowerCase().includes(routeSearchTerm.toLowerCase()))
  const filteredStudents = studentAssignments.filter(s => s.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase()))
  const filteredMaintenance = maintenanceRecords.filter(m => getHelperData(m.busId, 'bus').toLowerCase().includes(maintenanceSearchTerm.toLowerCase()))
  const filteredFuel = fuelLogs.filter(f => getHelperData(f.busId, 'bus').toLowerCase().includes(fuelSearchTerm.toLowerCase()))

  if (!isHydrated || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 py-8 px-6 pb-64 overflow-auto">
          <div className="">
            <header className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Advanced Transport Management
              </h1>
              <p className="text-gray-600">Enterprise fleet management with live GPS tracking and maintenance logs.</p>
            </header>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Fleet Size', value: buses.length, icon: '🚌', color: 'blue' },
                { label: 'Active Drivers', value: drivers.filter(d => d.status === 'Active').length, icon: '👨‍✈️', color: 'green' },
                { label: 'Fuel Expense', value: `रू ${fuelLogs.reduce((s, f) => s + f.cost, 0).toLocaleString()}`, icon: '⛽', color: 'orange' },
                { label: 'Active Routes', value: routes.length, icon: '🛣️', color: 'indigo' }
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className={`p-3 bg-${s.color}-50 rounded-xl text-2xl`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-10">
              <nav className="flex bg-gray-50/50 p-2 gap-1 overflow-x-auto border-b border-gray-100">
                {[
                  { id: 'buses', label: 'Buses', icon: '🚌' },
                  { id: 'drivers', label: 'Drivers', icon: '👨‍💼' },
                  { id: 'routes', label: 'Routes', icon: '🛣️' },
                  { id: 'assignments', label: 'Students', icon: '👨‍🎓' },
                  { id: 'maintenance', label: 'Maintenance', icon: '🛠️' },
                  { id: 'fuel', label: 'Fuel Logs', icon: '⛽' },
                  { id: 'map', label: 'Live Tracking', icon: '📍' },
                  { id: 'settings', label: 'Settings', icon: '⚙️' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as TabType)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                      }`}
                  >
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </nav>

              <div className="p-8">
                {/* Buses View */}
                {activeTab === 'buses' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search fleet by Number or Plate..."
                          value={busSearchTerm}
                          onChange={e => setBusSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleAddBus}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Add Bus
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Array.isArray(filteredBuses) && filteredBuses.map(bus => (
                        <div key={bus.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-200 transition hover:shadow-lg">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="text-xs font-black text-blue-600 uppercase mb-1">{bus.busNumber}</div>
                              <div className="text-xl font-bold text-gray-900">{bus.registrationNo}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${bus.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{bus.status}</span>
                          </div>
                          <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Model</span> <span className="text-gray-900 font-bold">{bus.model}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Driver</span> <span className="text-gray-900 font-bold">{getHelperData(bus.driverId, 'driver')}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">Route</span> <span className="text-gray-900 font-bold">{getHelperData(bus.routeId, 'route')}</span></div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditBus(bus)} className="flex-1 bg-white text-gray-700 border border-gray-200 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-50 transition">Edit</button>
                            <button onClick={() => handleDeleteBus(bus.id)} className="flex-1 bg-white text-red-600 border border-red-100 py-2.5 rounded-xl font-bold text-xs hover:bg-red-50 transition">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'maintenance' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search maintenance logs..."
                          value={maintenanceSearchTerm}
                          onChange={e => setMaintenanceSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={() => handleAddMaintenance()}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Log Service
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 table-container animate-in slide-in-from-bottom-4 duration-700">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Bus</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Service Date</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Performed By</th>
                            <th className="px-6 py-4 font-bold text-center text-sm uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(filteredMaintenance) && filteredMaintenance.map(m => (
                            <tr key={m.id} className="border-t border-gray-200 hover:bg-white transition">
                              <td className="px-6 py-4 font-bold text-blue-600">{getHelperData(m.busId, 'bus')}</td>
                              <td className="px-6 py-4 text-gray-900 font-medium">{new Date(m.serviceDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{m.description}</td>
                              <td className="px-6 py-4 font-black text-gray-900">रू {m.cost.toLocaleString()}</td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{m.performedBy}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDeleteMaintenance(m.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'fuel' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search fuel records..."
                          value={fuelSearchTerm}
                          onChange={e => setFuelSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={() => handleAddFuel()}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Log Fuel
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 table-container animate-in slide-in-from-bottom-4 duration-700">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Bus</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Quantity (L)</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Odometer</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Filled By</th>
                            <th className="px-6 py-4 font-bold text-center text-sm uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(filteredFuel) && filteredFuel.map(f => (
                            <tr key={f.id} className="border-t border-gray-200 hover:bg-white transition">
                              <td className="px-6 py-4 font-bold text-blue-600">{getHelperData(f.busId, 'bus')}</td>
                              <td className="px-6 py-4 text-gray-900 font-medium">{new Date(f.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-black text-gray-900">{f.fuelQuantity} L</td>
                              <td className="px-6 py-4 font-black text-green-700 font-mono">रू {f.cost.toLocaleString()}</td>
                              <td className="px-6 py-4 text-gray-500 font-medium">{f.odometerReading} km</td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{f.filledBy}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDeleteFuel(f.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-tighter">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Drivers View */}
                {activeTab === 'drivers' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-green-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search drivers by name or phone..."
                          value={driverSearchTerm}
                          onChange={e => setDriverSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleAddDriver}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Add Driver
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Array.isArray(filteredDrivers) && filteredDrivers.map(driver => (
                        <div key={driver.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-100 border border-gray-100 group hover:border-green-200 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-4 bg-green-50 rounded-2xl text-3xl group-hover:scale-110 transition-transform">👨‍✈️</div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${driver.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {driver.status}
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-gray-900 mb-1">{driver.name}</h3>
                          <p className="text-gray-500 text-sm font-bold mb-4">{driver.phone}</p>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                              <span className="text-gray-400">🪪</span> {driver.licenseNumber}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                              <span className="text-gray-400">🚌</span> {getHelperData(driver.assignedBusId, 'bus')}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4 border-t border-gray-50">
                            <button onClick={() => handleEditDriver(driver)} className="flex-1 bg-gray-50 text-gray-600 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition">Edit Details</button>
                            <button onClick={() => handleDeleteDriver(driver.id)} className="px-4 text-red-400 hover:text-red-600 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignments View */}
                {activeTab === 'assignments' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search assignments by student name..."
                          value={studentSearchTerm}
                          onChange={e => setStudentSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleAddAssignment}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Assign Student
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 table-container">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Bus</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Route</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Pickup Stop</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Dropoff Stop</th>
                            <th className="px-6 py-4 font-bold text-center text-sm uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(filteredStudents) && filteredStudents.map(asg => (
                            <tr key={asg.id} className="border-t border-gray-200 hover:bg-gray-50/50 transition">
                              <td className="px-6 py-4 font-bold text-gray-900">{asg.studentName}</td>
                              <td className="px-6 py-4 text-blue-600 font-bold">{getHelperData(asg.busId, 'bus')}</td>
                              <td className="px-6 py-4 text-indigo-600 font-bold">{getHelperData(asg.routeId, 'route')}</td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{asg.pickupStop}</td>
                              <td className="px-6 py-4 text-gray-600 font-medium">{asg.dropoffStop}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDeleteAssignment(asg.id)} className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'routes' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="relative group flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search routes by name or number..."
                          value={routeSearchTerm}
                          onChange={e => setRouteSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleAddRoute}
                        className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-xl">+</span> Add Route
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 table-container">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Number</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Route Name</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Path</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Stops</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Assigned Bus</th>
                            <th className="px-6 py-4 font-bold text-center text-sm uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(filteredRoutes) && filteredRoutes.map(route => (
                            <tr key={route.id} className="border-t border-gray-200 hover:bg-gray-50/50 transition">
                              <td className="px-6 py-4 font-black text-indigo-600">{route.routeNumber}</td>
                              <td className="px-6 py-4 font-bold text-gray-900">{route.routeName}</td>
                              <td className="px-6 py-4 text-gray-600 text-xs font-bold">
                                {route.startPoint} <span className="text-gray-300 mx-1">→</span> {route.endPoint}
                              </td>
                              <td className="px-6 py-4 font-black text-gray-500">{route.stops}</td>
                              <td className="px-6 py-4 text-gray-700 font-bold">{getHelperData(route.assignedBusId, 'bus')}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => handleEditRoute(route)} className="text-blue-500 hover:text-blue-700 font-bold text-[10px] uppercase">Edit</button>
                                  <button onClick={() => handleDeleteRoute(route.id)} className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'map' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">🛰️ Fleet Status <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">{traccarPositions.size} online</span></h3>
                      {Array.isArray(buses) && buses.map(bus => {
                        const pos = traccarPositions.get(parseInt(bus.traccarDeviceId))
                        return (
                          <div key={bus.id} className={`p-4 rounded-2xl border transition cursor-pointer ${pos ? 'bg-green-50/50 border-green-100 hover:bg-green-50' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-gray-900">{bus.busNumber}</div>
                              <div className={`w-2 h-2 rounded-full mt-1 ${pos ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                            </div>
                            {pos ? (
                              <div className="space-y-1 text-[11px] font-bold">
                                <div className="text-green-700">⚡ {pos.speed} knots • {pos.course}°</div>
                                <div className="text-gray-500 truncate">📍 {pos.address || 'Updating...'}</div>
                              </div>
                            ) : (
                              <div className="text-[11px] font-bold text-gray-400">Disconnected</div>
                            )}
                          </div>
                        )
                      })}
                      <button onClick={() => {
                        buses.forEach(b => b.traccarDeviceId && fetchTraccarDevicePosition(b.traccarDeviceId))
                      }} className="w-full bg-blue-600 text-white rounded-2xl py-3 font-black text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100 mt-4">🔄 Refresh Positions</button>
                    </aside>
                    <div className="md:col-span-3 bg-gray-900 rounded-[40px] shadow-inner relative flex items-center justify-center min-h-[600px] text-white">
                      <div className="text-center">
                        <div className="text-4xl mb-4">🗺️</div>
                        <div className="text-xl font-black mb-2">Interactive Map System Integration</div>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">Real-time Mapbox/Google Maps overlay would be initialized here with device positions.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings View */}
                {activeTab === 'settings' && (
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Fleet Provider Sync</h3>
                    <p className="text-gray-500 font-medium mb-10">Configure external GPS provider (Traccar) to enable enterprise-grade tracking features.</p>

                    <div className="space-y-6 bg-gray-50 p-10 rounded-[40px] border border-gray-100">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Provider URL</label>
                        <input type="text" value={traccarUrl} onChange={e => setTraccarUrl(e.target.value)} className="w-full bg-white border-none rounded-2xl px-6 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Username</label>
                          <input type="text" value={traccarUsername} onChange={e => setTraccarUsername(e.target.value)} className="w-full bg-white border-none rounded-2xl px-6 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                          <input type="password" value={traccarPassword} onChange={e => setTraccarPassword(e.target.value)} className="w-full bg-white border-none rounded-2xl px-6 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm" />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button onClick={handleSaveTraccarSettings} className="flex-1 bg-gray-900 text-white rounded-2xl py-4 font-black hover:bg-black transition shadow-xl">Apply Settings</button>
                        <button onClick={handleTestTraccarConnection} className="bg-green-600 text-white rounded-2xl px-8 py-4 font-black hover:bg-green-700 transition shadow-xl">Test Connection</button>
                      </div>
                      {testConnectionMessage && (
                        <div className={`mt-6 p-4 rounded-2xl font-bold text-sm text-center ${testConnectionStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {testConnectionMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bus Modal */}
      {showBusModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-gray-900">{editingBusId ? 'Fleet Correction' : 'Commission New Bus'}</h2>
              <button onClick={() => setShowBusModal(false)} className="text-gray-400 hover:text-gray-900 text-3xl font-black transition">×</button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Bus Number</label>
                  <input type="text" value={busFormData.busNumber} onChange={e => setBusFormData({ ...busFormData, busNumber: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Registration</label>
                  <input type="text" value={busFormData.registrationNo} onChange={e => setBusFormData({ ...busFormData, registrationNo: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Capacity</label>
                  <input type="number" value={busFormData.capacity} onChange={e => setBusFormData({ ...busFormData, capacity: parseInt(e.target.value) })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Status</label>
                  <select value={busFormData.status} onChange={e => setBusFormData({ ...busFormData, status: e.target.value as any })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold">
                    <option value="Active">Operational</option>
                    <option value="Inactive">Decommissioned</option>
                    <option value="Maintenance">Under Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Driver</label>
                  <select value={busFormData.driverId} onChange={e => setBusFormData({ ...busFormData, driverId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold">
                    <option value="">No Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Route</label>
                  <select value={busFormData.routeId} onChange={e => setBusFormData({ ...busFormData, routeId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold">
                    <option value="">No Route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Traccar Provider ID</label>
              <input type="text" placeholder="Unique numeric ID from provider system" value={busFormData.traccarDeviceId} onChange={e => setBusFormData({ ...busFormData, traccarDeviceId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-2.5 font-bold mb-10" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowBusModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Discard</button>
              <button onClick={handleSaveBus} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition">Save Fleet Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-10 overflow-hidden">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Record Maintenance</h2>
            <div className="space-y-5 mb-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Target Bus</label>
                <select value={maintenanceFormData.busId} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, busId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                  <option value="">Select Bus</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber} - {b.registrationNo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Service Date</label>
                  <input type="date" value={maintenanceFormData.serviceDate} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, serviceDate: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Cost (NPR)</label>
                  <input type="number" value={maintenanceFormData.cost} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, cost: parseFloat(e.target.value) })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Service Description</label>
                <textarea value={maintenanceFormData.description} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold resize-none" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Performed By (Mechanic/Workshop)</label>
                <input type="text" value={maintenanceFormData.performedBy} onChange={e => setMaintenanceFormData({ ...maintenanceFormData, performedBy: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowMaintenanceModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSaveMaintenance} className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl font-black hover:bg-orange-600 shadow-xl transition">Submit Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-10 overflow-hidden">
            <h2 className="text-3xl font-black text-gray-900 mb-8">Record Fuel Intake</h2>
            <div className="space-y-5 mb-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Target Bus</label>
                <select value={fuelFormData.busId} onChange={e => setFuelFormData({ ...fuelFormData, busId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                  <option value="">Select Bus</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber} - {b.registrationNo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Fuel Date</label>
                  <input type="date" value={fuelFormData.date} onChange={e => setFuelFormData({ ...fuelFormData, date: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Quantity (Liters)</label>
                  <input type="number" value={fuelFormData.fuelQuantity} onChange={e => setFuelFormData({ ...fuelFormData, fuelQuantity: parseFloat(e.target.value) })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Total Cost (NPR)</label>
                  <input type="number" value={fuelFormData.cost} onChange={e => setFuelFormData({ ...fuelFormData, cost: parseFloat(e.target.value) })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Odometer (KM)</label>
                  <input type="number" value={fuelFormData.odometerReading} onChange={e => setFuelFormData({ ...fuelFormData, odometerReading: parseFloat(e.target.value) })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Recorded By</label>
                <input type="text" value={fuelFormData.filledBy} onChange={e => setFuelFormData({ ...fuelFormData, filledBy: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowFuelModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSaveFuel} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 shadow-xl transition">Submit Log</button>
            </div>
          </div>
        </div>
      )}
      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full p-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h2 className="text-3xl font-black text-gray-900">{editingDriverId ? 'Update Driver Profile' : 'Onboard New Driver'}</h2>
              <button onClick={() => setShowDriverModal(false)} className="text-gray-400 hover:text-gray-900 text-3xl font-black transition">×</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide mb-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Full Name</label>
                    <input type="text" value={driverFormData.name} onChange={e => setDriverFormData({ ...driverFormData, name: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Phone Number</label>
                    <input type="text" value={driverFormData.phone} onChange={e => setDriverFormData({ ...driverFormData, phone: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Email (Optional)</label>
                    <input type="email" value={driverFormData.email} onChange={e => setDriverFormData({ ...driverFormData, email: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">License Number</label>
                    <input type="text" value={driverFormData.licenseNumber} onChange={e => setDriverFormData({ ...driverFormData, licenseNumber: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">License Expiry</label>
                    <input type="date" value={driverFormData.licenseExpiry} onChange={e => setDriverFormData({ ...driverFormData, licenseExpiry: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Driver Status</label>
                    <select value={driverFormData.status} onChange={e => setDriverFormData({ ...driverFormData, status: e.target.value as any })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                      <option value="Active">Active & Ready</option>
                      <option value="On Leave">Currently on Leave</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Assign to Bus</label>
                  <select value={driverFormData.assignedBusId} onChange={e => setDriverFormData({ ...driverFormData, assignedBusId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                    <option value="">Standby (No Bus)</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Date Joined</label>
                  <input type="date" value={driverFormData.joinDate} onChange={e => setDriverFormData({ ...driverFormData, joinDate: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Residential Address</label>
                <textarea value={driverFormData.address} onChange={e => setDriverFormData({ ...driverFormData, address: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold resize-none" rows={2}></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Emergency Contact Info</label>
                <input type="text" value={driverFormData.emergencyContact} onChange={e => setDriverFormData({ ...driverFormData, emergencyContact: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" placeholder="Relative Name & Phone" />
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <button onClick={() => setShowDriverModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Discard</button>
              <button onClick={handleSaveDriver} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 shadow-xl shadow-green-100 transition">Save Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full p-10 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h2 className="text-3xl font-black text-gray-900">{editingRouteId ? 'Update Route Path' : 'Define New Route'}</h2>
              <button onClick={() => setShowRouteModal(false)} className="text-gray-400 hover:text-gray-900 text-3xl font-black transition">×</button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide mb-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Route Name</label>
                    <input type="text" value={routeFormData.routeName} onChange={e => setRouteFormData({ ...routeFormData, routeName: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" placeholder="Main City Route" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Route Number/Code</label>
                    <input type="text" value={routeFormData.routeNumber} onChange={e => setRouteFormData({ ...routeFormData, routeNumber: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" placeholder="R-101" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Distance (KM)</label>
                    <input type="number" value={routeFormData.distance} onChange={e => setRouteFormData({ ...routeFormData, distance: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Start Point</label>
                    <input type="text" value={routeFormData.startPoint} onChange={e => setRouteFormData({ ...routeFormData, startPoint: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">End Point</label>
                    <input type="text" value={routeFormData.endPoint} onChange={e => setRouteFormData({ ...routeFormData, endPoint: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Route Status</label>
                    <select value={routeFormData.status} onChange={e => setRouteFormData({ ...routeFormData, status: e.target.value as any })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                      <option value="Active">Active Route</option>
                      <option value="Inactive">Temporary Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Number of Stops</label>
                <input type="number" value={routeFormData.stops} onChange={e => setRouteFormData({ ...routeFormData, stops: parseInt(e.target.value) || 0 })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Primary Bus</label>
                  <select value={routeFormData.assignedBusId} onChange={e => setRouteFormData({ ...routeFormData, assignedBusId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold">
                    <option value="">Unassigned</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Departure</label>
                    <input type="time" value={routeFormData.departureTime} onChange={e => setRouteFormData({ ...routeFormData, departureTime: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Arrival</label>
                    <input type="time" value={routeFormData.arrivalTime} onChange={e => setRouteFormData({ ...routeFormData, arrivalTime: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3 font-bold" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <button onClick={() => setShowRouteModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleSaveRoute} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition">Save Route</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-10 overflow-hidden">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h2 className="text-3xl font-black text-gray-900">Assign Student to Transport</h2>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-900 text-3xl font-black transition">×</button>
            </div>
            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Search/Select Student</label>
                <input type="text" list="students-list" value={studentFormData.studentId} onChange={e => setStudentFormData({ ...studentFormData, studentId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-bold" placeholder="Paste Student ID or Search..." />
                <datalist id="students-list">
                  {Array.isArray(allStudents) && allStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name || `${student.first_name} ${student.last_name}`} ({student.studentId || student.student_id_number || student.rollNo})</option>
                  ))}
                </datalist>
                <p className="text-[10px] text-gray-400 mt-2 px-1 font-bold">Please select a valid student from the database.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Assigned Bus</label>
                  <select value={studentFormData.busId} onChange={e => setStudentFormData({ ...studentFormData, busId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-bold">
                    <option value="">Select Bus</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Route Path</label>
                  <select value={studentFormData.routeId} onChange={e => setStudentFormData({ ...studentFormData, routeId: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-bold">
                    <option value="">Select Route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Morning Pickup Stop</label>
                  <input type="text" value={studentFormData.pickupStop} onChange={e => setStudentFormData({ ...studentFormData, pickupStop: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Evening Dropoff Stop</label>
                  <input type="text" value={studentFormData.dropoffStop} onChange={e => setStudentFormData({ ...studentFormData, dropoffStop: e.target.value })} className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 font-bold" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowStudentModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black hover:bg-gray-200 transition">Discard</button>
              <button onClick={handleSaveAssignment} className="flex-[2] bg-purple-600 text-white py-4 rounded-2xl font-black hover:bg-purple-700 shadow-xl shadow-purple-100 transition">Create Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
