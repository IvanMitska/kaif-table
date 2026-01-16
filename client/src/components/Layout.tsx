import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  ChevronLeft,
  FileSpreadsheet,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Store,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui/button'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigation = [
    { name: t.nav.dashboard, href: '/', icon: Home },
    { name: t.nav.transactions, href: '/transactions', icon: FileSpreadsheet },
    { name: t.nav.categories, href: '/categories', icon: FolderOpen },
    { name: t.nav.reports, href: '/reports', icon: BarChart3 },
    { name: t.nav.iiko, href: '/iiko', icon: Store },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-border/50 shadow-2xl lg:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          "w-72"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-border/50 px-4",
          sidebarCollapsed ? "lg:justify-center" : "justify-between"
        )}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent hidden lg:block">
                KAIF
              </span>
            )}
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full items-center justify-center shadow-md hover:bg-muted"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  sidebarCollapsed && "lg:justify-center lg:px-2"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
                {!sidebarCollapsed && <span className="lg:block">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className={cn(
          "p-3 border-t border-border/50",
          sidebarCollapsed && "lg:flex lg:flex-col lg:items-center"
        )}>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-slate-50",
            sidebarCollapsed && "lg:flex-col lg:p-2"
          )}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={cn(
              "w-full mt-2 justify-start text-slate-600 hover:text-red-600 hover:bg-red-50",
              sidebarCollapsed && "lg:justify-center"
            )}
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">{t.nav.logout}</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg mr-3"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">
              {navigation.find(n => n.href === location.pathname)?.name || 'KAIF Finance'}
            </h1>
          </div>
          <LanguageSwitcher />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}
