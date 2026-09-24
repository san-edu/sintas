import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { PageLoader } from '../components/feedback/PageLoader'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { RoleRoute } from '../components/layout/RoleRoute'
import { ROLES, roleHome } from '../lib/permissions'
import { useSessionStore } from '../stores/sessionStore'
import AdminDashboardPage from '../pages/admin/DashboardPage'
import AdminAcademicPage from '../pages/admin/AcademicPage'
import AdminBannersPage from '../pages/admin/BannersPage'
import AdminPlottingPage from '../pages/admin/PlottingPage'
import AdminReportsPage from '../pages/admin/ReportsPage'
import AdminUsersPage from '../pages/admin/UsersPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import LoginPage from '../pages/auth/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/profile/ProfilePage'
import StudentDashboardPage from '../pages/student/DashboardPage'
import StudentHistoryPage from '../pages/student/HistoryPage'
import StudentScanPage from '../pages/student/ScanPage'
import StudentSchedulePage from '../pages/student/SchedulePage'
import TeacherAssignmentsPage from '../pages/teacher/AssignmentsPage'
import TeacherClassAttendancePage from '../pages/teacher/ClassAttendancePage'
import TeacherCreateSessionPage from '../pages/teacher/CreateSessionPage'
import TeacherDashboardPage from '../pages/teacher/DashboardPage'
import TeacherSessionQrPage from '../pages/teacher/SessionQrPage'
import TeacherSessionsPage from '../pages/teacher/SessionsPage'

function RoleHome() {
  const user = useSessionStore((state) => state.user)
  return <Navigate to={roleHome(user?.role)} replace />
}

function RootRoute() {
  const location = useLocation()
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)

  if (status === 'loading') return <PageLoader />
  if (user) return <Navigate to={roleHome(user.role)} replace state={{ from: location }} />
  return <Navigate to="/login" replace state={{ from: location }} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<RoleHome />} />
          <Route path="student" element={<RoleRoute roles={[ROLES.STUDENT]} />}>
            <Route index element={<StudentDashboardPage />} />
            <Route path="schedule" element={<StudentSchedulePage />} />
            <Route path="scan" element={<StudentScanPage />} />
            <Route path="history" element={<StudentHistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="teacher" element={<RoleRoute roles={[ROLES.TEACHER]} />}>
            <Route index element={<TeacherDashboardPage />} />
            <Route path="assignments" element={<TeacherAssignmentsPage />} />
            <Route path="sessions" element={<TeacherSessionsPage />} />
            <Route path="sessions/new" element={<TeacherCreateSessionPage />} />
            <Route path="sessions/:sessionId/qr" element={<TeacherSessionQrPage />} />
            <Route
              path="classes/:classId/attendance"
              element={<TeacherClassAttendancePage />}
            />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="admin" element={<RoleRoute roles={[ROLES.ADMIN]} />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="academic" element={<AdminAcademicPage />} />
            <Route path="plotting" element={<AdminPlottingPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}