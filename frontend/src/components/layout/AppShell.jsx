import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CampaignRounded from '@mui/icons-material/CampaignRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import GroupOutlined from '@mui/icons-material/GroupOutlined'
import HistoryRounded from '@mui/icons-material/HistoryRounded'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import HubOutlined from '@mui/icons-material/HubOutlined'
import ListAltRounded from '@mui/icons-material/ListAltRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import MenuIcon from '@mui/icons-material/Menu'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthLogout } from '../../hooks/useAuth'
import { ROLES, roleLabel, roleNav, roleSegment } from '../../lib/permissions'
import { useSessionStore } from '../../stores/sessionStore'
import { PageLoader } from '../feedback/PageLoader'
import BottomNav from './BottomNav'

const NAV_ICONS = {
  home: HomeOutlined,
  user: PersonOutlineRounded,
  users: GroupOutlined,
  calendar: CalendarMonthRounded,
  history: HistoryRounded,
  clipboard: ListAltRounded,
  qr: QrCode2Rounded,
  megaphone: CampaignRounded,
  school: SchoolRounded,
  network: HubOutlined,
  chart: BarChartRounded,
}

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

function NavList({ items, orientation = 'vertical', onNavigate }) {
  const horizontal = orientation === 'horizontal'
  return (
    <ul className={horizontal ? 'flex items-center gap-1' : 'space-y-1'}>
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon]
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-radius-md px-3 py-2 text-label-md focus-visible:outline-white ${
                  isActive
                    ? 'bg-white/15 font-semibold text-white'
                    : 'text-school-blue-050 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {item.label}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

function ProfileMenu({ user, onLogout }) {
  return (
    <Menu>
      <MenuButton
        aria-label="Menu akun"
        className="flex items-center gap-2 rounded-radius-pill px-2 py-1 text-white transition hover:bg-white/10 focus-visible:rounded-radius-pill focus-visible:outline-white"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-radius-pill bg-school-blue-050 text-label-md font-semibold text-school-blue-900">
          {initials(user?.name)}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-label-md text-white">{user?.name}</span>
          <span className="block truncate text-caption text-school-blue-050/90">
            {roleLabel(user?.role)}
          </span>
        </span>
        <ExpandMoreRounded className="hidden h-4 w-4 sm:block" aria-hidden="true" />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="z-50 mt-2 w-56 rounded-radius-md border border-line-200 bg-surface-0 p-1 shadow-2 transition focus:outline-none"
      >
        <MenuItem>
          {({ focus }) => (
            <NavLink
              to={`/app/${roleSegment(user?.role)}/profile`}
              className={`flex items-center gap-2 rounded-radius-sm px-3 py-2 text-body-md text-ink-900 ${
                focus ? 'bg-surface-50' : ''
              }`}
            >
              <PersonOutlineRounded className="h-4 w-4 text-ink-500" aria-hidden="true" />
              Profil
            </NavLink>
          )}
        </MenuItem>
        <div className="my-1 h-px bg-line-200" />
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              onClick={onLogout}
              className={`flex w-full items-center gap-2 rounded-radius-sm px-3 py-2 text-body-md text-danger-700 ${
                focus ? 'bg-surface-50' : ''
              }`}
            >
              <LogoutRounded className="h-4 w-4" aria-hidden="true" />
              Keluar
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}

export function AppShell() {
  const user = useSessionStore((state) => state.user)
  const [navOpen, setNavOpen] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthLogout()

  if (logout.isPending) return <PageLoader label="Keluar…" />
  if (!user) return null

  const isStaff = user.role === ROLES.TEACHER || user.role === ROLES.ADMIN

  const handleLogout = async () => {
    setNavOpen(false)
    try {
      await logout.mutateAsync()
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const navItems = roleNav(user.role)
  const mobileMenus = navItems.map((item) => ({
    name: item.label,
    link: item.to,
    end: item.end,
    icon: NAV_ICONS[item.icon],
  }))

  return (
    <div className="min-h-dvh bg-blue-500 lg:bg-surface-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-radius-sm focus:bg-school-blue-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Langsung ke konten
      </a>

      {isStaff ? (
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-blue-500 text-white lg:flex">
          <div className="flex h-16 items-center px-5">
            <span className="text-label-md font-semibold text-white">SINTAS</span>
          </div>
          <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 pb-4">
            <NavList items={navItems} />
          </nav>
          <div className="border-t border-white/10 px-3 py-3">
            <div className="flex items-center gap-2 px-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-radius-pill bg-school-blue-050 text-label-md font-semibold text-school-blue-900">
                {initials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-label-md text-white">{user.name}</span>
                <span className="block truncate text-caption text-school-blue-050/90">
                  {roleLabel(user.role)}
                </span>
              </span>
            </div>
          </div>
        </aside>
      ) : null}

      <div className={isStaff ? 'lg:pl-60' : ''}>
        <header className="sticky top-0 z-30 h-16 bg-blue-500 text-white lg:shadow-none">
          <div className="mx-auto flex h-full max-w-7xl items-center gap-2 px-4">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Buka menu navigasi"
              className="rounded-radius-sm p-2 hover:bg-white/10 focus-visible:outline-white lg:hidden"
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-label-md font-semibold text-white">SINTAS</span>
            {!isStaff ? (
              <nav aria-label="Navigasi utama" className="ml-4 hidden lg:block">
                <NavList items={navItems} orientation="horizontal" />
              </nav>
            ) : null}
            <div className="flex-1" />
            <ProfileMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* Lembaran putih (mobile) / konten normal (desktop) */}
        <div className="mx-auto w-full max-w-md bg-white rounded-t-[60px] pb-36 lg:max-w-none lg:rounded-none lg:bg-transparent lg:pb-0">
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl px-4 py-6 focus:outline-none lg:px-6"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom nav mobile */}
      <div className="lg:hidden">
        <BottomNav menus={mobileMenus} />
      </div>

      <Dialog open={navOpen} onClose={() => setNavOpen(false)} className="relative z-50 lg:hidden">
        <DialogBackdrop className="fixed inset-0 bg-ink-900/50" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative ml-auto flex h-full w-64 flex-col bg-blue-500 text-white shadow-2">
            <div className="flex h-16 items-center justify-between px-4">
              <span className={`text-label-md font-semibold text-white ${isStaff ? 'lg:hidden' : ''}`}>
                SINTAS
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Tutup menu navigasi"
                className="rounded-radius-sm p-2 hover:bg-white/10 focus-visible:outline-white"
              >
                <CloseRounded className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 pb-4">
              <NavList items={navItems} onNavigate={() => setNavOpen(false)} />
            </nav>
            <div className="border-t border-white/10 px-3 py-3">
              <div className="flex items-center gap-2 px-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-pill bg-school-blue-050 text-label-md font-semibold text-school-blue-900">
                  {initials(user.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-label-md text-white">{user.name}</span>
                  <span className="block truncate text-caption text-school-blue-050/90">
                    {roleLabel(user.role)}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-2 rounded-radius-md px-3 py-2 text-label-md text-school-blue-050 hover:bg-white/10 hover:text-white focus-visible:outline-white"
              >
                <LogoutRounded className="h-4 w-4" aria-hidden="true" />
                Keluar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}