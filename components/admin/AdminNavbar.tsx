"use client"

import { MenuIcon, BellIcon } from "./Icons"

interface AdminNavbarProps {
  userName: string
  onMenuClick: () => void
}

export function AdminNavbar({ userName, onMenuClick }: AdminNavbarProps) {
  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center justify-between px-7 pt-4 pb-6 max-md:px-5 max-sm:px-3">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl bg-secondary-light text-[#ABB2BF] hover:text-white hover:bg-[#3A3F48] transition-all items-center justify-center hidden max-md:flex border-none cursor-pointer font-inherit shrink-0"
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-full bg-secondary-light text-[#ABB2BF] hover:text-white hover:bg-[#3A3F48] transition-all items-center justify-center flex border-none cursor-pointer font-inherit relative max-sm:hidden">
          <BellIcon />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#03C9D7] border-2 border-secondary" />
        </button>
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 pr-3 rounded-xl hover:bg-secondary-light transition-colors cursor-pointer border-none bg-transparent font-inherit text-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="max-md:hidden">
            <div className="text-[12px] text-[#9CA3B8]">Hola,</div>
            <div className="text-sm font-semibold text-white">{userName}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
