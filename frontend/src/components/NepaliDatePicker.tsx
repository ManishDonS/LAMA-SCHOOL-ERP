import React, { useEffect, useState, useRef } from 'react'
import NepaliDate from 'nepali-date-converter'
import { useAuthStore } from '../store/authStore'
import { NepaliDatePicker as NDP } from 'nepali-datepicker-reactjs'
import DatePicker from 'react-datepicker'
import 'nepali-datepicker-reactjs/dist/index.css'
import 'react-datepicker/dist/react-datepicker.css'

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

  const handleADChange = (date: Date | null) => {
    if (date) {
      const adDateString = date.toISOString().split('T')[0]
      onChange(adDateString)
    }
  }

  // Format date for display
  const getFormattedDate = () => {
    if (!value) return null

    try {
      const adDate = new Date(value)

      if (calendarType === 'BS' && bsDate) {
        // Display BS date in Nepali format
        const [year, month, day] = bsDate.split('-')
        const bsMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत']
        const monthName = bsMonths[parseInt(month) - 1]
        return `${day} ${monthName} ${year}`
      } else {
        // Display AD date in English format
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
        return adDate.toLocaleDateString('en-US', options)
      }
    } catch (e) {
      return null
    }
  }

  const formattedDate = getFormattedDate()

  // Convert string date to Date object for react-datepicker
  const selectedDate = value ? new Date(value) : null

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
            <div className="ad-calendar-wrapper">
              <DatePicker
                selected={selectedDate}
                onChange={handleADChange}
                dateFormat="yyyy-MM-dd"
                disabled={disabled}
                className={`w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                calendarClassName="ad-calendar-popup"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                placeholderText="Select date"
              />
            </div>
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

        {/* Display formatted date below input */}
        {formattedDate && (
          <div className="mt-1 px-2 py-1 text-xs text-gray-600 bg-blue-50 rounded border border-blue-100">
            <span className="font-medium">Selected: </span>
            <span className="font-semibold text-blue-700">{formattedDate}</span>
            {calendarType === 'BS' && value && (
              <span className="ml-2 text-gray-500">
                (AD: {new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })})
              </span>
            )}
          </div>
        )}
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

        /* AD Calendar Styles */
        .ad-calendar-wrapper {
          position: relative;
          z-index: 10;
        }

        .ad-calendar-wrapper .react-datepicker-wrapper {
          width: 100%;
        }

        .ad-calendar-wrapper .react-datepicker__input-container {
          width: 100%;
        }

        .ad-calendar-popup {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 9999 !important;
        }

        .react-datepicker-popper {
          z-index: 9999 !important;
        }

        .react-datepicker__header {
          background-color: #3b82f6;
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          padding: 12px 0;
        }

        .react-datepicker__current-month {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }

        .react-datepicker__day-name {
          color: white;
          font-weight: 500;
          width: 2rem;
          line-height: 2rem;
          margin: 0.2rem;
        }

        .react-datepicker__day {
          width: 2rem;
          line-height: 2rem;
          margin: 0.2rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .react-datepicker__day:hover {
          background-color: #dbeafe;
          border-radius: 8px;
        }

        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #93c5fd;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          color: #3b82f6;
          background-color: #eff6ff;
        }

        .react-datepicker__month-dropdown,
        .react-datepicker__year-dropdown {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .react-datepicker__month-option:hover,
        .react-datepicker__year-option:hover {
          background-color: #dbeafe;
        }

        .react-datepicker__navigation {
          top: 14px;
        }

        .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        
        /* Responsive adjustments for smaller screens */
        @media (max-width: 640px) {
          .nepali-calendar-wrapper .calendar-container {
            max-width: 280px !important;
            max-height: 350px !important;
          }

          .ad-calendar-popup {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}

export default NepaliDatePicker
