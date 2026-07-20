import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/Button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { deleteLiveSession, startLiveSession, pauseLiveSession, endLiveSession } from "./actions"
import { BroadcastIcon, PlayCircleIcon, PauseIcon, StopIcon, EditIcon } from "@/components/admin/Icons"

export const revalidate = 0

const statusConfig = {
  not_started: { label: "No iniciada", color: "bg-[#9CA3B8]", icon: <PlayCircleIcon className="w-4 h-4" /> },
  live: { label: "EN VIVO", color: "bg-[#E74C3C] animate-pulse", icon: <span className="w-2 h-2 rounded-full bg-white" /> },
  paused: { label: "Pausada", color: "bg-[#C9A96E]", icon: <PauseIcon className="w-4 h-4" /> },
  ended: { label: "Finalizada", color: "bg-[#27AE60]", icon: <StopIcon className="w-4 h-4" /> },
}

export default async function AdminLivesPage() {
  const supabase = await createClient()

  const { data: sessions } = await (supabase as any)
    .from("live_sessions")
    .select(`
      id,
      title,
      status,
      started_at,
      ended_at,
      total_products_shown,
      total_products_sold,
      total_interested,
      total_likes,
      total_followers,
      store_profiles(name),
      live_products(id)
    `)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">
            Sesiones en Vivo
            <span className="text-[10px] bg-[#C9A96E] text-white px-1.5 py-0.5 rounded ml-2 font-semibold">BETA</span>
          </h1>
          <p className="text-sm text-[#9CA3B8] m-0 mt-1">Gestiona tus transmisiones en vivo y ventas en tiempo real</p>
        </div>
        <Link href="/admin/lives/nuevo" prefetch={false}>
          <Button variant="primary" size="sm">
            <BroadcastIcon className="w-4 h-4" />
            Nueva sesión
          </Button>
        </Link>
      </div>

      <div className="bg-secondary-light border border-white/12 rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/12 text-[#9CA3B8] text-[13px]">
                <th className="text-left px-5 py-3 font-medium">Sesión</th>
                <th className="text-left px-5 py-3 font-medium">Tienda</th>
                <th className="text-center px-5 py-3 font-medium">Estado</th>
                <th className="text-center px-5 py-3 fontmedium">Productos</th>
                <th className="text-center px-5 py-3 font-medium">Interacciones</th>
                <th className="text-center px-5 py-3 font-medium">Ventas</th>
                <th className="text-center px-5 py-3 font-medium">Iniciada</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(sessions ?? []).map((s: any) => {
                const cfg = statusConfig[s.status as keyof typeof statusConfig] || statusConfig.not_started
                const productCount = s.live_products?.length ?? 0
                const interested = s.total_interested ?? 0
                const sold = s.total_products_sold ?? 0
                const shown = s.total_products_shown ?? 0

                return (
                  <tr key={s.id} className="border-b border-white/12 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-white font-medium">{s.title}</div>
                      <div className="text-[#9CA3B8] text-[12px]">ID: {s.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#ABB2BF]">{s.store_profiles?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {cfg.icon}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color} text-white`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center text-[#ABB2BF]">{productCount}</td>
                    <td className="px-5 py-3.5 text-center text-[#ABB2BF]">
                      👁️ {shown} · ❤️ {interested}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[#27AE60] font-semibold">Bs. {sold}</td>
                    <td className="px-5 py-3.5 text-center text-[#9CA3B8] text-[12px]">
                      {s.started_at ? new Date(s.started_at).toLocaleString("es-BO") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/lives/${s.id}/editar`}
                          className="text-[#ABB2BF] hover:text-white text-xs no-underline transition-colors"
                          prefetch={false}
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/lives/${s.id}/studio`}
                          className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors no-underline"
                          prefetch={false}
                        >
                          Studio
                        </Link>
                        {s.status === "not_started" && (
                          <form action={startLiveSession.bind(null, s.id)}>
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-[#27AE60]/15 text-[#27AE60] text-xs font-semibold hover:bg-[#27AE60]/25 transition-colors border-none cursor-pointer"
                            >
                              Iniciar
                            </button>
                          </form>
                        )}
                        {s.status === "live" && (
                          <>
                            <form action={pauseLiveSession.bind(null, s.id)}>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-[#C9A96E]/15 text-[#C9A96E] text-xs font-semibold hover:bg-[#C9A96E]/25 transition-colors border-none cursor-pointer"
                              >
                                Pausar
                              </button>
                            </form>
                            <form action={endLiveSession.bind(null, s.id)}>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-[#E74C3C]/15 text-[#E74C3C] text-xs font-semibold hover:bg-[#E74C3C]/25 transition-colors border-none cursor-pointer"
                              >
                                Finalizar
                              </button>
                            </form>
                          </>
                        )}
                        {s.status === "paused" && (
                          <>
                            <form action={startLiveSession.bind(null, s.id)}>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-[#27AE60]/15 text-[#27AE60] text-xs font-semibold hover:bg-[#27AE60]/25 transition-colors border-none cursor-pointer"
                              >
                                Reanudar
                              </button>
                            </form>
                            <form action={endLiveSession.bind(null, s.id)}>
                              <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg bg-[#E74C3C]/15 text-[#E74C3C] text-xs font-semibold hover:bg-[#E74C3C]/25 transition-colors border-none cursor-pointer"
                              >
                                Finalizar
                              </button>
                            </form>
                          </>
                        )}
                        <form action={deleteLiveSession.bind(null, s.id)}>
                          <DeleteButton
                            action={deleteLiveSession.bind(null, s.id)}
                            label="Eliminar"
                            confirmMessage="¿Eliminar esta sesión en vivo?"
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(sessions ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#9CA3B8]">
                    No hay sesiones en vivo creadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}