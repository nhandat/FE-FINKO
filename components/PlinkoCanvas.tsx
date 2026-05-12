'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Direction } from '@/types/plinko'

export interface PlinkoCanvasHandle {
  drop: (path: Direction[], slot: number, multiplier: number) => Promise<void>
}

interface Props {
  width: number
  height: number
}

const PlinkoCanvas = forwardRef<PlinkoCanvasHandle, Props>(function PlinkoCanvas(
  { width, height },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Use any here because PlinkoGame is browser-only and loaded dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    async drop(path: Direction[], slot: number, multiplier: number) {
      await gameRef.current?.drop(path, slot, multiplier)
    },
  }))

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    async function init() {
      const { PlinkoGame } = await import('@/game/PlinkoGame')
      if (destroyed || !containerRef.current) return
      const game = new PlinkoGame(containerRef.current, width, height)
      gameRef.current = game
    }

    init()

    return () => {
      destroyed = true
      gameRef.current?.destroy()
      gameRef.current = null
    }
  // Intentionally run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resize when dimensions change
  useEffect(() => {
    gameRef.current?.resize(width, height)
  }, [width, height])

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: 'relative' }}
      className="overflow-hidden rounded-xl"
    />
  )
})

export default PlinkoCanvas
