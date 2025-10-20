"use client"

import Link from "next/link"
import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { Users, Calendar, FileText, Package, Users2, LayoutDashboard, LogOut, Stethoscope } from "lucide-react"

export function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  /* Updated menu items with icons and role-based organization */
  const getMenuItems = () => {
    const baseItems = [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]

    if (user?.role === "admin") {
      return [
        ...baseItems,
        { label: "Patients", href: "/dashboard/patients", icon: Users },
        { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Billing", href: "/dashboard/billing", icon: FileText },
        { label: "Inventory", href: "/dashboard/inventory", icon: Package },
        { label: "Staff", href: "/dashboard/staff", icon: Users2 },
      ]
    }

    if (user?.role === "doctor") {
      return [
        ...baseItems,
        { label: "My Patients", href: "/dashboard/patients", icon: Users },
        { label: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Clinical Tools", href: "/dashboard/clinical-tools", icon: Stethoscope },
      ]
    }

    if (user?.role === "receptionist") {
      return [
        ...baseItems,
        { label: "Patients", href: "/dashboard/patients", icon: Users },
        { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Billing", href: "/dashboard/billing", icon: FileText },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">DentalCare</h1>
        </div>
        <p className="text-xs font-semibold text-sidebar-accent uppercase tracking-wider">{user?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="text-sm">
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">Logged in as</p>
          <p className="font-semibold text-sidebar-foreground truncate">{user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
