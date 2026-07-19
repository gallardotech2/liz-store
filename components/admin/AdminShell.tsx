"use client"

import { useState } from "react"
import { AdminSidebar } from "./AdminSidebar"
import { AdminNavbar } from "./AdminNavbar"

interface AdminShellProps {
  userName: string
  userEmail: string
  children: React.ReactNode
}

export function AdminShell({ userName, userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-secondary">
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 ml-[288px] max-md:ml-0 flex flex-col min-h-screen">
        <AdminNavbar
          userName={userName}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-7 max-md:p-5 max-sm:p-3">
          {children}
        </main>
      </div>
    </div>
  )
}
