"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  DashboardIcon,
  BoxIcon,
  TagsIcon,
  CartIcon,
  UsersIcon,
  BroadcastIcon,
  CogIcon,
  ExternalLinkIcon,
  DashboardSmallIcon,
  LogoutIcon,
} from "./Icons"

interface AdminSidebarProps {
  userName: string
  userEmail: string
  sidebarOpen: boolean
  onClose: () => void
}

const navGroups = [
  {
    title: "Comercio",
    links: [
      { href: "/admin/products", label: "Productos", icon: <BoxIcon /> },
      { href: "/admin/orders", label: "Pedidos", icon: <CartIcon /> },
      { href: "/admin/categories", label: "Categorías", icon: <TagsIcon /> },
    ],
  },
  {
    title: "Usuarios",
    links: [
      { href: "/admin/customers", label: "Clientes", icon: <UsersIcon /> },
    ],
  },
  {
    title: "En Vivo",
    links: [
      { href: "/admin/lives", label: "Lives", icon: <BroadcastIcon /> },
      { href: "/admin/profile", label: "Perfil", icon: <CogIcon /> },
    ],
  },
]

export function AdminSidebar({ userName, userEmail, sidebarOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initial = userName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] hidden max-md:block" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 w-[288px] h-screen bg-secondary border-r border-white/12 flex flex-col z-[1000] overflow-y-auto shadow-lg",
          "max-md:fixed max-md:top-0 max-md:left-0 max-md:h-screen max-md:z-[1000] max-md:transition-transform max-md:duration-300",
          sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        )}
      >
        <div className="px-6 py-5 border-b border-white/12 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 no-underline" prefetch={false}>
            <div className="w-9 h-9 rounded-[10px] bg-primary/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <span className="text-primary text-xl font-bold tracking-tight">Liz Store</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline",
                pathname === "/admin" ? "text-white bg-primary/10" : "text-[#ABB2BF] hover:text-white hover:bg-white/5",
              )}
              prefetch={false}
            >
              <DashboardIcon />
              Dashboard
            </Link>
          </div>

          {navGroups.map((group) => (
            <div key={group.title} className="mt-3 mb-3">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3B8]">
                {group.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.links.map((link) => {
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all no-underline",
                        isActive ? "text-white bg-primary/10" : "text-[#ABB2BF] hover:text-white hover:bg-white/5",
                      )}
                      prefetch={false}
                      onClick={() => { if (window.innerWidth <= 768) onClose() }}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/12 shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userName}</div>
              <div className="text-[11px] text-[#9CA3B8]">Administrador</div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <Link href="/admin" className="flex items-center gap-2 py-1.5 text-xs text-[#ABB2BF] hover:text-primary no-underline transition-colors" prefetch={false}>
              <DashboardSmallIcon /> Dashboard
            </Link>
            <a href="/" target="_blank" className="flex items-center gap-2 py-1.5 text-xs text-[#ABB2BF] hover:text-primary no-underline transition-colors">
              <ExternalLinkIcon /> Ver tienda
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-1.5 text-xs text-[#ABB2BF] hover:text-[#E74C3C] no-underline transition-colors bg-transparent border-none cursor-pointer font-inherit text-left w-full"
            >
              <LogoutIcon /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
