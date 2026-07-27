"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

type AdminAuthInfo = {
  email: string
  otp_enabled: boolean
  is_active: boolean
} | null

export default function AdminProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<"form" | "otp" | "done">("form")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [adminInfo, setAdminInfo] = useState<AdminAuthInfo>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) return
      const { data } = await (supabase as any)
        .from("admin_authorized")
        .select("email, otp_enabled, is_active")
        .eq("user_id", user.id)
        .maybeSingle()
      if (data) {
        setAdminInfo(data as AdminAuthInfo)
      }
    })
  }, [])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente a la actual")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError("Sesión no válida")
      setLoading(false)
      return
    }

    const { error: pwError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (pwError) {
      setError("Los datos ingresados no son correctos")
      setLoading(false)
      return
    }

    const targetEmail = adminInfo?.email || user.email

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (otpError) {
      if (otpError.message?.includes("rate")) {
        setError("Espera unos minutos antes de solicitar otro código")
      } else {
        setError("Error al enviar el código de verificación")
      }
      return
    }

    setStep("otp")
    setSuccess("Código de verificación enviado a tu correo")
  }

  async function handleVerifyAndChange(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!otpCode || otpCode.length < 4) {
      setError("Ingresa el código de verificación")
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError("Sesión no válida")
      setLoading(false)
      return
    }

    const targetEmail = adminInfo?.email || user.email

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: targetEmail,
      token: otpCode,
      type: "email",
    })

    if (verifyError) {
      setError("El código ingresado no es correcto o ha expirado")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setLoading(false)

    if (updateError) {
      setError("Error al actualizar la contraseña")
      return
    }

    setSuccess("Contraseña actualizada correctamente")
    setStep("done")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setOtpCode("")
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Perfil</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">Configuración del administrador</p>
      </div>

      {adminInfo && (
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-3">Verificación OTP</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3B8]">Correo autorizado</span>
              <span className="text-white font-mono text-[12px]">{adminInfo.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3B8]">Estado</span>
              <span className={`font-semibold ${adminInfo.otp_enabled ? "text-[#27AE60]" : "text-[#E74C3C]"}`}>
                {adminInfo.otp_enabled ? "Verificación activada" : "Verificación desactivada"}
              </span>
            </div>
          </div>
        </div>
      )}

      {!adminInfo && (
        <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-5 mb-6">
          <p className="text-[13px] text-[#9CA3B8]">
            No estás registrado como administrador autorizado. Contacta al super admin para agregarte.
          </p>
        </div>
      )}

      <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-bold text-white mb-2">Seguridad</h2>
        <p className="text-[13px] text-[#9CA3B8] mb-6">Cambiar contraseña de acceso al panel</p>

        {step === "form" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[13px] text-[#9CA3B8] mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#9CA3B8] mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#9CA3B8] mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="text-[13px] text-[#E74C3C] bg-[rgba(231,76,60,0.1)] px-3 py-2 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="text-[13px] text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-3 py-2 rounded-lg">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando código..." : "Enviar código de verificación"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyAndChange} className="space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)]">
              <p className="text-[13px] text-[#9CA3B8] mb-1">Se envió un código de verificación a tu correo</p>
              <p className="text-[12px] text-[#9CA3B8]">Revisa tu bandeja de entrada e ingresa el código debajo.</p>
            </div>

            <div>
              <label className="block text-[13px] text-[#9CA3B8] mb-1">Código de verificación</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors text-center text-lg tracking-[8px] font-mono"
              />
            </div>

            {error && (
              <div className="text-[13px] text-[#E74C3C] bg-[rgba(231,76,60,0.1)] px-3 py-2 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep("form"); setError(""); setSuccess("") }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-white/10 text-white text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando..." : "Verificar y cambiar"}
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="p-6 text-center">
            <div className="text-[#27AE60] text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Contraseña actualizada correctamente</h3>
            <p className="text-[13px] text-[#9CA3B8] mb-4">La próxima vez que inicies sesión usa tu nueva contraseña.</p>
            <button
              onClick={() => { setStep("form"); setSuccess(""); setError("") }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
