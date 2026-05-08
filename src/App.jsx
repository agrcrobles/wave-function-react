import { useEffect, useRef, useState } from 'react'
import './App.css'
import WhyPsiPage from './WhyPsiPage'
import MeasurementClickPage from './MeasurementClickPage'
import WheelerCanvasPage from './WheelerCanvasPage'
import SchrodingerReferencePage from './SchrodingerReferencePage'
import MarkdownPage from './MarkdownPage'
import {
  buildPotential,
  collapseWavefunction,
  initializePacket,
  sampleIndexByBornRule,
  stepSchrodinger,
} from './physics'

const presets = {
  baseline: {
    label: 'Baseline',
    packetWidth: 26,
    momentum: 10,
    timeStep: 0.0006,
    stepsPerFrame: 3,
    renderMode: 'probability',
    potentialType: 'barrier',
  },
  freePacket: {
    label: 'Free Packet',
    packetWidth: 22,
    momentum: 12,
    timeStep: 0.0005,
    stepsPerFrame: 3,
    renderMode: 'real',
    potentialType: 'free',
  },
  tunneling: {
    label: 'Barrier Tunneling',
    packetWidth: 28,
    momentum: 9,
    timeStep: 0.0006,
    stepsPerFrame: 4,
    renderMode: 'probability',
    potentialType: 'barrier',
  },
  boundStates: {
    label: 'Harmonic Well',
    packetWidth: 20,
    momentum: 2,
    timeStep: 0.0004,
    stepsPerFrame: 3,
    renderMode: 'real',
    potentialType: 'harmonic',
  },
}

const getPageFromHash = () => {
  if (typeof window === 'undefined') {
    return 'simulation'
  }

  if (window.location.hash === '#/why-psi') {
    return 'why-psi'
  }

  if (window.location.hash === '#/measurement-click') {
    return 'measurement-click'
  }

  if (window.location.hash === '#/wheeler-canvas') {
    return 'wheeler-canvas'
  }

  if (window.location.hash === '#/schrodinger-reference') {
    return 'schrodinger-reference'
  }

  if (window.location.hash === '#/md-immutable-logic') {
    return 'md-immutable-logic'
  }

  if (window.location.hash === '#/md-planck-constants') {
    return 'md-planck-constants'
  }

  if (window.location.hash === '#/md-pure-functions') {
    return 'md-pure-functions'
  }

  if (window.location.hash === '#/md-wheeler-delayed-choice') {
    return 'md-wheeler-delayed-choice'
  }

  return 'simulation'
}

