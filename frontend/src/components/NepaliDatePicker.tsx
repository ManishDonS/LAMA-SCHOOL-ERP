import React, { useEffect, useState, useRef } from 'react'
import NepaliDate from 'nepali-date-converter'
import { useAuthStore } from '../store/authStore'
import { NepaliDatePicker as NDP } from 'nepali-datepicker-reactjs'
import 'nepali-datepicker-reactjs/dist/index.css'

interface NepaliDatePickerProps {
  value: string // AD date in YYYY-MM-DD
  onChange: (date: string) => void // Returns AD date in YYYY-MM-DD
  label?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  value,
  onChange,
  label,
  className = '',
  required = false,
  disabled = false,
}) => {
  const [bsDate, setBsDate] = useState<string>('')
  const { activeModules } = useAuthStore()
  const isNepaliDateActive = activeModules.includes('nepali_date')
  const [calendarType, setCalendarType] = useState<'BS' | 'AD'>(isNepaliDateActive ? 'BS' : 'AD')
  const isChangingRef = useRef(false)

  // Force AD if module becomes inactive
  useEffect(() => {
    if (!isNepaliDateActive && calendarType === 'BS') {
      setCalendarType('AD')
    }
  }, [isNepaliDateActive])

  // Convert AD to BS for display
  useEffect(() => {
    if (isChangingRef.current) {
      isChangingRef.current = false
      return
    }

    if (value) {
      try {
        const adDate = new Date(value)
        const bs = new NepaliDate(adDate)
        const newBsDate = bs.format('YYYY-MM-DD')
        if (newBsDate !== bsDate) {
          setBsDate(newBsDate)
        }
      } catch (e) {
        console.error('Invalid date:', value)
        setBsDate('')
      }
    } else {
      setBsDate('')
    }
  }, [value])

  const handleBSChange = (date: string) => {
    // date is in BS (YYYY-MM-DD)
    try {
      isChangingRef.current = true
      const [year, month, day] = date.split('-').map(Number)
      const bs = new NepaliDate(year, month - 1, day)
      const adDate = bs.toJsDate()
      const adDateString = adDate.toISOString().split('T')[0]
      setBsDate(date) // Update BS date immediately
      onChange(adDateString)
    } catch (e) {
      console.error("Error converting BS to AD", e)
      isChangingRef.current = false
    }
  }

  const handleADChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const adDateString = e.target.value
    onChange(adDateString)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label} {required && '*'}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          {calendarType === 'BS' ? (
            <div className="nepali-calendar-wrapper">
              <NDP
                inputClassName={`w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                value={bsDate}
                onChange={handleBSChange}
                options={{ calenderLocale: 'ne', valueLocale: 'en', closeOnSelect: true }}
              />
            </div>
          ) : (
            <input
              type="date"
              value={value}
              onChange={handleADChange}
              disabled={disabled}
              className={`w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            />
          )}

          {/* Integrated Toggle Badge */}
          {activeModules.includes('nepali_date') && (
            <button
              type="button"
              onClick={() => setCalendarType(prev => prev === 'BS' ? 'AD' : 'BS')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 px-2 py-0.5 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 transition-colors shadow-sm"
              title="Toggle Calendar Format"
            >
              {calendarType}
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .nepali-calendar-wrapper {
          position: relative;
          z-index: 10;
        }
        
        .nepali-calendar-wrapper .calendar-container {
          position: fixed !important;
          z-index: 9999 !important;
          max-height: 380px !important;
          max-width: 320px !important;
          overflow-y: auto !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          margin-top: 4px !important;
        }
        
        /* Ensure calendar stays within viewport */
        .nepali-calendar-wrapper .calendar-container {
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
        }
        
        .nepali-calendar-wrapper input {
          position: relative;
          z-index: 1;
        }
        
        /* Responsive adjustments for smaller screens */
        @media (max-width: 640px) {
          .nepali-calendar-wrapper .calendar-container {
            max-width: 280px !important;
            max-height: 350px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default NepaliDatePicker

