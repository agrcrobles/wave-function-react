# Schrödinger Equation — Operators, Discretization, and Simulation Logic

This document is the primary technical reference for `physics.js`. It explains the physics from first principles, maps each concept to its implementation, and describes how the simulation pipeline fits together.

---

## 1. The Time-Dependent Schrödinger Equation

The central equation governing quantum dynamics is:

```
iℏ ∂ψ/∂t = Ĥψ
```

Where:

- `ψ(x, t)` is the **wavefunction** — a complex-valued function of position and time
- `ℏ` is the reduced Planck constant (`hbar`)
- `Ĥ` is the **Hamiltonian operator** — the total energy operator of the system
- `i` is the imaginary unit

This single equation encodes all quantum dynamics. Given `ψ` at time `t`, it uniquely determines `ψ` at time `t + dt`.

### Why complex?

The `i` on the left side is essential, not cosmetic. It means the equation is *not* a diffusion equation (which would read `∂ψ/∂t = ...`). Instead it couples the real and imaginary parts of `ψ` to each other's rate of change:

```
∂Re(ψ)/∂t = -(1/ℏ) Im(Ĥψ)   ... wait, let's be careful
∂Im(ψ)/∂t = +(1/ℏ) Re(Ĥψ)
```

Expanding `iℏ ∂ψ/∂t = Ĥψ` with `ψ = ψ_R + iψ_I`:

```
iℏ(∂ψ_R/∂t + i ∂ψ_I/∂t) = (Ĥψ)_R + i(Ĥψ)_I

Real part:   -ℏ ∂ψ_I/∂t = (Ĥψ)_R   =>   ∂ψ_R/∂t = +(Ĥψ)_I / ℏ
Imag part:   +ℏ ∂ψ_R/∂t = (Ĥψ)_I   =>   ∂ψ_I/∂t = -(Ĥψ)_R / ℏ
```

These are the two update rules implemented in `stepSchrodinger` (`physics.js:53-54`).

---

## 2. Quantum Operators

In quantum mechanics, physical observables are represented by **linear operators** acting on the wavefunction. The Schrödinger equation is built from two fundamental operators.

### 2.1 Position Operator `x̂`

```
(x̂ ψ)(x) = x · ψ(x)
```

The position operator is simply multiplication by `x`. In the simulation, it appears implicitly in the potential energy term: `V(x̂)ψ = V(x) · ψ(x)`. At each grid point `i`, this is just `potential[i] * psiRe[i]` and `potential[i] * psiIm[i]`.

### 2.2 Momentum Operator `p̂`

```
p̂ = -iℏ ∂/∂x
```

The momentum operator is a first-order differential operator scaled by `-iℏ`. It is Hermitian, which guarantees real eigenvalues (observable momenta are real numbers).

Its square gives the kinetic energy contribution:

```
p̂² = (-iℏ ∂/∂x)² = -ℏ² ∂²/∂x²
```

So the kinetic energy operator is:

```
T̂ = p̂²/2m = -(ℏ²/2m) ∂²/∂x²
```

This is where the second derivative enters. In code (`physics.js:14`):

```js
const kineticFactor = -(square(hbar) / (2 * mass))  // = -(ℏ²/2m)
```

### 2.3 Hamiltonian Operator `Ĥ`

The Hamiltonian is the total energy operator:

```
Ĥ = T̂ + V̂ = -(ℏ²/2m) ∂²/∂x²  +  V(x)
```

Acting on the wavefunction at a point `x`:

```
(Ĥψ)(x) = -(ℏ²/2m) ψ''(x)  +  V(x) ψ(x)
```

Split into real and imaginary parts (since `Ĥ` is Hermitian and `V` is real):

```
Re(Ĥψ)[i] = -(ℏ²/2m) · ψ_R''[i]  +  V[i] · ψ_R[i]
Im(Ĥψ)[i] = -(ℏ²/2m) · ψ_I''[i]  +  V[i] · ψ_I[i]
```

This is exactly what `hamiltonianAt` computes (`physics.js:13-23`):

```js
export const hamiltonianAt = (psiRe, psiIm, potential, index, dx) => {
  const kineticFactor = -(square(hbar) / (2 * mass))
  const d2Re = secondDerivativeAt(psiRe, index, dx)
  const d2Im = secondDerivativeAt(psiIm, index, dx)
  const hRe = kineticFactor * d2Re + potential[index] * psiRe[index]
  const hIm = kineticFactor * d2Im + potential[index] * psiIm[index]
  return [hRe, hIm]
}
```

---

## 3. Discretizing the Operators

### 3.1 The spatial grid

Space `[0, L]` is divided into `N` equally spaced grid points with spacing:

