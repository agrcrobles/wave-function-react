# Quantum Wave Visualizer

It solves the time-dependent Schrödinger equation in real time in the browser, letting you watch a wavefunction evolve, tunnel through barriers, collapse under measurement, and exhibit interference.

## Live demo

[Open the live app](https://agrcrobles.github.io/wave-function-react/#)

![Quantum Wave Visualizer demo](https://github.com/user-attachments/assets/5a6354ea-c9c2-451c-9019-e10a5e12ba4a)

## What it does

The simulation numerically integrates the time-dependent Schrödinger equation:

```
iℏ ∂ψ/∂t = Ĥψ
```

where the Hamiltonian operator `Ĥ` combines kinetic and potential energy:

```
Ĥ = -(ℏ²/2m) ∂²/∂x²  +  V(x)
```

Space is discretized on a 1D grid with Dirichlet (zero) boundary conditions. Time is advanced with an explicit Euler step, normalized at every frame to keep the wavefunction unit-norm.

## Pages

| Page                      | Description                                                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Simulation**            | Main canvas. Watch a Gaussian wave packet evolve under free, barrier, or harmonic potentials. Toggle between `\|ψ\|²` (probability density) and `Re(ψ)` (real part) views. Click to collapse the wavefunction. |
| **Why ψ?**                | Conceptual explanation of why the wavefunction is complex-valued and what its real and imaginary parts mean.                                                                                                   |
| **Measurement**           | Interactive click-to-measure demonstration of Born-rule collapse.                                                                                                                                              |
| **Wheeler Canvas**        | Animated Wheeler delayed-choice experiment showing particle vs. wave behavior depending on whether path information is recorded.                                                                               |
| **Speed vs Position**     | Dual-plot canvas showing the trade-off between position and momentum spread — a visual representation of the Heisenberg uncertainty principle.                                                                 |
| **Schrödinger Reference** | In-app reference card for the equation, its operators, and the notation used throughout.                                                                                                                       |

## Physics overview

### The wavefunction

The state of a quantum particle is described by a complex-valued wavefunction `ψ(x, t)`. It encodes all observable information about the particle. The quantity `|ψ(x, t)|²` gives the probability density of finding the particle at position `x` at time `t`.

This simulator represents `ψ` as two `Float64Array` buffers — one for the real part and one for the imaginary part — updated at every animation frame.

### Operators

Quantum mechanics is built on operators acting on the wavefunction. The key operators in this simulation are:

**Position operator `x̂`**
Multiplication by `x`. Applied implicitly when evaluating `V(x)ψ`.

**Momentum operator `p̂`**

```
p̂ = -iℏ ∂/∂x
```

Its square gives the kinetic energy term:

```
p̂² / 2m = -(ℏ²/2m) ∂²/∂x²
```

**Hamiltonian operator `Ĥ`**
The total energy operator:

```
Ĥ = p̂²/2m + V(x̂) = -(ℏ²/2m) ∂²/∂x²  +  V(x)
```

Acting on `ψ` gives the right-hand side of the Schrödinger equation (up to the `iℏ` factor on the left).

### Discretization

Space is divided into `N` grid points with spacing `dx`. The second derivative is approximated with the central finite-difference stencil:

```
∂²ψ/∂x²  ≈  (ψ[i-1] - 2ψ[i] + ψ[i+1]) / dx²
```

This three-point stencil is the discrete version of the kinetic energy operator applied to each grid point.

### Time stepping

Each frame applies:

```
ψ(t + dt) = ψ(t)  -  (i·dt/ℏ) Ĥ ψ(t)
```

Split into real and imaginary components (since `ψ = Re + i·Im`):

```
Re[i](t+dt) = Re[i](t)  +  dt/ℏ · Im(Ĥψ)[i]
Im[i](t+dt) = Im[i](t)  -  dt/ℏ · Re(Ĥψ)[i]
```

After each step the wavefunction is renormalized so `∫|ψ|² dx = 1`.

### Potentials

Three potential shapes are available:

- **Free** — `V(x) = 0`. The packet spreads by dispersion.
- **Barrier** — A finite square potential at ~65% of the grid. Demonstrates quantum tunneling.
- **Harmonic** — `V(x) = ½kx²`. The packet oscillates like a coherent state.

### Measurement and collapse

Clicking the simulation canvas triggers a measurement. The position is sampled stochastically from the Born-rule distribution `P(x) = |ψ(x)|²`. The wavefunction is then replaced by a Gaussian centered on the sampled position — modeling the post-measurement state.

## Getting started

```bash
cd wave-function-react
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Script            | Purpose                            |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start development server with HMR  |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run ESLint                         |

## How this project was built

This project was built in deliberate layers so the physics stayed correct while interactivity grew:

1. **Core physics first**
   The Schr\u00f6dinger solver was implemented in `src/physics.js` with typed arrays and pure functions.
2. **Natural-unit simplification**
   The model uses `\u210f = m = 1`, reducing unit-conversion noise and keeping equations readable.
3. **Immutable frame updates**
   Each time step reads from current buffers and writes into fresh buffers, then normalizes `\u03c8`.
4. **React shell + Canvas runtime**
   React handles navigation and controls, while the simulation loop runs with `requestAnimationFrame` on canvas.
5. **Measurement interaction**
   Click-to-measure was added by sampling from `|\u03c8|\u00b2`, collapsing to a Gaussian, and continuing evolution.
6. **Educational companion pages**
   Additional pages (Wheeler delayed choice, uncertainty, references) were added to explain behavior beyond the main plot.
7. **Documentation and deploy**
   The markdown references were written alongside code and deployment was configured for static hosting via Vite and GitHub Pages.

## Project structure

```
src/
├── physics.js              # Core Schrödinger solver: operators, time step, collapse
├── wheelerPhysics.js       # Wheeler delayed-choice geometry helpers
├── App.jsx                 # Shell, routing, main simulation canvas
├── WhyPsiPage.jsx          # Conceptual wavefunction explainer
├── MeasurementClickPage.jsx
├── SchrodingerReferencePage.jsx
├── WheelerCanvasPage.jsx
└── SpeedPositionCanvasPage.jsx
```

## Further reading

- [`IMMUTABLE_LOGIC.md`](./IMMUTABLE_LOGIC.md) — Detailed walkthrough of every physics function and the Schrödinger operator decomposition.
- [`PLANCK_CONSTANTS.md`](./PLANCK_CONSTANTS.md) — Why `ℏ = 1` is used and what would be needed to switch to SI units.
- [`WHEELER_DELAYED_CHOICE.md`](./WHEELER_DELAYED_CHOICE.md) — Physics and interpretation of the Wheeler delayed-choice experiment.

## License

MIT. See `LICENSE`.
