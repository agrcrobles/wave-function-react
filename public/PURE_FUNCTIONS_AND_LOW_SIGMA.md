# Pure Functions and Low-σ Stability in the Physics Engine

## What "pure" means here

A **pure function** is one that:

1. Returns the same output for the same inputs — always
2. Has no side effects — it does not read or write any state outside its arguments

In `physics.js`, every operator function meets this definition:

```js
// Pure: reads only its arguments, returns a new number
export const secondDerivativeAt = (values, index, dx) => {
  const left   = values[index - 1]
  const center = values[index]
  const right  = values[index + 1]
  return (left - 2 * center + right) / square(dx)
}

// Pure: reads psiRe, psiIm, potential; returns new [hRe, hIm]
export const hamiltonianAt = (psiRe, psiIm, potential, index, dx) => { ... }

// Pure: reads psiRe, psiIm, potential; returns new arrays
export const stepSchrodinger = (psiRe, psiIm, potential, dx, dt) => { ... }
```

The only exception is `normalize`, which mutates its input arrays for performance — a deliberate trade-off documented in its JSDoc.

---

## Why purity matters for numerical physics

### 1. No hidden state can corrupt the computation

An impure function might read from a module-level variable, accumulate a counter, or depend on call order. In a 60 fps animation loop that runs hundreds of time steps per second, any hidden state drift accumulates and eventually destabilizes the simulation.

Because every operator function only sees the arrays passed into it, the result of step `n+1` is entirely determined by the output of step `n`. The computation is a clean chain:

```
ψ(t₀) → step → ψ(t₁) → step → ψ(t₂) → ...
```

There is no frame counter, no global accumulator, no mutation escaping from one step into the next.

### 2. Each function can be reasoned about and tested in isolation

`hamiltonianAt` can be called with hand-crafted arrays in a unit test with no simulation running. `secondDerivativeAt` can be verified against the analytic derivative of a known function. Neither function requires any setup or teardown.

---

## The low-σ problem

σ (sigma) is the **spatial width** of the Gaussian wave packet:

```
ψ(x, 0) = A · exp(-(x - x₀)² / σ²) · exp(ikx)
```

A small σ produces a sharply peaked packet — well-localized in space, but with a large momentum spread by the uncertainty principle:

```
Δx · Δp  ≥  ℏ/2

small σ  =>  small Δx  =>  large Δp
```

This is where numerical simulations become fragile. A narrow packet contains high-frequency spatial components (large wave numbers `k`). The finite-difference stencil must resolve these frequencies accurately.

---

## Why low-σ is hard for the stencil

### The central difference stencil

`secondDerivativeAt` computes:

```
ψ''(x_i) ≈ (ψ[i-1] - 2ψ[i] + ψ[i+1]) / dx²
```

This stencil is exact for polynomials up to degree 3, and accurate to `O(dx²)` in general. But it assumes the function varies **smoothly** relative to `dx`.

For a narrow Gaussian with width σ, the relevant spatial frequency is roughly `k_max ~ 1/σ`. The stencil can only represent wave numbers up to the **Nyquist limit**:

```
k_nyquist = π / dx
```

When `σ` is small relative to `dx` — meaning the packet spans only a few grid points — `k_max` approaches or exceeds `k_nyquist`. The stencil then misrepresents the curvature, returning values that are too large (the second derivative is overestimated).

### What overestimated curvature does to the Hamiltonian

The kinetic energy term is:

```
T̂ψ = -(ℏ²/2m) · ψ''
```

If `ψ''` is overestimated, `T̂ψ` is overestimated, which means the Hamiltonian returns inflated values, which means the time step applies too large an update, which causes the packet to spread or oscillate too fast. With enough steps, the norm correction (`normalize`) can no longer mask the error and the simulation diverges.

---

## Why pure functions contain the damage

A stencil error at grid point `i` produces a wrong `[hRe, hIm]` from `hamiltonianAt`. In an impure design — where the Hamiltonian might cache results, read from global arrays, or partially update the state before returning — that error could propagate sideways into the same step, corrupting neighboring points in undefined order.

Because `hamiltonianAt` is pure and `stepSchrodinger` reads from the **old** arrays while writing to **new** arrays:

```js
const nextRe = new Float64Array(psiRe.length)  // fresh buffer
const nextIm = new Float64Array(psiIm.length)

for (let i = 1; i < psiRe.length - 1; i += 1) {
  const [hRe, hIm] = hamiltonianAt(psiRe, psiIm, potential, i, dx)
  nextRe[i] = psiRe[i] + dt * (hIm / hbar)
  nextIm[i] = psiIm[i] - dt * (hRe / hbar)
}
```

The error at index `i` does not affect the evaluation at index `i+1` within the same step. The stencil at every point reads from the **same clean snapshot** of `ψ`. This is the discrete equivalent of an explicit (non-iterative) method — errors are local and additive, not cascading within a single step.

The damage from a bad stencil evaluation is:
- **Contained to the current step** — it cannot corrupt the input arrays
- **Additive, not multiplicative** — subsequent steps correct toward the true solution (up to the stability limit)
- **Detectable** — the norm after `stepSchrodinger` deviates visibly from 1.0 if the error is large

---

## The CFL stability condition and σ

The explicit Euler method is conditionally stable. For the Schrödinger equation the stability condition (derived from von Neumann analysis) is:

```
dt  ≤  m · dx² / ℏ  =  dx²   (with ℏ = m = 1)
```

But this condition alone is not sufficient when σ is very small. The effective wave number of the packet is `k ~ 1/σ`, and the phase velocity of the highest-frequency component scales as `v_phase ~ k`. A fast-moving high-k component requires:

```
dt  ≤  dx / v_phase  ~  σ · dx
```

So for low σ, the time step must be reduced proportionally to σ. If `dt` is held fixed while `σ` is decreased, the simulation will eventually become unstable regardless of purity. Purity does not fix an ill-conditioned discretization — but it ensures that the instability arrives as a clean, reproducible divergence rather than a silent, order-dependent accumulation of garbage from shared state.

---

## Normalization as the last line of defense

After every step, `normalize` rescales the wavefunction:

```js
normalize(nextRe, nextIm, dx)
return [nextRe, nextIm]
```

This keeps `∫|ψ|² dx = 1` at all times and prevents norm drift from compounding across frames. For low-σ packets, the per-step norm error is larger (because the kinetic energy is larger), so normalization does more correction per step. It is not a substitute for a small enough `dt`, but it substantially extends the range of σ values the simulation can handle without visible blow-up.

Because `normalize` operates on the freshly allocated `nextRe/nextIm` buffers (not on the input arrays), the correction is applied to a clean state — another consequence of the pure, buffer-per-step design.

---

## Summary

| Property | Benefit for low-σ simulations |
|---|---|
| Pure functions | Stencil errors at one point do not corrupt neighbors within the same step |
| Read-old / write-new buffers | Each step sees a clean snapshot; no within-step feedback |
| No hidden state | Norm drift and instability are reproducible and diagnosable |
| Per-step normalization | Suppresses norm growth caused by high-frequency content |
| `Float64Array` precision | Reduces rounding error for the small values in the tails of a narrow Gaussian |

The core insight is that purity turns a numerical instability from an **opaque, order-dependent failure** into a **transparent, reproducible, diagnosable one**. You know exactly which inputs caused which outputs, which makes tuning `dt` and `σ` for a given grid resolution straightforward.
