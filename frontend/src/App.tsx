import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import DownloadsPage from '@/pages/DownloadsPage'
import VPNPage from '@/pages/VPNPage'
import FilesPage from '@/pages/FilesPage'
import LogsPage from '@/pages/LogsPage'
import SettingsPage from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'downloads', element: <DownloadsPage /> },
      { path: 'vpn', element: <VPNPage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
