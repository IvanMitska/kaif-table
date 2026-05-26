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

  const pageTitle = navigation.find((n) => n.href === location.pathname)?.name || 'KAIF Finance'

  return (
    <div className="flex h-screen h-dvh overflow-hidden lg:p-3 lg:gap-3">
      {/* Mobile sidebar backdrop */}
      <div
        data-backdrop
        className={cn(
          'fixed inset-0 z-40 bg-[#0a0a0a]/45 lg:hidden',
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        style={{ transition: 'opacity 0.3s var(--ease), visibility 0.3s var(--ease)' }}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar — floating dark panel.
          On mobile it slides in from the LEFT (drawer convention, matches
          its desktop position). On lg+ it's a static flex column. */}
      <aside
        data-sidebar
        className={cn(
          'sidebar-dark flex flex-col z-50 flex-shrink-0',
          'fixed inset-y-0 left-0 w-[84vw] max-w-[296px] lg:relative lg:inset-auto lg:rounded-[24px] lg:max-w-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[78px]' : 'lg:w-[248px]'
        )}
        style={{
          transition: 'transform 0.36s var(--ease-out-quart), width 0.3s var(--ease)',
        }}
      >
        {/* Header */}
        <div
          className={cn(
            'relative h-[68px] flex items-center gap-2 px-3.5 flex-shrink-0 justify-between',
            sidebarCollapsed && 'lg:justify-center lg:px-0'
          )}
        >
          <Link
            to="/"
            className={cn(
              'flex items-center gap-2.5 min-w-0',
              sidebarCollapsed && 'lg:hidden'
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src="/logo/kaif-logo.jpg"
              alt="KAIF"
              className="w-9 h-9 rounded-[10px] object-cover ring-1 ring-white/10 flex-shrink-0"
            />
            <span className="font-bold text-[17px] tracking-[-0.01em] text-white">
              KAIF
            </span>
          </Link>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-press hidden lg:flex w-8 h-8 items-center justify-center rounded-[10px] text-white/55 hover:text-white hover:bg-white/8 flex-shrink-0"
            title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            <ChevronLeft
              className={cn('h-[18px] w-[18px] transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
              strokeWidth={1.8}
            />
          </button>

          {/* Close — mobile only */}
          <button
            className="btn-press lg:hidden w-9 h-9 flex items-center justify-center rounded-[10px] text-white/60 hover:bg-white/8 flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 pt-3 space-y-1 overflow-y-auto scroll-refined">
          {!sidebarCollapsed && (
            <p className="eyebrow !text-white/35 px-3 pb-1.5 pt-1">
              {language === 'ru' ? 'Меню' : 'เมนู'}
            </p>
          )}
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'nav-item-dark btn-press',
                  isActive && 'nav-item-dark-active',
                  sidebarCollapsed && 'lg:justify-center lg:px-0'
                )}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="nav-icon h-[18px] w-[18px]" strokeWidth={1.8} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Language switcher — mobile only */}
        <div className="lg:hidden px-3 pb-3">
          <div className="flex items-center gap-1 p-1 bg-white/[0.06] rounded-full border border-white/8">
            <button
              onClick={() => setLanguage('ru')}
              className={cn(
                'btn-press flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-full transition-colors',
                language === 'ru'
                  ? 'bg-white text-[#0a0a0a]'
                  : 'text-white/55 hover:text-white'
              )}
            >
              <span className="text-[13px]">🇷🇺</span> RU
            </button>
            <button
              onClick={() => setLanguage('th')}
              className={cn(
                'btn-press flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-full transition-colors',
                language === 'th'
                  ? 'bg-white text-[#0a0a0a]'
                  : 'text-white/55 hover:text-white'
              )}
            >
              <span className="text-[13px]">🇹🇭</span> TH
            </button>
          </div>
        </div>

        {/* User section */}
        <div className="relative p-3 border-t border-white/8">
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-[14px] bg-white/5',
              sidebarCollapsed && 'lg:justify-center lg:p-1.5'
            )}
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#dcfa45] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0a0a0a] font-bold text-[14px]">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-white/45 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              'btn-press mt-2 w-full flex items-center gap-2.5 px-3 h-10 rounded-[12px] text-[13px] font-medium',
              'text-white/55 hover:text-white hover:bg-white/6',
              sidebarCollapsed && 'lg:justify-center lg:px-0'
            )}
            title={sidebarCollapsed ? t.nav.logout : undefined}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.8} />
            {!sidebarCollapsed && <span>{t.nav.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar — on mobile a flush bar with only a bottom hairline,
            on lg+ a glass card matching the floating sidebar. */}
        <header className="flex-shrink-0 h-[60px] lg:h-[58px] flex items-center justify-between px-4 lg:px-5 bg-white/[0.82] border-b border-[#ebe9e3] lg:border lg:border-[#ebe9e3] lg:rounded-[18px]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="btn-press lg:hidden w-9 h-9 flex items-center justify-center rounded-[10px] text-[#6b6b6b] hover:bg-[#faf9f5]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <h1 className="text-[16px] font-semibold tracking-[-0.01em] text-[#0a0a0a] truncate">
              {pageTitle}
            </h1>
          </div>
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="scroll-refined flex-1 overflow-y-auto mt-3 lg:mt-3 px-4 pb-6 lg:px-0 lg:pb-0">
          <div key={location.pathname} className="page-enter max-w-[1480px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
