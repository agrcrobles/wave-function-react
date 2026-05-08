// Natural units: ℏ = 1, m = 1.
// All spatial, temporal, and energy quantities are dimensionless and
// interpreted in scaled units. See PLANCK_CONSTANTS.md for details.
export const hbar = 1
export const mass = 1

/**
 * Returns x², used to avoid repeated multiplication throughout the module.
 * @param {number} x
 * @returns {number}
 */
export const square = (x) => x * x

/**
 * Approximates the second spatial derivative ∂²ψ/∂x² at grid index `index`
 * using the central finite-difference stencil:
 *
 *   ψ''(x_i) ≈ (ψ[i-1] - 2ψ[i] + ψ[i+1]) / dx²
 *
 * This is the discrete form of the kinetic energy operator's spatial part.
 * Accuracy is O(dx²). Requires interior index (1 ≤ index ≤ N-2).
 *
 * @param {Float64Array} values - ψ_R or ψ_I at all grid points
 * @param {number} index - grid point index to evaluate at
 * @param {number} dx - spatial grid spacing
 * @returns {number} approximated second derivative at index
 */
export const secondDerivativeAt = (values, index, dx) => {
  const left = values[index - 1]
  const center = values[index]
  const right = values[index + 1]
  return (left - 2 * center + right) / square(dx)
}

/**
 * Computes the action of the Hamiltonian operator Ĥ on ψ at a single grid point:
 *
 *   Ĥ = -(ℏ²/2m) ∂²/∂x²  +  V(x)
 *
 * Returns Re(Ĥψ) and Im(Ĥψ) at the given index. Because V is real and Ĥ is
 * Hermitian, it acts identically on the real and imaginary parts of ψ.
 *
 * Used by stepSchrodinger to evaluate the right-hand side of:
 *   iℏ ∂ψ/∂t = Ĥψ
 *
 * @param {Float64Array} psiRe - real part of ψ at all grid points
 * @param {Float64Array} psiIm - imaginary part of ψ at all grid points
 * @param {Float64Array} potential - V(x) at all grid points
 * @param {number} index - grid point index to evaluate at
 * @param {number} dx - spatial grid spacing
 * @returns {[number, number]} [Re(Ĥψ)[index], Im(Ĥψ)[index]]
 */
export const hamiltonianAt = (psiRe, psiIm, potential, index, dx) => {
  const kineticFactor = -(square(hbar) / (2 * mass))  // = -ℏ²/2m = -½

  const d2Re = secondDerivativeAt(psiRe, index, dx)
  const d2Im = secondDerivativeAt(psiIm, index, dx)

  const hRe = kineticFactor * d2Re + potential[index] * psiRe[index]
  const hIm = kineticFactor * d2Im + potential[index] * psiIm[index]

  return [hRe, hIm]
}

/**
 * Renormalizes ψ in place so that ∫|ψ|² dx = 1 (Born rule normalization).
 *
 * The explicit Euler time stepper does not preserve the norm exactly, so this
 * correction is applied after every step. The norm is computed as the discrete
 * Riemann sum:
 *
 *   norm = Σ_i (ψ_R[i]² + ψ_I[i]²) · dx
 *
 * Both arrays are then multiplied by 1/√norm.
 *
 * Note: mutates psiRe and psiIm directly for performance.
 *
 * @param {Float64Array} psiRe - real part of ψ (modified in place)
 * @param {Float64Array} psiIm - imaginary part of ψ (modified in place)
 * @param {number} dx - spatial grid spacing
 */
export const normalize = (psiRe, psiIm, dx) => {
  let norm = 0

  for (let i = 0; i < psiRe.length; i += 1) {
    norm += (psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]) * dx
  }

  const factor = norm > 0 ? 1 / Math.sqrt(norm) : 1

  for (let i = 0; i < psiRe.length; i += 1) {
    psiRe[i] *= factor
    psiIm[i] *= factor
  }
}

