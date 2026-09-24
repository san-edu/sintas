export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
})

const ROLE_HOME = Object.freeze({
  STUDENT: '/app/student',
  TEACHER: '/app/teacher',
  ADMIN: '/app/admin',
})

const ROLE_LABEL = Object.freeze({
  STUDENT: 'Siswa',
  TEACHER: 'Guru',
  ADMIN: 'Admin',
})

const ROLE_SEGMENT = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
})

// Navigasi per role (F1/F2): hanya halaman yang tersedia pada fase ini.
// Item berikutnya ditambahkan per fase (lihat docs/DECISIONS.md D12).
const ROLE_NAV = Object.freeze({
  STUDENT: [
    { to: '/app/student', label: 'Beranda', end: true, icon: 'home' },
    { to: '/app/student/schedule', label: 'Jadwal', end: false, icon: 'calendar' },
    { to: '/app/student/history', label: 'Riwayat', end: false, icon: 'history' },
    { to: '/app/student/profile', label: 'Profil', end: true, icon: 'user' },
  ],
  TEACHER: [
    { to: '/app/teacher', label: 'Beranda', end: true, icon: 'home' },
    { to: '/app/teacher/assignments', label: 'Penugasan', end: false, icon: 'clipboard' },
    { to: '/app/teacher/sessions', label: 'Sesi absensi', end: false, icon: 'qr' },
    { to: '/app/teacher/profile', label: 'Profil', end: true, icon: 'user' },
  ],
  ADMIN: [
    { to: '/app/admin', label: 'Beranda', end: true, icon: 'home' },
    { to: '/app/admin/banners', label: 'Banner', end: false, icon: 'megaphone' },
    { to: '/app/admin/users', label: 'Pengguna', end: false, icon: 'users' },
    { to: '/app/admin/academic', label: 'Akademik', end: false, icon: 'school' },
    { to: '/app/admin/plotting', label: 'Penempatan', end: false, icon: 'network' },
    { to: '/app/admin/reports', label: 'Laporan', end: false, icon: 'chart' },
    { to: '/app/admin/profile', label: 'Profil', end: true, icon: 'user' },
  ],
})

export function roleHome(role) {
  return ROLE_HOME[role] ?? '/login'
}

export function roleLabel(role) {
  return ROLE_LABEL[role] ?? role
}

export function roleSegment(role) {
  return ROLE_SEGMENT[role] ?? ''
}

export function roleNav(role) {
  return ROLE_NAV[role] ?? []
}

export function hasRole(user, roles) {
  return Boolean(user && roles.includes(user.role))
}