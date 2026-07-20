"use client"

import { useState, useEffect, useCallback, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { BroadcastIcon, MicIcon, MicOffIcon, CameraIcon, CameraOffIcon, SettingsIcon, XIcon, MessageSquareIcon, HeartIcon, EyeIcon, ShoppingBagIcon, ArrowLeftIcon, PlayCircleIcon, PauseIcon, StopIcon } from "@/components/admin/Icons"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LiveSession {
  id: number
  title: string
  status: "not_started" | "live" | "paused" | "ended"
  started_at: string | null
  ended_at: string | null
  current_product_id: number | null
  total_products_shown: number
  total_products_sold: number
  total_reserved: number
  total_interested: number
  total_likes: number
  total_followers: number
  live_products: Array<{
    id: number
    product_id: number
    status: "available" | "requested" | "reserved" | "sold"
    order: number
    products: {
      id: number
      name: string
      price: number
      discount_price: number | null
      product_images: Array<{ image: string; is_main: boolean }>
    }
  }>
  store_profiles: {
    name: string
    likes: number
    followers: number
    rating: number
    reviewsCount: number
  }
}

interface StudioPageProps {
  params: Promise<{ id: string }>
}

const productStatusConfig = {
  available: { label: "Disponible", color: "bg-[#27AE60]", text: "text-[#27AE60]" },
  requested: { label: "Solicitado", color: "bg-[#C9A96E]", text: "text-[#C9A96E]" },
  reserved: { label: "Reservado", color: "bg-[#03C9D7]", text: "text-[#03C9D7]" },
  sold: { label: "Vendido", color: "bg-[#E74C3C]", text: "text-[#E74C3C]" },
}

export default function AdminLiveStudioPage({ params }: StudioPageProps) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentProductId, setCurrentProductId] = useState<number | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [comments, setComments] = useState<Array<{ id: number; user: string; message: string; time: string }>>([])
  const [newComment, setNewComment] = useState("")
  const [likes, setLikes] = useState(0)
  const [followers, setFollowers] = useState(0)
  const [viewers, setViewers] = useState(0)

  const liveSessionId = Number(use(params).id)

  const fetchSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await (supabase as any)
        .from("live_sessions")
        .select(`
          *,
          live_products(
            id,
            product_id,
            status,
            order,
            products(
              id,
              name,
              price,
              discount_price,
              product_images(image, is_main)
            )
          ),
          store_profiles(name, likes, followers, rating, reviewsCount)
        `)
        .eq("id", liveSessionId)
        .single()

      if (data) {
        const sessionData = data as unknown as LiveSession
        setSession(sessionData)
        setCurrentProductId(sessionData.current_product_id)
        setLikes(sessionData.store_profiles?.likes ?? 0)
        setFollowers(sessionData.store_profiles?.followers ?? 0)
        setViewers(sessionData.total_interested ?? 0)
      }
    } catch (err) {
      console.error("Error fetching session:", err)
    } finally {
      setLoading(false)
    }
  }, [liveSessionId])

  useEffect(() => {
    fetchSession()
    const interval = setInterval(fetchSession, 5000)
    return () => clearInterval(interval)
  }, [fetchSession])

  const currentProduct = session?.live_products?.find(
    (lp) => lp.product_id === currentProductId
  )

  const availableProducts = session?.live_products?.filter(
    (lp) => lp.product_id !== currentProductId && lp.status === "available"
  ) || []

  const handleStatusChange = async (status: "not_started" | "live" | "paused" | "ended") => {
    if (!session) return
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("live_sessions")
      .update({
        status,
        ...(status === "live" && { started_at: new Date().toISOString() }),
        ...(status === "ended" && { ended_at: new Date().toISOString() }),
      })
      .eq("id", session.id)

    if (!error) {
      setSession((prev) => prev ? { ...prev, status } : null)
      fetchSession()
    }
  }

  const handleSetCurrentProduct = async (productId: number | null) => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("live_sessions")
      .update({ current_product_id: productId })
      .eq("id", liveSessionId)

    if (!error) {
      setCurrentProductId(productId)
      fetchSession()
    }
  }

  const handleUpdateLiveProductStatus = async (productId: number, status: "available" | "requested" | "reserved" | "sold") => {
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("live_products")
      .update({ status })
      .eq("session_id", liveSessionId)
      .eq("product_id", productId)

    if (!error) {
      fetchSession()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <BroadcastIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl text-[#9CA3B8]">Sesión no encontrada</h2>
        <Link href="/admin/lives" className="mt-4 inline-block text-primary hover:underline">
          ← Volver a sesiones
        </Link>
      </div>
    )
  }

  const formatCurrency = (amount: number) => `Bs. ${amount.toFixed(2)}`

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-40 bg-secondary-light border-b border-white/12 px-7 py-4 flex items-center justify-between">
        <Link
          href="/admin/lives"
          className="flex items-center gap-2 text-[#ABB2BF] hover:text-white transition-colors no-underline"
          prefetch={false}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Sesiones en Vivo</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-[#27AE60]/20 text-[#27AE60] font-semibold">
              {session.status === "live" ? "● EN VIVO" : session.status.toUpperCase()}
            </span>
            <span className="text-[#9CA3B8]">|</span>
            <span className="text-[#ABB2BF]">{session.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                isMicOn ? "bg-[#27AE60]/15 text-[#27AE60]" : "bg-[#E74C3C]/15 text-[#E74C3C]"
              )}
              aria-label={isMicOn ? "Silenciar micrófono" : "Activar micrófono"}
            >
              {isMicOn ? <MicIcon className="w-4 h-4" /> : <MicOffIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMicOn ? "Mic ON" : "Mic OFF"}</span>
            </button>
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                isCameraOn ? "bg-[#27AE60]/15 text-[#27AE60]" : "bg-[#E74C3C]/15 text-[#E74C3C]"
              )}
              aria-label={isCameraOn ? "Apagar cámara" : "Encender cámara"}
            >
              {isCameraOn ? <CameraIcon className="w-4 h-4" /> : <CameraOffIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCameraOn ? "Cam ON" : "Cam OFF"}</span>
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                showChat ? "bg-primary/15 text-primary" : "bg-[#2A2D35] text-[#ABB2BF]"
              )}
              aria-label="Toggle chat"
            >
              <MessageSquareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
              {comments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="p-7 max-md:p-5 max-sm:p-3 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <section className="flex flex-col gap-5">
          <div className={cn(
            "aspect-video rounded-[16px] overflow-hidden bg-[#1A1D24] relative",
            session.status === "live" && "ring-2 ring-primary"
          )}>
            {session.status === "live" && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#E74C3C] text-white px-3 py-1 rounded-full text-[12px] font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                EN VIVO
              </div>
            )}

            {currentProduct ? (
              <div className="w-full h-full flex flex-col">
                <div className="relative flex-1 bg-[#1A1D24]">
                  {currentProduct.products?.product_images?.[0] && (
                    <img
                      src={currentProduct.products.product_images[0].image}
                      alt={currentProduct.products.name}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold",
                        productStatusConfig[currentProduct.status as keyof typeof productStatusConfig]?.color
                      )}>
                        {productStatusConfig[currentProduct.status as keyof typeof productStatusConfig]?.label}
                      </span>
                      <span className="text-primary font-semibold text-lg">
                        {formatCurrency(currentProduct.products.discount_price ?? currentProduct.products.price)}
                      </span>
                    </div>
                    <h3 className="text-white text-xl font-bold">{currentProduct.products.name}</h3>
                  </div>
                </div>
                <div className="p-4 bg-secondary-light border-t border-white/12 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateLiveProductStatus(currentProduct.product_id, "available")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        currentProduct.status === "available"
                          ? "bg-[#27AE60] text-white"
                          : "bg-[#27AE60]/15 text-[#27AE60]"
                      )}
                    >
                      Disponible
                    </button>
                    <button
                      onClick={() => handleUpdateLiveProductStatus(currentProduct.product_id, "requested")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        currentProduct.status === "requested"
                          ? "bg-[#C9A96E] text-white"
                          : "bg-[#C9A96E]/15 text-[#C9A96E]"
                      )}
                    >
                      Solicitado
                    </button>
                    <button
                      onClick={() => handleUpdateLiveProductStatus(currentProduct.product_id, "reserved")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        currentProduct.status === "reserved"
                          ? "bg-[#03C9D7] text-white"
                          : "bg-[#03C9D7]/15 text-[#03C9D7]"
                      )}
                    >
                      Reservado
                    </button>
                    <button
                      onClick={() => handleUpdateLiveProductStatus(currentProduct.product_id, "sold")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        currentProduct.status === "sold"
                          ? "bg-[#E74C3C] text-white"
                          : "bg-[#E74C3C]/15 text-[#E74C3C]"
                      )}
                    >
                      Vendido
                    </button>
                  </div>
                  <Link
                    href={`/admin/products/${currentProduct.product_id}/editar`}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors no-underline"
                    prefetch={false}
                    target="_blank"
                  >
                    Editar producto
                  </Link>
                </div>
              </div>
            ) : session.status === "live" ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3B8]">
                <BroadcastIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Selecciona un producto actual para mostrar en vivo</p>
                <p className="text-sm mt-1">Usa el panel lateral para elegir el producto en pantalla</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3B8]">
                <BroadcastIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Sesión: {session.status === "not_started" ? "No iniciada" : session.status === "paused" ? "Pausada" : "Finalizada"}</p>
                <p className="text-sm mt-1">Inicia la sesión para comenzar la transmisión</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <EyeIcon className="w-4 h-4" />
                <span>Espectadores</span>
              </div>
              <div className="text-3xl font-bold text-white">{viewers}</div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <HeartIcon className="w-4 h-4" />
                <span>Likes</span>
              </div>
              <div className="text-3xl font-bold text-white">{likes}</div>
            </div>
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
              <div className="flex items-center gap-2 text-[#9CA3B8] text-sm mb-2">
                <ShoppingBagIcon className="w-4 h-4" />
                <span>Vendidos</span>
              </div>
              <div className="text-3xl font-bold text-[#27AE60]">{session.total_products_sold ?? 0}</div>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Productos de la Sesión</h3>
              <span className="text-[10px] bg-[#C9A96E] text-white px-1.5 py-0.5 rounded font-semibold">BETA</span>
            </div>

            {session.status !== "ended" && (
              <div className="mb-4 p-3 bg-[#2A2D35] rounded-xl border border-white/12">
                <p className="text-[#ABB2BF] text-xs mb-3">Producto actual en pantalla</p>
                <select
                  value={currentProductId || ""}
                  onChange={(e) => handleSetCurrentProduct(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1A1D24] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">— Seleccionar —</option>
                  {session.live_products?.map((lp) => (
                    <option key={lp.product_id} value={lp.product_id}>
                      {lp.products?.name} {lp.product_id === currentProductId ? "✓" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {session.live_products?.map((lp) => {
                const product = lp.products
                const cfg = productStatusConfig[lp.status as keyof typeof productStatusConfig]
                const price = product?.discount_price ?? product?.price
                const isCurrent = lp.product_id === currentProductId

                return (
                  <div
                    key={lp.product_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isCurrent
                        ? "bg-primary/10 border-primary/30"
                        : "bg-[#2A2D35] border-white/12 hover:border-primary/20"
                    )}
                  >
                    {product?.product_images?.[0] && (
                      <img
                        src={product.product_images[0].image}
                        alt={product?.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{product?.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-white">EN VIVO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#ABB2BF]">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", cfg?.color)}>
                          {cfg?.label}
                        </span>
                        <span className="text-primary font-semibold">Bs. {price?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {lp.status !== "sold" && (
                        <select
                          value={lp.status}
                          onChange={(e) => handleUpdateLiveProductStatus(lp.product_id, e.target.value as any)}
                          className="px-2 py-1 rounded bg-[#1A1D24] border border-white/12 text-white text-[11px] outline-none focus:border-primary"
                        >
                          <option value="available">Disponible</option>
                          <option value="requested">Solicitado</option>
                          <option value="reserved">Reservado</option>
                          <option value="sold">Vendido</option>
                        </select>
                      )}
                      {!isCurrent && session.status === "live" && (
                        <button
                          onClick={() => handleSetCurrentProduct(lp.product_id)}
                          className="px-2 py-1 rounded bg-primary/15 text-primary text-[11px] font-semibold hover:bg-primary/25 transition-colors border-none cursor-pointer"
                        >
                          Mostrar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {(!session.live_products || session.live_products.length === 0) && (
                <div className="text-center py-8 text-[#9CA3B8]">
                  <BroadcastIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay productos asignados</p>
                  <p className="text-xs mt-1">Ve a Editar para agregar productos</p>
                </div>
              )}
            </div>
          </div>

          {showChat && (
            <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5 flex flex-col h-[400px] animate-slide-in-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <MessageSquareIcon className="w-5 h-5" />
                  Chat en Vivo
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 text-[#9CA3B8] hover:text-white transition-colors"
                  aria-label="Cerrar chat"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: "280px" }}>
                {comments.map((c) => (
                  <div key={c.id} className="bg-[#2A2D35] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{c.user}</span>
                      <span className="text-[#9CA3B8] text-[11px]">{c.time}</span>
                    </div>
                    <p className="text-[#ABB2BF] text-sm">{c.message}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center text-[#9CA3B8] text-sm py-8">
                    No hay mensajes aún
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newComment.trim()) return
                  const msg = {
                    id: Date.now(),
                    user: "Admin",
                    message: newComment.trim(),
                    time: new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
                  }
                  setComments((prev) => [...prev, msg])
                  setNewComment("")
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[#2A2D35] border border-white/12 text-white text-sm outline-none focus:border-primary transition-colors"
                />
                <Button type="submit" variant="primary" size="sm">
                  Enviar
                </Button>
              </form>
            </div>
          )}

          <div className="bg-secondary-light border border-white/12 rounded-[16px] p-5">
            <h3 className="text-white font-bold mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              {session.status === "not_started" && (
                <button
                  onClick={() => handleStatusChange("live")}
                  className="col-span-2 py-3 rounded-lg bg-[#27AE60] text-white font-semibold hover:bg-[#27AE60]/90 transition-colors"
                >
                  <BroadcastIcon className="w-4 h-4 inline mr-1" />
                  Iniciar Transmisión
                </button>
              )}
              {session.status === "live" && (
                <>
                  <button
                    onClick={() => handleStatusChange("paused")}
                    className="py-3 rounded-lg bg-[#C9A96E] text-white font-semibold hover:bg-[#C9A96E]/90 transition-colors"
                  >
                    <PauseIcon className="w-4 h-4 inline mr-1" />
                    Pausar
                  </button>
                  <button
                    onClick={() => handleStatusChange("ended")}
                    className="py-3 rounded-lg bg-[#E74C3C] text-white font-semibold hover:bg-[#E74C3C]/90 transition-colors"
                  >
                    <StopIcon className="w-4 h-4 inline mr-1" />
                    Finalizar
                  </button>
                </>
              )}
              {session.status === "paused" && (
                <>
                  <button
                    onClick={() => handleStatusChange("live")}
                    className="py-3 rounded-lg bg-[#27AE60] text-white font-semibold hover:bg-[#27AE60]/90 transition-colors"
                  >
                    <PlayCircleIcon className="w-4 h-4 inline mr-1" />
                    Reanudar
                  </button>
                  <button
                    onClick={() => handleStatusChange("ended")}
                    className="py-3 rounded-lg bg-[#E74C3C] text-white font-semibold hover:bg-[#E74C3C]/90 transition-colors"
                  >
                    <StopIcon className="w-4 h-4 inline mr-1" />
                    Finalizar
                  </button>
                </>
              )}
              {session.status === "ended" && (
                <button
                  onClick={() => handleStatusChange("not_started")}
                  className="col-span-2 py-3 rounded-lg bg-[#2A2D35] text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Reiniciar Sesión
                </button>
              )}
            </div>
          </div>
        </aside>
      </main>

    </div>
  )
}