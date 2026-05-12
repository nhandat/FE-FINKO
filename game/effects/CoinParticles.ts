import * as PIXI from 'pixi.js'
import gsap from 'gsap'

export function burstCoins(
  stage: PIXI.Container,
  originX: number,
  originY: number,
  count = 28,
) {
  for (let i = 0; i < count; i++) {
    const coin = new PIXI.Graphics()
    const r = 5 + Math.random() * 4

    // Gold coin with shine
    coin.beginFill(0xFFD700); coin.drawEllipse(0, 0, r, r * 1.15); coin.endFill()
    coin.beginFill(0xFFEE88, 0.7); coin.drawEllipse(-r * 0.2, -r * 0.25, r * 0.45, r * 0.55); coin.endFill()
    coin.lineStyle(1, 0xCC9900, 0.6); coin.drawEllipse(0, 0, r, r * 1.15)

    coin.x = originX + (Math.random() - 0.5) * 30
    coin.y = originY
    coin.alpha = 1
    stage.addChild(coin)

    const angle  = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
    const speed  = 180 + Math.random() * 260
    const dx     = Math.cos(angle) * speed
    const dy     = Math.sin(angle) * speed
    const dur    = 0.55 + Math.random() * 0.35

    gsap.timeline({ onComplete: () => coin.destroy() })
      .to(coin,       { x: coin.x + dx * 0.55, y: coin.y + dy * 0.55, duration: dur * 0.55, ease: 'power2.out' })
      .to(coin,       { x: coin.x + dx,        y: coin.y + dy + 220,  duration: dur * 0.55, ease: 'power2.in' }, '<50%')
      .to(coin,       { alpha: 0, duration: 0.25 }, '-=0.25')
      .to(coin.scale, { x: 0.3 + Math.random() * 0.7, duration: dur, ease: 'none' }, 0)
  }
}

export function shakeStage(stage: PIXI.Container, intensity = 7) {
  const origX = stage.x, origY = stage.y
  gsap.timeline()
    .to(stage, { x: origX + intensity,  y: origY - intensity * 0.5, duration: 0.04 })
    .to(stage, { x: origX - intensity,  y: origY + intensity * 0.5, duration: 0.04 })
    .to(stage, { x: origX + intensity * 0.6, y: origY, duration: 0.04 })
    .to(stage, { x: origX - intensity * 0.4, y: origY, duration: 0.04 })
    .to(stage, { x: origX, y: origY, duration: 0.06 })
}
