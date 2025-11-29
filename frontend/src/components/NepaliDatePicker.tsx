import React, { useEffect, useState, useRef } from 'react'
import NepaliDate from 'nepali-date-converter'
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
  const [calendarType, setCalendarType] = useState<'BS' | 'AD'>('BS')
  const isChangingRef = useRef(false)

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

      <div className="flex gap-2 items-stretch">
        {/* Date Input */}
        <div className="flex-1 relative">
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
        </div>

        {/* Toggle Buttons */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setCalendarType('BS')}
            className={`px-3 py-2 text-sm font-semibold transition-colors ${calendarType === 'BS'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            BS
          </button>
          <button
            type="button"
            onClick={() => setCalendarType('AD')}
            className={`px-3 py-2 text-sm font-semibold transition-colors border-l border-gray-300 ${calendarType === 'AD'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            AD
          </button>
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

