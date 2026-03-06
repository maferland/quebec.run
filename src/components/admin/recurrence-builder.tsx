'use client'

import type { RecurrenceFormState } from '@/lib/utils/rrule-builder'

interface RecurrenceBuilderProps {
  value: RecurrenceFormState
  onChange: (value: RecurrenceFormState) => void
}

const WEEKDAYS = [
  { value: 'MO', label: 'Monday' },
  { value: 'TU', label: 'Tuesday' },
  { value: 'WE', label: 'Wednesday' },
  { value: 'TH', label: 'Thursday' },
  { value: 'FR', label: 'Friday' },
  { value: 'SA', label: 'Saturday' },
  { value: 'SU', label: 'Sunday' },
]

export function RecurrenceBuilder({ value, onChange }: RecurrenceBuilderProps) {
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as RecurrenceFormState['frequency']
    onChange({
      ...value,
      frequency,
      interval: frequency === 'biweekly' ? 2 : 1,
    })
  }

  const handleDayToggle = (day: string) => {
    const newDays = value.byweekday.includes(day)
      ? value.byweekday.filter((d) => d !== day)
      : [...value.byweekday, day]

    onChange({ ...value, byweekday: newDays })
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, time: e.target.value })
  }

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <div>
        <label htmlFor="frequency" className="block text-sm font-medium mb-1">
          Frequency
        </label>
        <select
          id="frequency"
          value={value.frequency}
          onChange={handleFrequencyChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly (every 2 weeks)</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Days (for weekly/biweekly) */}
      {value.frequency !== 'monthly' && (
        <div>
          <label className="block text-sm font-medium mb-2">Days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.byweekday.includes(day.value)}
                  onChange={() => handleDayToggle(day.value)}
                  className="rounded"
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Time */}
      <div>
        <label htmlFor="time" className="block text-sm font-medium mb-1">
          Time
        </label>
        <input
          id="time"
          type="time"
          value={value.time}
          onChange={handleTimeChange}
          className="border rounded px-3 py-2"
        />
      </div>
    </div>
  )
}
