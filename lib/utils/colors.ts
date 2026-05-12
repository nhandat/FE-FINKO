import type { RowCount } from '@/types/plinko'

const RED_BG    = { r: 255, g: 0,   b: 63  }
const YELLOW_BG = { r: 255, g: 192, b: 0   }
const RED_SH    = { r: 166, g: 0,   b: 4   }
const YELLOW_SH = { r: 171, g: 121, b: 0   }

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number,
) {
  return { r: lerp(c1.r, c2.r, t), g: lerp(c1.g, c2.g, t), b: lerp(c1.b, c2.b, t) }
}

export function getBinColors(rowCount: RowCount) {
  const binCount = rowCount + 1
  const background: string[] = []
  const shadow: string[]     = []

  for (let i = 0; i < binCount; i++) {
    // t = 1 at edges (red), t = 0 at centre (yellow)
    const t  = Math.abs((2 * i) / (binCount - 1) - 1)
    const bg = lerpColor(YELLOW_BG, RED_BG, t)
    const sh = lerpColor(YELLOW_SH, RED_SH, t)
    background.push(`rgb(${bg.r},${bg.g},${bg.b})`)
    shadow.push(`rgb(${sh.r},${sh.g},${sh.b})`)
  }

  return { background, shadow }
}

// Pre-compute for all row counts
export const binColorsByRowCount = (
  [8, 9, 10, 11, 12, 13, 14, 15, 16] as RowCount[]
).reduce(
  (acc, rc) => { acc[rc] = getBinColors(rc); return acc },
  {} as Record<RowCount, ReturnType<typeof getBinColors>>,
)
