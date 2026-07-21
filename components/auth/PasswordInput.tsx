"use client"

import { useState } from "react"

interface PasswordInputProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  error?: string | null
  describedById?: string
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = true,
  error,
  describedById,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const errorId = describedById ?? `${id}-error`

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block text-[14px] font-semibold text-[#2D2D2D] mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-4 py-3 pr-12 border rounded-[8px] text-[15px] font-sans transition-colors duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,142,159,0.1)] ${
            error
              ? "border-[#E74C3C] focus:border-[#E74C3C]"
              : "border-[#DDD] focus:border-primary"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-primary transition-colors duration-200 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-[#E74C3C]">
          {error}
        </p>
      )}
    </div>
  )
}
