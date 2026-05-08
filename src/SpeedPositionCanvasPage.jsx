import { useEffect, useRef, useState } from 'react'
import { buildPotential, initializePacket, mass, stepSchrodinger } from './physics'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const computeMeanPosition = (psiRe, psiIm, dx) => {
  let xMean = 0

  for (let i = 0; i < psiRe.length; i += 1) {
    const probability = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]
    const x = i / (psiRe.length - 1)
    xMean += x * probability * dx
  }

  return xMean
}

function SpeedPositionCanvasPage() {
  const canvasRef = useRef(null)
  const [packetWidth, setPacketWidth] = useState(24)
  const [momentum, setMomentum] = useState(10)
  const [timeStep, setTimeStep] = useState(0.0006)
  const [stepsPerFrame, setStepsPerFrame] = useState(3)
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

    let animationFrameId = 0
    let psiRe = new Float64Array(0)
    let psiIm = new Float64Array(0)
    let potential = new Float64Array(0)
    let pointCount = 0
    let dx = 1
    let time = 0
    let meanX = 0
    let speedEstimate = 0
    let history = []

    const setupState = () => {
      pointCount = Math.max(220, Math.floor(canvas.clientWidth))
      dx = 1 / pointCount
      potential = buildPotential(pointCount, 'free')
      const [initialRe, initialIm] = initializePacket(pointCount, dx, packetWidth, momentum)
      psiRe = initialRe
      psiIm = initialIm
      time = 0
      meanX = computeMeanPosition(psiRe, psiIm, dx)
      speedEstimate = 0
      history = [{ t: 0, x: meanX }]
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const width = Math.floor(canvas.clientWidth * dpr)
      const height = Math.floor(canvas.clientHeight * dpr)

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      if (Math.max(220, Math.floor(canvas.clientWidth)) !== pointCount) {
        setupState()
      }
    }

    const draw = () => {
      resizeCanvas()

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const topY0 = height * 0.08
      const topY1 = height * 0.54
      const bottomY0 = height * 0.64
      const bottomY1 = height * 0.92
      const topH = topY1 - topY0
      const bottomH = bottomY1 - bottomY0
      const theoreticalVelocity = momentum / mass

      if (!paused) {
        const previousTime = time
        const previousMeanX = meanX

        for (let i = 0; i < stepsPerFrame; i += 1) {
          ;[psiRe, psiIm] = stepSchrodinger(psiRe, psiIm, potential, dx, timeStep)
        }

        time += stepsPerFrame * timeStep
        meanX = computeMeanPosition(psiRe, psiIm, dx)

        const dt = time - previousTime
        if (dt > 0) {
          speedEstimate = (meanX - previousMeanX) / dt
        }

        history.push({ t: time, x: meanX })
        if (history.length > 360) {
          history.shift()
        }
      }

      const probabilities = new Float64Array(pointCount)
      let pMax = 1e-10

      for (let i = 0; i < pointCount; i += 1) {
        const p = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]
        probabilities[i] = p
        if (p > pMax) {
          pMax = p
        }
      }

      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)'
      ctx.lineWidth = 1
      for (let gx = 0; gx <= 10; gx += 1) {
        const x = (gx / 10) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
      ctx.beginPath()
      ctx.moveTo(0, topY1)
      ctx.lineTo(width, topY1)
      ctx.stroke()

      const topGradient = ctx.createLinearGradient(0, topY0, 0, topY1)
      topGradient.addColorStop(0, 'rgba(34, 211, 238, 0.25)')
      topGradient.addColorStop(1, 'rgba(34, 211, 238, 0.03)')
      ctx.fillStyle = topGradient
      ctx.beginPath()

      for (let i = 0; i < pointCount; i += 1) {
        const x = (i / (pointCount - 1)) * width
        const y = topY1 - (probabilities[i] / pMax) * topH * 0.88

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.lineTo(width, topY1)
      ctx.lineTo(0, topY1)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.5
      ctx.beginPath()

      for (let i = 0; i < pointCount; i += 1) {
        const x = (i / (pointCount - 1)) * width
        const y = topY1 - (probabilities[i] / pMax) * topH * 0.88

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      const meanMarkerX = meanX * width
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(meanMarkerX, topY0)
      ctx.lineTo(meanMarkerX, topY1)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
      ctx.beginPath()
      ctx.moveTo(0, bottomY1)
      ctx.lineTo(width, bottomY1)
      ctx.stroke()

      if (history.length > 1) {
        const minT = history[0].t
        const maxT = history[history.length - 1].t
        const spanT = Math.max(maxT - minT, 1e-9)

        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let i = 0; i < history.length; i += 1) {
          const tx = ((history[i].t - minT) / spanT) * width
          const ty = bottomY1 - clamp(history[i].x, 0, 1) * bottomH

          if (i === 0) {
            ctx.moveTo(tx, ty)
          } else {
            ctx.lineTo(tx, ty)
          }
        }

        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
      ctx.font = '12px Segoe UI, sans-serif'
      ctx.fillText('|psi|^2 vs position x', 12, topY0 - 10)
      ctx.fillText('center-of-mass position x_cm vs time', 12, bottomY0 - 10)
      ctx.fillText(`estimated v = dx_cm/dt ≈ ${speedEstimate.toFixed(3)}`, 12, height - 28)
      ctx.fillText(`theory (hbar=1): v ≈ k/m = ${theoreticalVelocity.toFixed(3)}`, 12, height - 12)

      animationFrameId = window.requestAnimationFrame(draw)
    }

    setupState()
    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [packetWidth, momentum, timeStep, stepsPerFrame, paused, resetToken])

  return (
    <section className="wheeler-page" aria-label="Speed versus position canvas">
      <h2>Speed vs position relationship</h2>
      <p>
        Top plot: position probability density |psi|^2(x). Bottom plot: packet center x_cm over time. The slope of
        x_cm(t) is the average speed.
      </p>

      <canvas ref={canvasRef} className="wave-canvas wheeler-canvas" aria-label="Speed versus position visualization" />

      <section className="controls">
        <label>
          Momentum k: {momentum}
          <input
            type="range"
            min="2"
            max="28"
            value={momentum}
            onChange={(event) => setMomentum(Number(event.target.value))}
          />
        </label>

        <label>
          Packet width: {packetWidth}
          <input
            type="range"
            min="10"
            max="60"
            value={packetWidth}
            onChange={(event) => setPacketWidth(Number(event.target.value))}
          />
        </label>

        <label>
          dt: {timeStep.toFixed(4)}
          <input
            type="range"
            min="0.0002"
            max="0.0012"
            step="0.0001"
            value={timeStep}
            onChange={(event) => setTimeStep(Number(event.target.value))}
          />
        </label>

        <label>
          Steps per frame: {stepsPerFrame}
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={stepsPerFrame}
            onChange={(event) => setStepsPerFrame(Number(event.target.value))}
          />
        </label>
      </section>

      <section className="actions">
        <button type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" onClick={() => setResetToken((value) => value + 1)}>
          Reset history
        </button>
      </section>
    </section>
  )
}

export default SpeedPositionCanvasPage
