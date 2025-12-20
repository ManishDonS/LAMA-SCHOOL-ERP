import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/authStore'
import { classAPI, teacherAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

interface ClassRoom {
  id: number
  name: string
  grade: string
  section: string
  capacity: number
  teacher_id: number
  teacher_name: string
  room: string
  shift: string
  academic_year: string
  description: string
  status: 'Active' | 'Inactive'
  created_at: string
}

interface Teacher {
  id: number
  first_name: string
  last_name: string
}

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const SHIFTS = ['Morning', 'Afternoon', 'Evening']

export default function ClassesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    grade: '1',
    section: 'A',
    capacity: 40,
    teacher_id: 0,
    teacher_name: '',
    room: '',
    shift: 'Morning',
    academic_year: '2024-2025',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  })

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && user) {
      fetchData()
    }
  }, [isHydrated, user])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [classesRes, teachersRes] = await Promise.all([
        classAPI.list(),
        teacherAPI.list()
      ])
      setClasses(classesRes.data.classes || [])
      setTeachers(teachersRes.data.teachers || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (cl?: ClassRoom) => {
    if (cl) {
      setEditingId(cl.id)
      setFormData({
        name: cl.name,
        grade: cl.grade,
        section: cl.section,
        capacity: cl.capacity,
        teacher_id: cl.teacher_id,
        teacher_name: cl.teacher_name,
        room: cl.room,
        shift: cl.shift,
        academic_year: cl.academic_year,
        description: cl.description,
        status: cl.status,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        grade: '1',
        section: 'A',
        capacity: 40,
        teacher_id: 0,
        teacher_name: '',
        room: '',
        shift: 'Morning',
        academic_year: '2024-2025',
        description: '',
        status: 'Active',
      })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Class name is required')
      return
    }

    try {
      if (editingId) {
        await classAPI.update(editingId, formData)
        toast.success('Class updated successfully')
      } else {
        await classAPI.create(formData)
        toast.success('Class created successfully')
      }
      setShowModal(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to save class')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await classAPI.delete(id)
        toast.success('Class deleted successfully')
        fetchData()
      } catch (error) {
        toast.error('Failed to delete class')
      }
    }
  }

  const filteredClasses = useMemo(() => {
    return classes.filter(cl =>
      cl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cl.room?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [classes, searchTerm])

  const stats = useMemo(() => {
    const total = classes.length
    const active = classes.filter(c => c.status === 'Active').length
    const capacity = classes.reduce((acc, c) => acc + c.capacity, 0)
    return { total, active, capacity }
  }, [classes])

  if (!isHydrated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 py-8 px-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Classes Management
              </h1>
              <p className="text-gray-600 font-medium">Manage academic rooms, teachers, and schedules</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Total Classes', value: stats.total, icon: '🏫', color: 'blue' },
                { label: 'Active Rooms', value: stats.active, icon: '✅', color: 'emerald' },
                { label: 'Cumulative Capacity', value: stats.capacity, icon: '👥', color: 'indigo' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/40 flex items-center gap-6 group hover:shadow-md transition-all">
                  <div className={`w-14 h-14 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search & Actions Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full md:w-auto relative group">
                <input
                  type="text"
                  placeholder="Search by name, grade, teacher or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-96 px-5 py-3 pl-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md outline-none font-medium"
                />
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 whitespace-nowrap active:scale-95"
              >
                <span className="text-xl">+</span> Add New Class
              </button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-20">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-sm">Class Detail</th>
                      <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-sm">Grade & Section</th>
                      <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-sm">Room / Shift</th>
                      <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-sm">Teacher</th>
                      <th className="px-6 py-4 text-left font-bold uppercase tracking-wider text-sm">Status</th>
                      <th className="px-6 py-4 text-right font-bold uppercase tracking-wider text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold animate-pulse">Fetching records...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <div className="text-5xl mb-4 opacity-20">🏫</div>
                            <h3 className="text-xl font-bold text-gray-400">No classes found</h3>
                            <p className="text-gray-400 mt-1">Try a different search or add a new class room</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredClasses.map((cl) => (
                        <tr key={cl.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {cl.grade}{cl.section[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{cl.name}</p>
                                <p className="text-xs text-gray-400 font-medium">ID: #{cl.id.toString().padStart(4, '0')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-700">Grade {cl.grade}</span>
                              <span className="text-xs text-gray-500 font-medium tracking-wide">Section {cl.section}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-700">{cl.room || 'TBD'}</span>
                              <span className="text-xs text-indigo-500 font-black uppercase tracking-tighter">{cl.shift}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                                {cl.teacher_name ? cl.teacher_name.split(' ').map(n => n[0]).join('') : '?'}
                              </div>
                              <span className="font-bold text-gray-700 text-sm">{cl.teacher_name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${cl.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-gray-50 text-gray-500 border-gray-100'
                              }`}>
                              {cl.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(cl)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit Class"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(cl.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Class"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal - Same as Guardians patterns */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  {editingId ? 'Modify Class Configuration' : 'Establish New Class'}
                </h2>
                <p className="text-blue-100 text-sm font-semibold opacity-80 mt-1">Configure parameters for the academic environment</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all text-xl font-bold">
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Class Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Grade X - Science"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  >
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Section Assignment</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Student Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Room Identifier</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., B-204"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Class Teacher</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => {
                      const tid = parseInt(e.target.value)
                      const t = teachers.find(x => x.id === tid)
                      setFormData({ ...formData, teacher_id: tid, teacher_name: t ? `${t.first_name} ${t.last_name}` : '' })
                    }}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  >
                    <option value={0}>Not Assigned</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Academic Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  >
                    {SHIFTS.map(s => <option key={s} value={s}>{s} Shift</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Academic Cycle</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2024-2025"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-8 py-3 bg-white text-gray-500 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:shadow-xl hover:translate-y-[-2px] transition-all active:scale-95"
              >
                {editingId ? 'Update Configuration' : 'Confirm Setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  )
}