/**
 * Advances ψ by one time step dt using the explicit (forward) Euler method.
 *
 * Rearranging the Schrödinger equation:
 *   ∂ψ/∂t = -(i/ℏ) Ĥψ
 *
 * In component form:
 *   ψ_R[i](t+dt) = ψ_R[i](t) + (dt/ℏ) · Im(Ĥψ)[i]
 *   ψ_I[i](t+dt) = ψ_I[i](t) - (dt/ℏ) · Re(Ĥψ)[i]
 *
 * Dirichlet boundary conditions (ψ = 0 at walls) are enforced explicitly.
 * The result is renormalized before returning.
 *
 * Stability: requires dt ≤ m·dx²/ℏ = dx² (with ℏ = m = 1).
 *
 * @param {Float64Array} psiRe - real part of ψ at time t
 * @param {Float64Array} psiIm - imaginary part of ψ at time t
 * @param {Float64Array} potential - V(x) at all grid points
 * @param {number} dx - spatial grid spacing
 * @param {number} dt - time step
 * @returns {[Float64Array, Float64Array]} [nextRe, nextIm] — ψ at time t+dt
 */
export const stepSchrodinger = (psiRe, psiIm, potential, dx, dt) => {
  const nextRe = new Float64Array(psiRe.length)
  const nextIm = new Float64Array(psiIm.length)

  // Dirichlet boundary conditions: ψ = 0 at both walls (infinite square well)
  nextRe[0] = 0
  nextIm[0] = 0
  nextRe[psiRe.length - 1] = 0
  nextIm[psiIm.length - 1] = 0

  for (let i = 1; i < psiRe.length - 1; i += 1) {
    const [hRe, hIm] = hamiltonianAt(psiRe, psiIm, potential, i, dx)

    // iℏ ∂ψ/∂t = Ĥψ  =>  ∂ψ/∂t = -(i/ℏ)Ĥψ
    // Real:  ∂ψ_R/∂t = +(1/ℏ) Im(Ĥψ)
    // Imag:  ∂ψ_I/∂t = -(1/ℏ) Re(Ĥψ)
    nextRe[i] = psiRe[i] + dt * (hIm / hbar)
    nextIm[i] = psiIm[i] - dt * (hRe / hbar)
  }

  normalize(nextRe, nextIm, dx)
  return [nextRe, nextIm]
}

/**
 * Constructs the potential energy array V(x) for the given potential shape.
 *
 * The potential operator V̂ is diagonal in position space — it multiplies ψ
 * pointwise by V(x). Available shapes:
 *
 * - 'free'     : V(x) = 0 everywhere (free particle, pure dispersion)
 * - 'barrier'  : Finite square barrier at ~65% of grid, height 1.2
 *                (in natural units; demonstrates quantum tunneling)
 * - 'harmonic' : V(x) = ½kx², k=8 (harmonic oscillator / coherent states)
 *
 * @param {number} pointCount - number of spatial grid points N
 * @param {string} potentialType - 'free' | 'barrier' | 'harmonic'
 * @returns {Float64Array} V(x) at all grid points
 */
export const buildPotential = (pointCount, potentialType) => {
  const potential = new Float64Array(pointCount)

  if (potentialType === 'barrier') {
    const center = Math.floor(pointCount * 0.65)
    const halfWidth = Math.max(2, Math.floor(pointCount * 0.01))
    const barrierHeight = 1.2

    for (let i = center - halfWidth; i <= center + halfWidth; i += 1) {
      if (i > 0 && i < pointCount - 1) {
        potential[i] = barrierHeight
      }
    }
  }

  if (potentialType === 'harmonic') {
    const center = pointCount / 2
    const k = 8

    for (let i = 0; i < pointCount; i += 1) {
      const x = (i - center) / pointCount
      potential[i] = 0.5 * k * x * x
    }
  }

  return potential
}

