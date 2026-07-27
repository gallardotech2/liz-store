"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getAllSocialLinks, updateSocialLink } from "@/lib/queries/social-links"
import type { SocialLink } from "@/lib/queries/social-links"

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  whatsapp: "#25D366",
  tiktok: "#000000",
}

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const data = await getAllSocialLinks(supabase)
    setLinks(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(id: number, url: string) {
    setSavingId(id)
    setSuccess("")
    setError("")
    const supabase = createClient()
    const { error: err } = await updateSocialLink(supabase, id, { url })
    if (err) {
      setError("Error al guardar")
    } else {
      setSuccess("URL actualizada")
      load()
    }
    setSavingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#9CA3B8]">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Redes Sociales</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">
          Configura los enlaces a tus redes sociales que aparecen en la página principal y el footer
        </p>
      </div>

      {success && (
        <div className="mb-4 text-[13px] text-[#27AE60] bg-[rgba(39,174,96,0.1)] px-4 py-2.5 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 text-[13px] text-[#E74C3C] bg-[rgba(231,76,60,0.1)] px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <SocialLinkCard
            key={link.id}
            link={link}
            saving={savingId === link.id}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}

function SocialLinkCard({
  link,
  saving,
  onSave,
}: {
  link: SocialLink
  saving: boolean
  onSave: (id: number, url: string) => void
}) {
  const [url, setUrl] = useState(link.url)
  const color = PLATFORM_COLORS[link.platform] || "#888"

  return (
    <div className="bg-[#1E1E2E] rounded-2xl border border-white/10 p-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ background: color }}
        >
          {link.label.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold">{link.label}</div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`https://${link.platform}.com/...`}
            className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-[#2A2A3E] border border-white/10 text-white text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={() => onSave(link.id, url)}
          disabled={saving || url === link.url}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  )
}
