'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Direction } from '@/types/plinko'

export interface PlinkoCanvasHandle {
  drop: (path: Direction[], slot: number, multiplier: number) => Promise<void>
}

const PlinkoCanvas = forwardRef<PlinkoCanvasHandle>(function PlinkoCanvas(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    async drop(path: Direction[], slot: number, multiplier: number) {
      await gameRef.current?.drop(path, slot, multiplier)
    },
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let destroyed = false

    async function init() {
      const { PlinkoGame } = await import('@/game/PlinkoGame')
      if (destroyed || !containerRef.current) return
      const { offsetWidth: w, offsetHeight: h } = containerRef.current
      const game = new PlinkoGame(containerRef.current, w || 390, h || 560)
      gameRef.current = game
    }

    init()

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !gameRef.current) return
      const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0]
      gameRef.current.resize(Math.round(w), Math.round(h))
    })
    ro.observe(el)

    return () => {
      destroyed = true
      ro.disconnect()
      gameRef.current?.destroy()
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      className="overflow-hidden rounded-xl"
    />
  )
})

export default PlinkoCanvas
