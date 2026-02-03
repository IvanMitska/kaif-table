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
  const { t, language, setLanguage } = useLanguage()
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
        data-backdrop
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        style={{
          transition: 'opacity 0.4s ease-out, visibility 0.4s ease-out'
        }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        data-sidebar
        className={cn(
          "fixed inset-y-0 z-50 bg-white shadow-2xl lg:shadow-none flex flex-col",
          "right-0 lg:left-0 lg:right-auto border-l lg:border-l-0 lg:border-r border-border/50",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          "w-[85vw] max-w-[320px]"
        )}
        style={{
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform'
        }}
      >
        {/* Logo */}
        <div className={cn(
          "h-20 lg:h-16 flex items-center border-b border-border/50 px-4",
          sidebarCollapsed ? "lg:justify-center" : "justify-between"
        )}>
          <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img
              src="/logo/kaif-logo.jpg"
              alt="KAIF"
              className="w-12 h-12 lg:w-10 lg:h-10 rounded-2xl lg:rounded-xl object-cover shadow-lg"
            />
            {!sidebarCollapsed && (
              <span className="font-bold text-2xl lg:text-xl bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                KAIF
              </span>
            )}
          </Link>
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl active:scale-95 transition-transform"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6 text-slate-500" />
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
        <nav className="flex-1 p-4 pt-6 space-y-2 lg:space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 lg:py-2.5 rounded-2xl text-base lg:text-sm font-medium transition-all active:scale-[0.98]",
                  isActive
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-purple-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  sidebarCollapsed && "lg:justify-center lg:px-2"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn("h-6 w-6 lg:h-5 lg:w-5 flex-shrink-0", isActive && "text-white")} />
                {!sidebarCollapsed && <span className="lg:block">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Language switcher - mobile only */}
        <div className="lg:hidden px-4 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setLanguage('ru')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                language === 'ru'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              🇷🇺 Русский
            </button>
            <button
              onClick={() => setLanguage('th')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                language === 'th'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              🇹🇭 ไทย
            </button>
          </div>
        </div>

        {/* User section */}
        <div className={cn(
          "p-4 border-t border-border/50",
          sidebarCollapsed && "lg:flex lg:flex-col lg:items-center"
        )}>
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100",
            sidebarCollapsed && "lg:flex-col lg:p-2"
          )}>
            <div className="w-12 h-12 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl lg:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg lg:text-base">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-base lg:text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-sm lg:text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={cn(
              "w-full mt-3 justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 h-12 lg:h-10 text-base lg:text-sm rounded-xl",
              sidebarCollapsed && "lg:justify-center"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 lg:h-4 lg:w-4" />
            {!sidebarCollapsed && <span className="ml-3">{t.nav.logout}</span>}
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
          <h1 className="text-lg font-semibold text-slate-900">
            {navigation.find(n => n.href === location.pathname)?.name || 'KAIF Finance'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl active:scale-95 transition-transform"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}