/**
 * Initializes a Gaussian wave packet:
 *
 *   ψ(x, 0) = A · exp(-(x - x₀)² / σ²) · exp(ikx)
 *
 * where:
 *   - x₀ = pointCount * 0.25 (starts at 25% of the grid)
 *   - σ = packetWidth (controls position uncertainty Δx)
 *   - k = momentum (mean wave number; sets mean momentum p = ℏk = k)
 *   - A is chosen so that ∫|ψ|² dx = 1
 *
 * The real Gaussian envelope localizes the packet; the complex exponential
 * e^{ikx} = cos(kx) + i·sin(kx) gives it a well-defined mean momentum.
 * By the uncertainty principle: Δx·Δp ≥ ℏ/2, so a narrow packet disperses
 * faster than a wide one.
 *
 * @param {number} pointCount - number of spatial grid points N
 * @param {number} dx - spatial grid spacing
 * @param {number} packetWidth - Gaussian width σ in grid units (controls Δx)
 * @param {number} momentum - mean wave number k (controls mean velocity)
 * @returns {[Float64Array, Float64Array]} [psiRe, psiIm] — normalized initial state
 */
export const initializePacket = (pointCount, dx, packetWidth, momentum) => {
  const psiRe = new Float64Array(pointCount)
  const psiIm = new Float64Array(pointCount)
  const x0 = pointCount * 0.25

  for (let i = 1; i < pointCount - 1; i += 1) {
    const x = i
    const gaussian = Math.exp(-square((x - x0) / packetWidth))
    const phase = momentum * x * dx          // k·x in natural units
    psiRe[i] = gaussian * Math.cos(phase)    // Re(e^{ikx})
    psiIm[i] = gaussian * Math.sin(phase)    // Im(e^{ikx})
  }

  normalize(psiRe, psiIm, dx)
  return [psiRe, psiIm]
}

/**
 * Collapses ψ to a Gaussian localized at centerIndex, modeling a position
 * measurement that returned x = centerIndex·dx.
 *
 * Post-measurement state:
 *   ψ_post(x) ∝ exp(-(x - x_c)² / w²),   ψ_I = 0
 *
 * Setting ψ_I = 0 gives the packet zero mean momentum immediately after
 * measurement. The state is renormalized before returning.
 *
 * This is a simplified measurement model: a rigorous treatment requires
 * specifying the measurement apparatus Hamiltonian and tracing out the
 * environment. The key phenomenology (localization + subsequent re-spreading)
 * is correctly captured.
 *
 * Note: mutates psiRe and psiIm directly.
 *
 * @param {Float64Array} psiRe - real part of ψ (modified in place)
 * @param {Float64Array} psiIm - imaginary part of ψ (modified in place)
 * @param {number} dx - spatial grid spacing
 * @param {number} centerIndex - grid index of the measured position
 * @param {number} collapseWidth - width w of the post-measurement Gaussian (grid units)
 */
export const collapseWavefunction = (psiRe, psiIm, dx, centerIndex, collapseWidth) => {
  for (let i = 0; i < psiRe.length; i += 1) {
    if (i === 0 || i === psiRe.length - 1) {
      psiRe[i] = 0
      psiIm[i] = 0
      continue
    }

    const distance = i - centerIndex
    const localized = Math.exp(-square(distance / collapseWidth))
    psiRe[i] = localized
    psiIm[i] = 0
  }

  normalize(psiRe, psiIm, dx)
}

/**
 * Samples a grid index from the Born-rule probability distribution:
 *
 *   P(x_i) ∝ |ψ(x_i)|² = ψ_R[i]² + ψ_I[i]²
 *
 * Uses inverse CDF sampling (a single linear scan with a running threshold),
 * equivalent to drawing from the discrete distribution P without precomputing
 * the full CDF array.
 *
 * This index is then passed to collapseWavefunction to model the
 * post-measurement localization.
 *
 * @param {Float64Array} psiRe - real part of ψ
 * @param {Float64Array} psiIm - imaginary part of ψ
 * @returns {number} sampled grid index (interior point, 1 ≤ index ≤ N-2)
 */
export const sampleIndexByBornRule = (psiRe, psiIm) => {
  let total = 0

  for (let i = 1; i < psiRe.length - 1; i += 1) {
    total += psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]
  }

  if (total <= 0) {
    return Math.floor(psiRe.length / 2)
  }

  let threshold = Math.random() * total

  for (let i = 1; i < psiRe.length - 1; i += 1) {
    threshold -= psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]

    if (threshold <= 0) {
      return i
    }
  }

  return psiRe.length - 2
}