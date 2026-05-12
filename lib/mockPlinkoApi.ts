/**
 * Mock API — replace with real backend call later.
 * Contract: same input/output shape as the real API.
 */
import type { PlayResult, Direction } from '@/types/plinko'
import { GAME_CONFIGS } from '@/types/plinko'

export async function playPlinko(
  betAmount: number,
  rows: number = 8,
): Promise<PlayResult> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 80))

  const cfg = GAME_CONFIGS[rows] ?? GAME_CONFIGS[8]

  // Generate random L/R path
  const path: Direction[] = Array.from({ length: cfg.rows }, () =>
    Math.random() < 0.5 ? 'L' : 'R',
  )

  // Slot = number of R turns (0 … rows)
  const resultSlot = path.filter((d) => d === 'R').length
  const multiplier = cfg.multipliers[resultSlot] ?? 1
  const winAmount = Math.round(betAmount * multiplier * 100) / 100

  return { path, resultSlot, multiplier, winAmount }
}
