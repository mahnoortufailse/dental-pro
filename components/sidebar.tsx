"use client"

import Link from "next/link"
import { useAuth } from "./auth-context"
import { useRouter, usePathname } from "next/navigation"
import {
  Users,
  Calendar,
  FileText,
  Package,
  Users2,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Menu,
  X,
  Table,
} from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

export function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getMenuItems = () => {
    const baseItems = [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]

    if (user?.role === "admin") {
      return [
        ...baseItems,
        { label: "Patients", href: "/dashboard/patients", icon: Users },
        { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Appointments Table", href: "/dashboard/appointments-table", icon: Table },
        { label: "Medical Reports", href: "/dashboard/medical-reports", icon: FileText },
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
        { label: "Appointments Table", href: "/dashboard/appointments-table", icon: Table },
        { label: "Patients Reports", href: "/dashboard/medical-reports", icon: FileText },
        { label: "Clinical Tools", href: "/dashboard/clinical-tools", icon: Stethoscope },
      ]
    }

    if (user?.role === "receptionist") {
      return [
        ...baseItems,
        { label: "Patients", href: "/dashboard/patients", icon: Users },
        { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Appointments Table", href: "/dashboard/appointments-table", icon: Table },
        { label: "Medical Reports", href: "/dashboard/medical-reports", icon: FileText },
        { label: "Billing", href: "/dashboard/billing", icon: FileText },
      ]
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  const isActive = (href: string) => pathname === href

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sidebar-foreground hover:text-sidebar-accent transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        {/* Logo with Image */}
        <div className="text-center ">
          <div className="inline-flex items-center justify-center ml-2">
            <Image
              src="/logo.jpeg"
              alt="DR. MOHAMMAD ALSHEIKH DENTAL CENTER"
              width={140}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {isOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />}

      <aside
        className={`fixed md:relative w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border !scrollbar-none transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Desktop Header */}
        <div className="hidden md:block p-6 border-b border-sidebar-border">
          <div className=" mb-8 sm:mb-4">
            <div className="inline-flex items-center justify-center ">
              <Image
                src="/logo.jpeg"
                alt="DR. MOHAMMAD ALSHEIKH DENTAL CENTER"
                width={180}
                height={70}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="text-xs font-semibold text-sidebar-accent uppercase tracking-wider">{user?.role}</p>
        </div>

        {/* Mobile Header Spacing */}
        <div className="md:hidden h-16" />

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-hidden ">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          {/* <div className="text-sm">
            <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wider">Logged in as</p>
            <p className="font-semibold text-sidebar-foreground truncate">{user?.name}</p>
          </div> */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 768px) {
          main {
            padding-top: 4rem;
          }
        }
      `}</style>
    </>
  )
}
