import * as PIXI from 'pixi.js'
import gsap from 'gsap'

// Shared coin texture (rendered once)
let _coinTex: PIXI.RenderTexture | null = null

function getCoinTexture(renderer: PIXI.Renderer): PIXI.RenderTexture {
  if (_coinTex) return _coinTex
  const size = 22
  const cx = size / 2
  const g = new PIXI.Graphics()
  // Coin body
  g.beginFill(0xFFD700); g.drawCircle(cx, cx, 9); g.endFill()
  // Inner ring
  g.lineStyle(1.5, 0xCC9900, 0.8); g.drawCircle(cx, cx, 6.5)
  // Shine
  g.beginFill(0xFFEE88, 0.70); g.drawEllipse(cx - 2.5, cx - 2.5, 3.2, 2.2); g.endFill()
  g.beginFill(0xFFFFFF, 0.40); g.drawEllipse(cx - 2.5, cx - 2.8, 1.5, 1.0); g.endFill()

  _coinTex = PIXI.RenderTexture.create({ width: size, height: size })
  renderer.render(g, { renderTexture: _coinTex })
  g.destroy()
  return _coinTex
}

export function burstCoins(
  renderer: PIXI.Renderer,
  stage: PIXI.Container,
  originX: number,
  originY: number,
  count = 32,
) {
  const tex = getCoinTexture(renderer)

  // Use ParticleContainer for GPU-accelerated batch rendering
  const pc = new PIXI.ParticleContainer(count, {
    scale: true, position: true, rotation: true, alpha: true,
  })
  stage.addChild(pc)

  for (let i = 0; i < count; i++) {
    const spr = new PIXI.Sprite(tex)
    spr.anchor.set(0.5)
    spr.x = originX + (Math.random() - 0.5) * 24
    spr.y = originY

    const angle  = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.5
    const speed  = 160 + Math.random() * 280
    const vx     = Math.cos(angle) * speed
    const vy     = Math.sin(angle) * speed
    const spin   = (Math.random() - 0.5) * 10
    const scale  = 0.55 + Math.random() * 0.65
    spr.scale.set(scale)
    spr.alpha = 0.9 + Math.random() * 0.1
    pc.addChild(spr)

    // Physics: two-phase arc (up then gravity down)
    const riseT = 0.38 + Math.random() * 0.25
    const fallT = 0.32 + Math.random() * 0.22
    let    rotation = 0

    gsap.timeline({ onComplete: () => spr.destroy({ children: false }) })
      // Rise
      .to(spr, {
        x: spr.x + vx * riseT,
        y: spr.y + vy * riseT,
        alpha: 1,
        duration: riseT,
        ease: 'power2.out',
        onUpdate: function (this: typeof spr) { rotation += spin * 0.016; this.rotation = rotation }.bind(spr),
      })
      // Fall
      .to(spr, {
        x: `+=${vx * fallT * 0.35}`,
        y: `+=${220 + Math.random() * 80}`,
        alpha: 0,
        duration: fallT,
        ease: 'power2.in',
        onUpdate: function (this: typeof spr) { rotation += spin * 0.012; this.rotation = rotation }.bind(spr),
      })
  }

  // Clean up container after all particles done
  setTimeout(() => { if (!pc.destroyed) pc.destroy({ children: true }) }, 2200)
}

export function shakeStage(stage: PIXI.Container, intensity = 8) {
  const ox = stage.x, oy = stage.y
  gsap.timeline()
    .to(stage, { x: ox + intensity,       y: oy - intensity * 0.5, duration: 0.04 })
    .to(stage, { x: ox - intensity,       y: oy + intensity * 0.5, duration: 0.04 })
    .to(stage, { x: ox + intensity * 0.6, y: oy - intensity * 0.3, duration: 0.04 })
    .to(stage, { x: ox - intensity * 0.4, y: oy + intensity * 0.2, duration: 0.04 })
    .to(stage, { x: ox + intensity * 0.2, y: oy,                   duration: 0.03 })
    .to(stage, { x: ox,                   y: oy,                   duration: 0.05 })
}