```
dx = L / (N - 1)
```

The wavefunction is stored as two arrays of length `N`:

```
psiRe[0..N-1]   // Re(ψ) at each grid point
psiIm[0..N-1]   // Im(ψ) at each grid point
```

Both are `Float64Array` for 64-bit floating-point precision.

### 3.2 Discretizing ∂²/∂x²

The second spatial derivative of the momentum operator is approximated by the **central finite-difference stencil** (a second-order accurate scheme):

```
ψ''(x_i) ≈ (ψ[i-1] - 2ψ[i] + ψ[i+1]) / dx²
```

This is the three-point Laplacian stencil. It is derived from a Taylor expansion of `ψ` around `x_i`, keeping terms up to `O(dx²)`.

Implemented in `secondDerivativeAt` (`physics.js:6-11`):

```js
export const secondDerivativeAt = (values, index, dx) => {
  const left   = values[index - 1]
  const center = values[index]
  const right  = values[index + 1]
  return (left - 2 * center + right) / square(dx)
}
```

This function is called separately on `psiRe` and `psiIm` inside `hamiltonianAt`. Because `Ĥ` is a real operator (when `V` is real), it acts identically on the real and imaginary parts.

### 3.3 Boundary conditions

The outermost grid points are set to zero:

```
ψ[0] = ψ[N-1] = 0
```

These are **Dirichlet boundary conditions**, equivalent to placing the particle in an infinite square well. The wavefunction must vanish at the walls. In `stepSchrodinger`, the boundary values are set explicitly before the inner loop:

```js
nextRe[0] = 0
nextIm[0] = 0
nextRe[N - 1] = 0
nextIm[N - 1] = 0
```

The stencil is only applied to interior points `i = 1 .. N-2`.

### 3.4 Matrix picture (conceptual)

The discrete Hamiltonian is an `(N-2) × (N-2)` tridiagonal matrix `H`:

```
H = -(ℏ²/2m·dx²) · T  +  diag(V)

T = tridiag(-1, 2, -1)   // the discrete Laplacian (with sign flipped by the minus)
```

Each time step multiplies the wavefunction vector by `I - i·dt/ℏ · H`. The explicit Euler method used here approximates the exact unitary evolution operator `e^{-iĤt/ℏ}` to first order in `dt`.

---

## 4. Time Evolution

### 4.1 Euler time step

Rearranging the Schrödinger equation for `∂ψ/∂t`:

```
∂ψ/∂t = -(i/ℏ) Ĥψ
```

Applying an explicit (forward) Euler step:

```
ψ(t + dt) ≈ ψ(t) + dt · ∂ψ/∂t = ψ(t) - (i·dt/ℏ) Ĥψ(t)
```

In component form:

```
ψ_R[i](t+dt) = ψ_R[i](t)  +  (dt/ℏ) · Im(Ĥψ)[i]
ψ_I[i](t+dt) = ψ_I[i](t)  -  (dt/ℏ) · Re(Ĥψ)[i]
```

This is `stepSchrodinger` (`physics.js:53-54`):

```js
nextRe[i] = psiRe[i] + dt * (hIm / hbar)
nextIm[i] = psiIm[i] - dt * (hRe / hbar)
```

### 4.2 Stability

The explicit Euler method is conditionally stable. For the free-particle Schrödinger equation, the stability condition (CFL criterion) requires roughly:

```
dt  ≤  m · dx² / ℏ
```

With `ℏ = m = 1` and the simulation's grid spacing, the chosen `dt` must be small enough to avoid runaway growth. The per-step renormalization (see below) partially masks numerical blow-up, but choosing too large a `dt` will still produce visibly wrong results (the packet will deform non-physically).

### 4.3 Normalization

The Born-rule interpretation requires:

```
∫ |ψ(x,t)|² dx = 1   for all t
```

The Euler method does not preserve this exactly (unlike unitary methods). After each step, the norm is recomputed and the wavefunction is rescaled:

```
norm = Σ_i (ψ_R[i]² + ψ_I[i]²) · dx

ψ[i] ← ψ[i] / √norm
```

Implemented in `normalize` (`physics.js:25-38`). Note: the current implementation modifies the arrays in place (a performance trade-off over allocating new arrays at each step).

---

## 5. Initial State: Gaussian Wave Packet

A Gaussian wave packet is the standard initial state for scattering simulations. It is an approximate eigenstate of neither position nor momentum, but has a well-defined center and mean momentum.

### 5.1 Analytic form

```
ψ(x, 0) = A · exp(-(x - x₀)² / σ²) · exp(ikx)
```

