import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'error'
type ToastItem = { id: number; message: string; kind: ToastKind }

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {})

/** 轻提示：一次只显示一条，避免叠在一起挡住内容。 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null)

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now()
    setToast({ id, message, kind })
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 2400)
  }, [])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-6">
        {toast && (
          <div
            className={`animate-rise rounded-full px-4 py-2 text-sm font-medium shadow-soft backdrop-blur ${
              toast.kind === 'error'
                ? 'bg-red-500/90 text-white'
                : toast.kind === 'success'
                  ? 'bg-lake-600/95 text-white'
                  : 'bg-ink/85 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
