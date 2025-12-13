import { schoolAPI } from './api'
import { Module, School } from '../types'

export const schoolService = {
    getModules: async (): Promise<Module[]> => {
        const response = await schoolAPI.getModules()
        return response.data
    },

    toggleModule: async (schoolId: string, moduleId: string, active: boolean): Promise<School> => {
        const response = await schoolAPI.toggleModule(schoolId, moduleId, active)
        return response.data
    },

    getSchool: async (id: string): Promise<School> => {
        const response = await schoolAPI.get(id)
        return response.data
    }
}
