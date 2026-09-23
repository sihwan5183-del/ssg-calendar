import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  size = 'md',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'xl'
}) {
  const sizeCls = size === 'xl' ? 'w-[94vw] max-w-2xl h-[88vh]' : 'w-full sm:max-w-md max-h-[88vh]'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className={`${sizeCls} flex flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-xl`}>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-100">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
