"use client"

import { useState, useEffect, useSyncExternalStore, useCallback } from "react"
import Link from "next/link"
import { parseCart, CART_COOKIE } from "@/lib/cart"
import { createClient } from "@/lib/supabase/client"

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
  cartCount: _cartCount = 0,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const getCartSnapshot = useCallback(() => {
    if (typeof window === "undefined") return _cartCount
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith(`${CART_COOKIE}=`))
      ?.split("=")[1]
    if (!raw) return 0
    try {
      return Object.keys(parseCart(decodeURIComponent(raw))).length
    } catch {
      return 0
    }
  }, [_cartCount])

  const subscribeToCart = useCallback((callback: () => void) => {
    window.addEventListener("cart:changed", callback)
    window.addEventListener("focus", callback)
    window.addEventListener("storage", callback)
    const interval = setInterval(callback, 5000)
    return () => {
      window.removeEventListener("cart:changed", callback)
      window.removeEventListener("focus", callback)
      window.removeEventListener("storage", callback)
      clearInterval(interval)
    }
  }, [])

  const localCartCount = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => 0,
  )

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
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

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
      ) : (
        <div className="bg-[#2D2D2D] text-white text-[12px] py-2 text-center tracking-[1px] uppercase">
          <div className="max-w-7xl mx-auto px-4">
            NO TE PIERDAS NUESTROS LIVES <span className="text-[#C9A96E]">•</span> ÚNETE A NUESTRO GRUPO DE WHATSAPP
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-[1000] bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_15px_rgba(255,142,159,0.12)]" : "shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 max-w-7xl mx-auto">
          <button
            className="hidden max-md:flex flex-col gap-1.25 cursor-pointer bg-none border-none p-1.25"
            onClick={() => setMobileOpen(true)}
            aria-label="Menú"
          >
            <span className="w-6 h-0.5 bg-[#2D2D2D] rounded transition-all duration-300 block" />
            <span className="w-6 h-0.5 bg-[#2D2D2D] rounded transition-all duration-300 block" />
            <span className="w-6 h-0.5 bg-[#2D2D2D] rounded transition-all duration-300 block" />
          </button>

          <Link href="/" className="flex items-baseline gap-1 text-[28px] no-underline">
            <span className="font-['Great_Vibes',cursive] text-[24px] text-primary">
              Liz
            </span>
            <span className="font-['Cinzel',serif] text-[14px] text-[#2D2D2D] font-medium tracking-[2px] uppercase">
              Store
            </span>
          </Link>

          <nav className="flex items-center gap-7.5 max-md:hidden">
            <Link
              href="/"
              className="text-[#4A4A4A] no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="text-[#4A4A4A] no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              Catálogo
            </Link>
            {navCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="text-[#4A4A4A] no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/faq"
              className="text-[#4A4A4A] no-underline text-[14px] font-medium tracking-[0.3px] transition-colors duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <div className="relative">
              {isLoggedIn ? (
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="text-[#2D2D2D] text-xl transition-colors duration-300 hover:text-primary cursor-pointer bg-none border-none"
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
                  className="text-[#2D2D2D] no-underline text-xl transition-colors duration-300 hover:text-primary"
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
                  <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-lg border border-[#eee] min-w-[180px] py-2">
                    <Link
                      href="/perfil"
                      className="block px-4 py-2.5 text-sm text-[#2D2D2D] no-underline hover:bg-[#F9F9F9] hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/perfil/historial"
                      className="block px-4 py-2.5 text-sm text-[#2D2D2D] no-underline hover:bg-[#F9F9F9] hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      Mis pedidos
                    </Link>
                    <hr className="border-t border-[#eee] mx-3" />
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#E74C3C] hover:bg-[#FFF5F5] transition-colors cursor-pointer bg-none border-none"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
            <Link
              href="/carrito"
              className="text-[#2D2D2D] no-underline text-xl transition-colors duration-300 relative hover:text-primary"
              title="Carrito"
              prefetch={false}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {localCartCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-primary text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-semibold">
                  {localCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[2000] bg-white overflow-y-auto px-7.5 pt-20 pb-7.5 ${
          mobileOpen ? "block" : "hidden"
        }`}
      >
        <button
          className="absolute top-5 right-5 text-[28px] bg-none border-none cursor-pointer text-[#2D2D2D]"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          &times;
        </button>
        <Link
          href="/"
          className="block py-4 text-lg text-[#2D2D2D] no-underline border-b border-[#F5F5F5] transition-colors duration-300 hover:text-primary"
          onClick={() => setMobileOpen(false)}
        >
          Inicio
        </Link>
        <Link
          href="/productos"
          className="block py-4 text-lg text-[#2D2D2D] no-underline border-b border-[#F5F5F5] transition-colors duration-300 hover:text-primary"
          onClick={() => setMobileOpen(false)}
        >
          Catálogo
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categorias/${cat.slug}`}
            className="block py-4 text-lg text-[#2D2D2D] no-underline border-b border-[#F5F5F5] transition-colors duration-300 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            {cat.name}
          </Link>
        ))}
        <Link
          href="/faq"
          className="block py-4 text-lg text-[#2D2D2D] no-underline border-b border-[#F5F5F5] transition-colors duration-300 hover:text-primary"
          onClick={() => setMobileOpen(false)}
        >
          FAQ
        </Link>
        <hr className="my-5 border-none border-t border-[#eee]" />
        {isLoggedIn ? (
          <>
            <Link
              href="/perfil"
              className="block py-4 text-lg text-[#2D2D2D] no-underline transition-colors duration-300 hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Mi perfil
            </Link>
            <Link
              href="/perfil/historial"
              className="block py-4 text-lg text-[#2D2D2D] no-underline transition-colors duration-300 hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Mis pedidos
            </Link>
            <hr className="my-4 border-none border-t border-[#eee]" />
            <button
              onClick={() => { setMobileOpen(false); handleLogout() }}
              className="w-full text-left py-4 text-lg text-[#E74C3C] no-underline bg-none border-none cursor-pointer transition-colors duration-300 hover:text-[#C0392B]"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="block py-4 text-lg text-[#2D2D2D] no-underline transition-colors duration-300 hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Ingresar
            </Link>
            <Link
              href="/auth/registro"
              className="block py-4 text-lg text-[#2D2D2D] no-underline transition-colors duration-300 hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </>
  )
}
