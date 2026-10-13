"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { FaHome, FaTag, FaStore, FaShoppingCart } from "react-icons/fa"

interface BottomNavProps {
  cartCount: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  exact: boolean
  searchParams?: Record<string, string>
}

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: FaHome, exact: true },
  { href: "/ofertas", label: "Ofertas", icon: FaTag, exact: true },
  { href: "/productos", label: "Catálogo", icon: FaStore, exact: false, searchParams: {} },
  { href: "/carrito", label: "Carrito", icon: FaShoppingCart, exact: true },
]

export function BottomNav({ cartCount }: BottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href
    if (pathname !== item.href) return false
    if (!item.searchParams || Object.keys(item.searchParams).length === 0) return true
    return Object.entries(item.searchParams).every(([k, v]) => searchParams.get(k) === v)
  }

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)]"
    >
      <div
        className="bg-white dark:bg-page/80 dark:backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_-1px_3px_rgba(0,0,0,0.45)]"
        role="tablist"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.searchParams && Object.keys(item.searchParams).length > 0
                  ? `${item.href}?${new URLSearchParams(item.searchParams as Record<string, string>).toString()}`
                  : item.href}
                role="tab"
                aria-selected={active}
                aria-label={item.label}
                className={`relative flex flex-col items-center gap-1 px-3 py-2.5 min-w-[67px] min-h-[46px] transition-all duration-200 ${
                  active
                    ? "text-primary dark:text-primary"
                    : "text-ink-soft dark:text-ink-soft"
                }`}
                prefetch={false}
              >
                <span className="relative z-10 flex items-center justify-center" aria-hidden="true">
                  <Icon size={23} />
                </span>
                <span className="relative z-10 text-[10.5px] font-medium leading-none tracking-[0.2px]">
                  {item.label}
                </span>
                {item.href === "/carrito" && cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-5 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center px-1.5"
                    aria-label={`${cartCount} productos en el carrito`}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}