'use client'
import { ReactNode } from 'react'

interface Props { children: ReactNode }

export default function GameLayout({ children }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen w-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,#0E0620 0%,#080412 50%,#04020A 100%)',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {children}
    </div>
  )
}
