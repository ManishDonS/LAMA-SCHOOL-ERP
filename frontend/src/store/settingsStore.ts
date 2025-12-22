import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DateFormat } from '../utils/nepaliDate'

interface SettingsState {
    dateFormat: DateFormat
    setDateFormat: (format: DateFormat) => void
    toggleDateFormat: () => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            dateFormat: 'AD',
            setDateFormat: (dateFormat) => set({ dateFormat }),
            toggleDateFormat: () =>
                set((state) => ({
                    dateFormat: state.dateFormat === 'AD' ? 'BS' : 'AD'
                })),
        }),
        {
            name: 'settings-storage',
        }
    )
)