function App() {
  const canvasRef = useRef(null)
  const pausedRef = useRef(false)
  const collapseModeRef = useRef('click')
  const [presetKey, setPresetKey] = useState('baseline')
  const [packetWidth, setPacketWidth] = useState(presets.baseline.packetWidth)
  const [momentum, setMomentum] = useState(presets.baseline.momentum)
  const [timeStep, setTimeStep] = useState(presets.baseline.timeStep)
  const [stepsPerFrame, setStepsPerFrame] = useState(presets.baseline.stepsPerFrame)
  const [renderMode, setRenderMode] = useState(presets.baseline.renderMode)
  const [potentialType, setPotentialType] = useState(presets.baseline.potentialType)
  const [collapseMode, setCollapseMode] = useState('click')
  const [isPaused, setIsPaused] = useState(false)
  const [resetToken, setResetToken] = useState(0)
  const [page, setPage] = useState(getPageFromHash)

  useEffect(() => {
    const onHashChange = () => {
      setPage(getPageFromHash())
    }

    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  useEffect(() => {
    pausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    collapseModeRef.current = collapseMode
  }, [collapseMode])

  const applyPreset = (key) => {
    if (key === 'custom') {
      setPresetKey('custom')
      return
    }

    const preset = presets[key]

    if (!preset) {
      return
    }

    setPresetKey(key)
    setPacketWidth(preset.packetWidth)
    setMomentum(preset.momentum)
    setTimeStep(preset.timeStep)
    setStepsPerFrame(preset.stepsPerFrame)
    setRenderMode(preset.renderMode)
    setPotentialType(preset.potentialType)
  }

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
    let potentialMax = 0
    let collapseMarkerIndex = -1
    let collapseMarkerLife = 0

    const setupStateFromCanvas = () => {
      pointCount = Math.max(180, Math.floor(canvas.clientWidth))
      dx = 1 / pointCount
      potential = buildPotential(pointCount, potentialType)
      potentialMax = 0

      for (let i = 0; i < potential.length; i += 1) {
        if (potential[i] > potentialMax) {
          potentialMax = potential[i]
        }
      }

      const [initialRe, initialIm] = initializePacket(pointCount, dx, packetWidth, momentum)
      psiRe = initialRe
      psiIm = initialIm
    }

    const collapseFromPointer = (clientX) => {
      if (pointCount < 3) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const localX = Math.min(Math.max(clientX - rect.left, 0), rect.width)
      const clickIndex = Math.round((localX / rect.width) * (pointCount - 1))
      const centerIndex = collapseModeRef.current === 'born' ? sampleIndexByBornRule(psiRe, psiIm) : clickIndex
      const collapseWidth = Math.max(2, Math.floor(pointCount * 0.015))

      collapseWavefunction(psiRe, psiIm, dx, centerIndex, collapseWidth)
      collapseMarkerIndex = centerIndex
      collapseMarkerLife = 45
    }

    const handleCanvasClick = (event) => {
      setPresetKey('custom')
      collapseFromPointer(event.clientX)
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

      if (Math.max(180, Math.floor(canvas.clientWidth)) !== pointCount) {
        setupStateFromCanvas()
      }
    }

    const draw = () => {
      resizeCanvas()

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const centerY = height / 2
      const xScale = width / (pointCount - 1)

      ctx.clearRect(0, 0, width, height)

      // Subtle grid to make spatial/vertical reading easier.
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)'
      ctx.lineWidth = 1

      for (let gx = 0; gx <= 10; gx += 1) {
        const x = (gx / 10) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let gy = 0; gy <= 6; gy += 1) {
        const y = (gy / 6) * height
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()

      if (potentialMax > 0) {
        const potentialBase = height * 0.24
        const potentialScale = height * 0.16

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.95)'
        ctx.lineWidth = 1.5
        ctx.beginPath()

        for (let i = 0; i < pointCount; i += 1) {
          const x = i * xScale
          const normalizedPotential = potential[i] / potentialMax
          const y = potentialBase - normalizedPotential * potentialScale

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      }

      if (!pausedRef.current) {
        for (let step = 0; step < stepsPerFrame; step += 1) {
          ;[psiRe, psiIm] = stepSchrodinger(psiRe, psiIm, potential, dx, timeStep)
        }
      }

      let minValue = Infinity
      let maxValue = -Infinity
      const values = new Float64Array(pointCount)

      for (let i = 0; i < pointCount; i += 1) {
        const probability = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]
        const value = renderMode === 'probability' ? probability : psiRe[i]
        values[i] = value

        if (value < minValue) {
          minValue = value
        }

        if (value > maxValue) {
          maxValue = value
        }
      }

      const probabilityMode = renderMode === 'probability'
      const probabilityBaseY = height * 0.92
      const probabilityScale = height * 0.76
      const midpoint = (maxValue + minValue) / 2
      const halfRange = Math.max((maxValue - minValue) / 2, 1e-10)
      const yAmplitude = height * 0.42
      const probabilityMax = Math.max(maxValue, 1e-10)

      const yForValue = (value) => {
        if (probabilityMode) {
          return probabilityBaseY - (value / probabilityMax) * probabilityScale
        }

        const normalized = (value - midpoint) / halfRange
        return centerY - normalized * yAmplitude
      }

      if (probabilityMode) {
        const fillGradient = ctx.createLinearGradient(0, 0, 0, height)
        fillGradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)')
        fillGradient.addColorStop(1, 'rgba(34, 211, 238, 0.03)')
        ctx.fillStyle = fillGradient
        ctx.beginPath()

        for (let i = 0; i < pointCount; i += 1) {
          const x = i * xScale
          const y = yForValue(values[i])

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.lineTo(width, probabilityBaseY)
        ctx.lineTo(0, probabilityBaseY)
        ctx.closePath()
        ctx.fill()
      }

      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2.8
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.shadowColor = 'rgba(34, 211, 238, 0.4)'
      ctx.shadowBlur = 10
      ctx.beginPath()

      for (let i = 0; i < pointCount; i += 1) {
        const x = i * xScale
        const waveY = yForValue(values[i])

        if (i === 0) {
          ctx.moveTo(x, waveY)
        } else {
          ctx.lineTo(x, waveY)
        }
      }

      ctx.stroke()
      ctx.shadowBlur = 0

      if (collapseMarkerLife > 0 && collapseMarkerIndex >= 0) {
        const markerX = collapseMarkerIndex * xScale
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.6)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(markerX, 0)
        ctx.lineTo(markerX, height)
        ctx.stroke()
        collapseMarkerLife -= 1
      }

      ctx.fillStyle = 'rgba(226, 232, 240, 0.8)'
      ctx.font = '12px Segoe UI, sans-serif'
      ctx.fillText(probabilityMode ? '|psi|^2' : 'Re(psi)', 12, 20)

      if (potentialMax > 0) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'
        ctx.fillText('V(x)', 12, 38)
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    setupStateFromCanvas()
    canvas.addEventListener('click', handleCanvasClick)
    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [packetWidth, momentum, timeStep, stepsPerFrame, renderMode, potentialType, resetToken, page])

  const quantizedLevels = potentialType === 'harmonic'
  const momentumDirection = momentum > 0 ? 'positive x direction (to the right)' : 'negative x direction (to the left)'
  const graphMeaning = renderMode === 'probability'
    ? 'The cyan curve is |psi|^2: position probability density, not velocity.'
    : 'The cyan curve is Re(psi): the real component of the wavefunction, not direct probability.'

  return (
    <main className="app">
      <h1>Quantum Wave Visualizer</h1>
      <nav className="page-nav" aria-label="Page navigation">
        <div className="page-nav-row">
          <a className={page === 'simulation' ? 'page-link active' : 'page-link'} href="#/">
            Simulation
          </a>
          <a className={page === 'why-psi' ? 'page-link active' : 'page-link'} href="#/why-psi">
            Why psi
          </a>
          <a className={page === 'measurement-click' ? 'page-link active' : 'page-link'} href="#/measurement-click">
            Measurement
          </a>
          <a className={page === 'wheeler-canvas' ? 'page-link active' : 'page-link'} href="#/wheeler-canvas">
            Wheeler canvas
          </a>
          <a className={page === 'schrodinger-reference' ? 'page-link active' : 'page-link'} href="#/schrodinger-reference">
            Schrödinger ref
          </a>
        </div>
        <div className="page-nav-row page-nav-row--docs">
          <span className="page-nav-label">Docs</span>
          <a className={page === 'md-immutable-logic' ? 'page-link page-link--doc active' : 'page-link page-link--doc'} href="#/md-immutable-logic">
            Immutable logic
          </a>
          <a className={page === 'md-planck-constants' ? 'page-link page-link--doc active' : 'page-link page-link--doc'} href="#/md-planck-constants">
            Planck constants
          </a>
          <a className={page === 'md-pure-functions' ? 'page-link page-link--doc active' : 'page-link page-link--doc'} href="#/md-pure-functions">
            Pure functions
          </a>
          <a className={page === 'md-wheeler-delayed-choice' ? 'page-link page-link--doc active' : 'page-link page-link--doc'} href="#/md-wheeler-delayed-choice">
            Wheeler delayed choice
          </a>
        </div>
      </nav>

      {page === 'why-psi' ? (
        <WhyPsiPage />
      ) : page === 'measurement-click' ? (
        <MeasurementClickPage />
      ) : page === 'wheeler-canvas' ? (
        <WheelerCanvasPage />
      ) : page === 'schrodinger-reference' ? (
        <SchrodingerReferencePage />
      ) : page === 'md-immutable-logic' ? (
        <MarkdownPage file="/IMMUTABLE_LOGIC.md" />
      ) : page === 'md-planck-constants' ? (
        <MarkdownPage file="/PLANCK_CONSTANTS.md" />
      ) : page === 'md-pure-functions' ? (
        <MarkdownPage file="/PURE_FUNCTIONS_AND_LOW_SIGMA.md" />
      ) : page === 'md-wheeler-delayed-choice' ? (
        <MarkdownPage file="/WHEELER_DELAYED_CHOICE.md" />
      ) : (
        <>
          <p className="subtitle">Discrete 1D Schrödinger evolution with finite-difference Hamiltonian.</p>

          <section className="equation-card" aria-label="Schrodinger equation explanation">
            <h2>Schrodinger equation used in this simulation</h2>
            <p className="equation-line">
              i * hbar * dpsi/dt = -(hbar^2 / 2m) * d2psi/dx2 + V(x) * psi
            </p>
            <p className="equation-help">
              The second derivative is simulated with a simple 3-point curvature rule:
            </p>
            <p className="equation-line">
              d2psi/dx2 approximately equals (psi[i - 1] - 2 * psi[i] + psi[i + 1]) / (dx * dx)
            </p>
            <p className="equation-help">
              Intuition: if the center value is much higher or lower than its left and right neighbors,
              curvature is large. That curvature drives the kinetic term in the Hamiltonian.
            </p>
          </section>

          <section className="presets">
            <label>
              Preset
              <select value={presetKey} onChange={(event) => applyPreset(event.target.value)}>
                <option value="baseline">{presets.baseline.label}</option>
                <option value="freePacket">{presets.freePacket.label}</option>
                <option value="tunneling">{presets.tunneling.label}</option>
                <option value="boundStates">{presets.boundStates.label}</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </section>

          <canvas ref={canvasRef} className="wave-canvas" aria-label="Animated wave visualization" />

          <p className="interaction-note">
            Click on the canvas to collapse the wave function. Use Born mode to sample collapse from |psi|^2.
          </p>

          <p className="graph-subtext">
            {graphMeaning} With momentum k = {momentum}, the packet tends to propagate in the {momentumDirection}.
          </p>

          <section className="controls">
            <label>
              Packet width: {packetWidth}
              <input
                type="range"
                min="10"
                max="60"
                value={packetWidth}
                onChange={(event) => {
                  setPresetKey('custom')
                  setPacketWidth(Number(event.target.value))
                }}
              />
            </label>

            <label>
              Momentum k: {momentum}
              <input
                type="range"
                min="2"
                max="28"
                value={momentum}
                onChange={(event) => {
                  setPresetKey('custom')
                  setMomentum(Number(event.target.value))
                }}
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
                onChange={(event) => {
                  setPresetKey('custom')
                  setTimeStep(Number(event.target.value))
                }}
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
                onChange={(event) => {
                  setPresetKey('custom')
                  setStepsPerFrame(Number(event.target.value))
                }}
              />
            </label>

            <label>
              View mode
              <select
                value={renderMode}
                onChange={(event) => {
                  setPresetKey('custom')
                  setRenderMode(event.target.value)
                }}
              >
                <option value="probability">|psi|^2 (probability)</option>
                <option value="real">Re(psi)</option>
              </select>
            </label>

            <label>
              Potential
              <select
                value={potentialType}
                onChange={(event) => {
                  setPresetKey('custom')
                  setPotentialType(event.target.value)
                }}
              >
                <option value="free">Free</option>
                <option value="barrier">Barrier</option>
                <option value="harmonic">Harmonic well</option>
              </select>
            </label>

            <label>
              Collapse mode
              <select
                value={collapseMode}
                onChange={(event) => {
                  setPresetKey('custom')
                  setCollapseMode(event.target.value)
                }}
              >
                <option value="click">At click position</option>
                <option value="born">Born-rule sample</option>
              </select>
            </label>
          </section>

          <section className="actions">
            <button
              type="button"
              onClick={() => {
                setIsPaused((value) => !value)
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPresetKey('custom')
                setResetToken((value) => value + 1)
              }}
            >
              Reset packet
            </button>
          </section>

          <p className="quantization-note">
            Energy levels quantized: {quantizedLevels ? 'Yes (bound states in the harmonic well).' : 'Not strictly (free/barrier are scattering-dominated).'}
          </p>
        </>
      )}
    </main>
  )
}

export default App