Where:
- `x₀` is the initial center position
- `σ` is the spatial width (controls position uncertainty)
- `k` is the wave number (`k = p/ℏ`, sets the mean momentum)
- `A` is a normalization constant

The first factor (real Gaussian) localizes the packet. The second factor (complex exponential) gives it momentum. By the uncertainty principle:

```
Δx · Δp  ≥  ℏ/2
```

A narrow packet (small `σ`) is well-localized in space but has large momentum spread — it disperses quickly. A wide packet has small momentum spread and propagates more coherently.

### 5.2 In code

`initializePacket` (`physics.js:89-104`) sets:

```js
const gaussian = Math.exp(-square((x - x0) / packetWidth))
const phase    = momentum * x * dx
psiRe[i] = gaussian * Math.cos(phase)
psiIm[i] = gaussian * Math.sin(phase)
```

- `gaussian` is the real envelope
- `Math.cos(phase) + i·Math.sin(phase) = e^{i·phase}` is the carrier wave
- The product gives `ψ(x) = gaussian(x) · e^{ikx}`

After initialization, the packet is normalized.

---

## 6. Potential Energy Operator `V̂`

The potential energy operator is diagonal in position space — it multiplies `ψ(x)` pointwise by `V(x)`. This makes it trivially cheap to apply: no spatial coupling, no stencil needed.

### 6.1 Free particle

```
V(x) = 0
```

The Hamiltonian reduces to pure kinetic energy. The packet spreads by **dispersion**: high-frequency (high-momentum) components travel faster than low-frequency ones, causing the packet to broaden over time.

### 6.2 Finite square barrier

```
V(x) = V₀   for  x ∈ [x_L, x_R]
V(x) = 0    otherwise
```

In the simulation, `V₀ = 1.2` and the barrier is located near 65% of the grid (`buildPotential`, `physics.js:64-74`). When a packet hits a barrier with mean energy below `V₀`, classical mechanics would predict total reflection. Quantum mechanics allows **tunneling**: a portion of the wavefunction passes through the classically forbidden region.

### 6.3 Harmonic oscillator

```
V(x) = ½ k (x - x_c)²
```

With spring constant `k = 8` (`physics.js:78`). The harmonic potential admits exact analytic eigenstates (the Hermite-Gauss functions). A Gaussian wave packet launched in a harmonic potential is a **coherent state** — it oscillates back and forth without spreading (in the exact case). The simulation approximates this behavior; small numerical errors accumulate and you can observe slow dispersion over many cycles.

---

## 7. Measurement and Wavefunction Collapse

### 7.1 Born rule

The probability of measuring the particle at position `x_i` is:

```
P(x_i) = |ψ(x_i)|² · dx = (ψ_R[i]² + ψ_I[i]²) · dx
```

`sampleIndexByBornRule` (`physics.js:123-144`) implements stochastic sampling from this distribution using inverse CDF sampling (a single linear scan with a running threshold, equivalent to sampling from the discrete distribution `P`).

### 7.2 Post-measurement state

After a position measurement that returns `x_c`, the wavefunction collapses to a state localized near `x_c`. In the simulation, this is modeled as a Gaussian centered at the measured index:

```
ψ_post(x) ∝ exp(-(x - x_c)² / w²)
```

with `ψ_I = 0` (real, zero momentum post-measurement). The collapsed state is then renormalized. This is `collapseWavefunction` (`physics.js:106-121`).

This is not a fully rigorous quantum measurement model (which would require specifying a measurement apparatus Hamiltonian), but it correctly captures the key phenomenology: instantaneous localization followed by re-spreading under `Ĥ`.

---

## 8. Frame Pipeline

Each animation frame executes:

```
1. Apply k steps of stepSchrodinger   (physics, pure)
2. Compute render values              (pure):
      probability[i] = psiRe[i]² + psiIm[i]²
      realPart[i]    = psiRe[i]
3. Draw to canvas                     (side effect — only here)
```

Only step 3 has side effects. Steps 1 and 2 are pure transformations of numeric arrays and can be independently tested.

---

## 9. Implementation Notes

| Concern | Choice | Reason |
|---|---|---|
| Wavefunction storage | `Float64Array` | 64-bit precision needed for stable long-running integration |
| Time stepper | Explicit Euler | Simple; conditionally stable; sufficient for educational use |
| Norm conservation | Per-step renormalization | Corrects Euler's non-unitarity; prevents drift |
| Boundary conditions | Dirichlet (zero) | Simplest stable choice; models infinite walls |
| Discretization order | 2nd-order central difference | Good accuracy-vs-cost trade-off for the Laplacian |
| `ℏ`, `m` | Set to 1 | Natural units; avoids tiny SI numbers; see `PLANCK_CONSTANTS.md` |
