import { useEffect, useRef, useState } from 'react'
import { clamp, intensityAtY, isDetectorOn, lerp, sampleCollapseY } from './wheelerPhysics'

function WheelerCanvasPage() {
  const canvasRef = useRef(null)
  const [measurementMode, setMeasurementMode] = useState('wave')
  const [delayedChoice, setDelayedChoice] = useState(true)
  const [decisionPoint, setDecisionPoint] = useState(0.72)
  const [speed, setSpeed] = useState(0.006)
  const [collapseMode, setCollapseMode] = useState('click')
  const [paused, setPaused] = useState(false)
  const [resetToken, setResetToken] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return undefined
    }

    let raf = 0
    let progress = 0
    let phase = 0
    let collapsed = false
    let collapsedY = 0
    let collapseMarkerLife = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = Math.floor(canvas.clientWidth * dpr)
      const height = Math.floor(canvas.clientHeight * dpr)

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    const drawBlob = (x, y, radius, alpha) => {
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius)
      gradient.addColorStop(0, `rgba(34, 211, 238, ${alpha})`)
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    const triggerCollapse = (clientY) => {
      const height = canvas.clientHeight
      const topY = height * 0.33
      const bottomY = height * 0.67
      const midY = height * 0.5

      const detectorOnNow = isDetectorOn(delayedChoice, progress, decisionPoint, measurementMode)

      if (collapseMode === 'born') {
        collapsedY = sampleCollapseY(height, topY, bottomY, midY, detectorOnNow, phase)
      } else {
        const rect = canvas.getBoundingClientRect()
        const localY = clamp(clientY - rect.top, height * 0.17, height * 0.83)
        collapsedY = localY
      }

      collapsed = true
      collapseMarkerLife = 70
    }

    const handleCanvasClick = (event) => {
      triggerCollapse(event.clientY)
    }

    const draw = () => {
      resize()

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const sourceX = width * 0.1
      const splitterX = width * 0.36
      const screenX = width * 0.84
      const topY = height * 0.33
      const bottomY = height * 0.67
      const midY = height * 0.5

      const branchProgress = clamp((progress - 0.28) / 0.56, 0, 1)
      const packetX = lerp(sourceX, screenX, progress)
      const packetBeforeSplitX = lerp(sourceX, splitterX, clamp(progress / 0.28, 0, 1))
      const decisionX = lerp(sourceX, screenX, decisionPoint)

      const detectorOn = isDetectorOn(delayedChoice, progress, decisionPoint, measurementMode)
      const collapseActive = collapsed && progress >= 0.28

      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)'
      ctx.lineWidth = 1
      for (let gx = 0; gx <= 8; gx += 1) {
        const x = (gx / 8) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sourceX, midY)
      ctx.lineTo(splitterX, midY)
      ctx.lineTo(screenX, topY)
      ctx.moveTo(splitterX, midY)
      ctx.lineTo(screenX, bottomY)
      ctx.stroke()

      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(sourceX, midY, 6, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#a5b4fc'
      ctx.fillRect(splitterX - 5, midY - 16, 10, 32)

      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(screenX, height * 0.15, 6, height * 0.7)

      if (delayedChoice) {
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.5)'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(decisionX, 0)
        ctx.lineTo(decisionX, height)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
        ctx.font = '12px Segoe UI, sans-serif'
        ctx.fillText('decision point', decisionX + 8, 18)
      }

      if (progress < 0.28) {
        drawBlob(packetBeforeSplitX, midY, 24, 0.8)
      } else {
        if (collapseActive) {
          const collapseX = lerp(splitterX, screenX, branchProgress)
          const collapsePathY = lerp(midY, collapsedY, branchProgress)
          drawBlob(collapseX, collapsePathY, 20, 0.85)
        } else {
          const topX = lerp(splitterX, screenX, branchProgress)
          const bottomX = lerp(splitterX, screenX, branchProgress)
          drawBlob(topX, topY, 18, 0.72)
          drawBlob(bottomX, bottomY, 18, 0.72)
        }
      }

      if (detectorOn || collapseActive) {
        ctx.fillStyle = 'rgba(248, 113, 113, 0.95)'
        ctx.fillRect(splitterX + (screenX - splitterX) * 0.4 - 5, topY - 10, 10, 20)
        ctx.fillRect(splitterX + (screenX - splitterX) * 0.4 - 5, bottomY - 10, 10, 20)
      }

      if (packetX > screenX - 10) {
        const yStart = height * 0.17
        const yEnd = height * 0.83
        const stripeHeight = 2

        for (let y = yStart; y <= yEnd; y += stripeHeight) {
          let intensity
          if (collapseActive) {
            intensity = Math.exp(-Math.pow((y - collapsedY) / (height * 0.045), 2))
          } else {
            intensity = intensityAtY(y, height, topY, bottomY, midY, detectorOn, phase)
          }

          const a = clamp(intensity, 0, 1)
          ctx.fillStyle = `rgba(34, 211, 238, ${0.1 + a * 0.9})`
          ctx.fillRect(screenX + 8, y, 22, stripeHeight)
        }
      }

      if (collapseActive && collapseMarkerLife > 0) {
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.2 + (collapseMarkerLife / 70) * 0.6})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(screenX + 6, collapsedY)
        ctx.lineTo(screenX + 32, collapsedY)
        ctx.stroke()
        collapseMarkerLife -= 1
      }

      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.font = '12px Segoe UI, sans-serif'
      ctx.fillText(
        collapseActive
          ? 'measurement collapse: localized outcome on screen'
          : detectorOn
            ? 'measurement: path detectors ON (particle-like)'
            : 'measurement: no path detectors (interference)',
        12,
        18,
      )

      if (!paused) {
        progress += speed
        phase += 0.08
        if (progress > 1.04) {
          progress = 0
          collapsed = false
          collapseMarkerLife = 0
        }
      }

      raf = window.requestAnimationFrame(draw)
    }

    canvas.addEventListener('click', handleCanvasClick)
    raf = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(raf)
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [measurementMode, delayedChoice, decisionPoint, speed, paused, resetToken, collapseMode])

  return (
    <section className="wheeler-page" aria-label="Wheeler delayed choice canvas">
      <h2>Wheeler delayed-choice experiment (visual)</h2>
      <p>
        Same Schrodinger base idea: evolve amplitudes and compare coherent sum (interference) vs incoherent sum
        (which-path measurement).
      </p>

      <p>Click the canvas to trigger collapse and force a localized detection outcome.</p>

      <canvas ref={canvasRef} className="wave-canvas wheeler-canvas" aria-label="Wheeler experiment animation" />

      <section className="controls">
        <label>
          Measurement mode
          <select value={measurementMode} onChange={(event) => setMeasurementMode(event.target.value)}>
            <option value="wave">Wave mode (interference)</option>
            <option value="particle">Particle mode (which-path)</option>
          </select>
        </label>

        <label>
          Delayed choice
          <select value={delayedChoice ? 'yes' : 'no'} onChange={(event) => setDelayedChoice(event.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label>
          Decision point: {Math.round(decisionPoint * 100)}%
          <input
            type="range"
            min="0.35"
            max="0.95"
            step="0.01"
            value={decisionPoint}
            onChange={(event) => setDecisionPoint(Number(event.target.value))}
          />
        </label>

        <label>
          Animation speed: {speed.toFixed(3)}
          <input
            type="range"
            min="0.002"
            max="0.02"
            step="0.001"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>

        <label>
          Collapse mode
          <select value={collapseMode} onChange={(event) => setCollapseMode(event.target.value)}>
            <option value="click">Click position</option>
            <option value="born">Born-rule sample</option>
          </select>
        </label>
      </section>

      <section className="actions">
        <button type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={() => setResetToken((value) => value + 1)}>
          Restart cycle
        </button>
      </section>
    </section>
  )
}

export default WheelerCanvasPage
