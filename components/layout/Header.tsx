"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductSearch } from "@/components/shop/ProductSearch"
import { useTheme, type Theme } from "@/components/theme/ThemeProvider"

const THEME_VALUES = ["light", "dark", "system"] as const

const THEME_LABELS: Record<Theme, string> = {
  light: "Modo día",
  dark: "Modo noche",
  system: "Usar del sistema",
}

function ThemeIcon({ value }: { value: Theme }) {
  if (value === "light") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    )
  }
  if (value === "dark") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface HeaderCategory {
  name: string
  slug: string
}

interface HeaderStoreProfile {
  likes: number
  followers: number
  rating: number
  reviewsCount: number
}

interface HeaderLiveSession {
  title: string
}

interface HeaderProps {
  categories?: HeaderCategory[]
  storeProfile?: HeaderStoreProfile | null
  activeLive?: HeaderLiveSession | null
  cartCount?: number
}

export function Header({
  categories = [],
  storeProfile = null,
  activeLive = null,
  cartCount = 0,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchHidden, setSearchHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)
  const scrollAccum = useRef(0)
  const lockUntil = useRef(0)
  const scrollRaf = useRef<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  useEffect(() => {
    const onCartChanged = () => router.refresh()
    window.addEventListener("cart:changed", onCartChanged)
    return () => window.removeEventListener("cart:changed", onCartChanged)
  }, [router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user)).catch(() => setIsLoggedIn(false))
    }
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const NAV_LOCK_MS = 350
    lastScrollY.current = window.scrollY
    lockUntil.current = performance.now() + NAV_LOCK_MS
  }, [pathname])

  useEffect(() => {
    const MIN_DELTA = 3
    const DIR_SWITCH = 24
    const HIDE_AFTER = 120
    const LOCK_MS = 450

    const handleScroll = () => {
      if (scrollRaf.current !== null) return
      scrollRaf.current = window.requestAnimationFrame(() => {
        scrollRaf.current = null
        const now = performance.now()
        const y = window.scrollY
        const delta = y - lastScrollY.current
        lastScrollY.current = y

        if (now < lockUntil.current) return

        if (Math.abs(delta) < MIN_DELTA) return

        const nowDown = delta > 0
        const prevDown = scrollAccum.current >= 0
        if (nowDown === prevDown) {
          scrollAccum.current += delta
        } else {
          scrollAccum.current = delta
        }

        if (Math.abs(scrollAccum.current) < DIR_SWITCH) return

        const downward = scrollAccum.current > 0
        scrollAccum.current = 0
        lockUntil.current = now + LOCK_MS

        if (downward && y > HIDE_AFTER) {
          setSearchHidden(true)
        } else if (!downward) {
          setSearchHidden(false)
        }
      })
    }
    lastScrollY.current = window.scrollY
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollRaf.current !== null) window.cancelAnimationFrame(scrollRaf.current)
    }
  }, [])

  const navCategories = categories.slice(0, 4)

  return (
    <>
      {activeLive ? (
        <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f0f1a] text-white text-[13px] py-2 text-center border-b-2 border-[#27AE60]">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-5 flex-wrap justify-center">
            <span className="inline-block bg-[#E74C3C] text-white px-4 py-1.5 rounded-full text-[13px] font-bold tracking-[1px] animate-pulse">
              🔴 EN VIVO
            </span>
            <strong>{activeLive.title}</strong>
            {storeProfile && (
              <span className="text-sm opacity-80 flex gap-4 flex-wrap">
                <span>❤️ {storeProfile.likes}</span>
                <span>👥 {storeProfile.followers} seguidores</span>
                <span>⭐ {storeProfile.rating}</span>
                <span>💬 {storeProfile.reviewsCount} reseñas</span>
              </span>
            )}
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300 cursor-pointer border-none font-sans whitespace-nowrap no-underline px-5 py-2.5 text-xs bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_15px_rgba(255,142,159,0.3)] hover:-translate-y-0.5"
            >
              Ver productos
            </Link>
          </div>
        </div>
      ) : pathname === "/" ? (
        <div className="bg-[#2D2D2D] text-white text-[12px] py-2 text-center tracking-[1px] uppercase">
          <div className="max-w-7xl mx-auto px-4">
            NO TE PIERDAS NUESTROS LIVES <span className="text-[#C9A96E]">•</span> ÚNETE A NUESTRO GRUPO DE WHATSAPP
          </div>
        </div>
      ) : null}

      <header
        className={`sticky top-0 z-[1000] bg-white dark:bg-page/80 dark:backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_15px_rgba(255,142,159,0.12)]" : "shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 max-w-7xl mx-auto">
          <Link href="/" className="flex items-baseline gap-1 text-[28px] no-underline">
            <span className="font-['Great_Vibes',cursive] text-[24px] text-primary">
              Liz
            </span>
            <span className="font-['Cinzel',serif] text-[14px] text-[#2D2D2D] dark:text-ink-strong font-medium tracking-[2px] uppercase">
              Store
            </span>
          </Link>

          <nav className="flex items-center gap-7.5 max-md:hidden">
            <Link
              href="/"
              className="text-[#4A4A4A] dark:text-ink no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="text-[#4A4A4A] dark:text-ink no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              Catálogo
            </Link>
            <Link
              href="/ofertas"
              className="text-[#4A4A4A] dark:text-ink no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              Ofertas
            </Link>
            {navCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="text-[#4A4A4A] dark:text-ink no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/faq"
              className="text-[#4A4A4A] dark:text-ink no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <div className="relative">
              {isLoggedIn ? (
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="text-[#2D2D2D] dark:text-ink-strong text-xl transition-colors duration-300 hover:text-primary cursor-pointer bg-none border-none"
                  title="Mi cuenta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>
              ) : (
                <Link
                  href="/perfil"
                  className="text-[#2D2D2D] dark:text-ink-strong no-underline text-xl transition-colors duration-300 hover:text-primary"
                  title="Mi perfil"
                  prefetch={false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>
              )}
              {profileOpen && isLoggedIn && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-surface-elevated/95 dark:backdrop-blur-md rounded-xl shadow-lg border border-[#eee] dark:border-line min-w-[180px] py-2">
                    <Link
                      href="/perfil"
                      className="block px-4 py-2.5 text-sm text-[#2D2D2D] dark:text-ink-strong no-underline hover:bg-[#F9F9F9] dark:hover:bg-surface-elevated hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/perfil/historial"
                      className="block px-4 py-2.5 text-sm text-[#2D2D2D] dark:text-ink-strong no-underline hover:bg-[#F9F9F9] dark:hover:bg-surface-elevated hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      Mis pedidos
                    </Link>
                    <hr className="border-t border-[#eee] dark:border-line mx-3" />
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#E74C3C] dark:text-[#FF8A80] hover:bg-[#FFF5F5] dark:hover:bg-[#2A1618] transition-colors cursor-pointer bg-none border-none"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Ajustes y tema"
              title="Ajustes"
              className="text-[#2D2D2D] dark:text-ink-strong transition-colors duration-300 hover:text-primary cursor-pointer bg-none border-none flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.9" />
                <circle cx="12" cy="12" r="1.9" />
                <circle cx="12" cy="19" r="1.9" />
              </svg>
            </button>
            <Link
              href="/carrito"
              className="max-md:hidden text-[#2D2D2D] dark:text-ink-strong no-underline text-xl transition-colors duration-300 relative hover:text-primary"
              title="Carrito"
              prefetch={false}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-primary text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div
          className={`max-md:block hidden px-5 max-w-7xl mx-auto overflow-hidden transition-all duration-300 ease-in-out ${
            searchHidden
              ? "max-md:max-h-0 max-md:pb-0 max-md:opacity-0 max-md:pointer-events-none"
              : "max-md:max-h-24 max-md:pb-3.5 max-md:opacity-100"
          }`}
          aria-hidden={searchHidden || undefined}
        >
          <ProductSearch className="w-full" />
        </div>
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-[1200] bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Ajustes"
            className="fixed top-0 right-0 z-[1201] h-full w-[300px] max-w-[86vw] bg-white dark:bg-surface/95 dark:backdrop-blur-md shadow-[-8px_0_30px_rgba(0,0,0,0.18)] animate-slide-in-right flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEE] dark:border-line">
              <span className="text-[15px] font-semibold text-[#2D2D2D] dark:text-ink-strong">Ajustes</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#6B6B6B] dark:text-ink-soft hover:bg-[#F5F5F5] dark:hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-[#4A4A4A] dark:text-ink no-underline hover:bg-[#F5F5F5] dark:hover:bg-white/5 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5 12 3l9 6.5" />
                  <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
                </svg>
                <span>Inicio</span>
              </Link>

              <p className="px-3 mt-4 mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#9E9E9E] dark:text-ink-soft">Tema</p>
              <div className="flex flex-col gap-1">
                {THEME_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-left transition-colors cursor-pointer border-none ${
                      theme === value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-[#4A4A4A] dark:text-ink hover:bg-[#F5F5F5] dark:hover:bg-white/5"
                    }`}
                  >
                    <ThemeIcon value={value} />
                    <span className="flex-1">{THEME_LABELS[value]}</span>
                    {theme === value && <CheckIcon />}
                  </button>
                ))}
              </div>

              <p className="px-3 mt-5 mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-[#9E9E9E] dark:text-ink-soft">Cuenta</p>
              <div className="flex flex-col gap-1">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-[#4A4A4A] dark:text-ink no-underline hover:bg-[#F5F5F5] dark:hover:bg-white/5 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Mi perfil</span>
                    </Link>
                    <Link
                      href="/perfil/historial"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-[#4A4A4A] dark:text-ink no-underline hover:bg-[#F5F5F5] dark:hover:bg-white/5 hover:text-primary transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 8V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                        <path d="M1 3h15v13H1z" />
                        <path d="M16 8h4l3 3v5h-7z" />
                      </svg>
                      <span>Mis pedidos</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-left text-[#E74C3C] dark:text-[#FF8A80] hover:bg-[#FFF5F5] dark:hover:bg-[#2A1618] transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] text-[#4A4A4A] dark:text-ink no-underline hover:bg-[#F5F5F5] dark:hover:bg-white/5 hover:text-primary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Iniciar sesión</span>
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
