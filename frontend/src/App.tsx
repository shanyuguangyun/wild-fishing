import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SpotsPage } from './pages/SpotsPage'
import { SpotDetailPage } from './pages/SpotDetailPage'
import { SpotCreatePage } from './pages/SpotCreatePage'
import { LoginPage } from './pages/LoginPage'
import { SoonPage } from './pages/SoonPage'

/**
 * 应用外壳。
 *
 * 移动端优先：内容固定 440px 宽的列，桌面打开时居中显示，
 * 像一个小程序而不是被拉伸的网页。
 */
export default function App() {
  return (
    <div className="min-h-full w-full">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-lake-50/70 shadow-[0_18px_60px_-18px_rgba(16,60,52,0.28)]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/spots" element={<SpotsPage />} />
          <Route path="/spots/new" element={<SpotCreatePage />} />
          <Route path="/spots/:id" element={<SpotDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/soon/:key" element={<SoonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
