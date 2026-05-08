# Building a Quantum Wave Simulator in the Browser

What if you could watch the Schrödinger equation run live in your browser, click to collapse a wavefunction, and see a particle tunnel through a barrier — all without installing anything? That's exactly what this project does.

**Quantum Wave Visualizer** is an interactive 1D quantum mechanics simulator built with React and vanilla JavaScript. It numerically solves the time-dependent Schrödinger equation in real time, renders everything on an HTML5 Canvas, and lets users experiment with some of the strangest phenomena in physics.

---

## Live Demo

[Try it here](https://agrcrobles.github.io/wave-function-react/#)

![Quantum Wave Visualizer demo](https://github.com/user-attachments/assets/5a6354ea-c9c2-451c-9019-e10a5e12ba4a)

---

## What It Does

The simulator presents a Gaussian wave packet — a localized probability distribution — and lets it evolve under different potentials:

- **Free particle** — the packet disperses as it travels, demonstrating position-momentum uncertainty in action.
- **Square barrier** — part of the packet reflects, part tunnels through a classically forbidden region. Quantum tunneling, live.
- **Harmonic oscillator** — the packet oscillates back and forth as a coherent state in a `V = ½kx²` potential.

Users can toggle between viewing `|ψ|²` (probability density — where the particle is _likely_ to be found) and `Re(ψ)` (the real part of the wavefunction — the wave itself). They can also **click the canvas to perform a measurement**, which collapses the wavefunction to a point sampled stochastically from the Born-rule distribution.

Beyond the main simulation, the app includes several companion pages:

- A **Wheeler Delayed-Choice** experiment visualizer, showing how inserting or removing a beam splitter retroactively determines whether a photon "chose" a path.
- A **Heisenberg Uncertainty** page with dual plots showing the trade-off between position and momentum spread.
- A **Measurement** explainer with an interactive click-to-collapse demo.
- A **"Why ψ?"** conceptual page on why the wavefunction must be complex.
- An in-app **Schrödinger reference card** rendered from Markdown.

---

## The Tech Stack

The application is built with **React 19** and **Vite**, but the interesting part is what it _doesn't_ use: there are no physics or math libraries. The entire Schrödinger solver is hand-written in a single file, `physics.js`, using plain JavaScript typed arrays.

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| UI framework  | React 19                            |
| Build tool    | Vite 8                              |
| Visualization | HTML5 Canvas API                    |
| Numerics      | `Float64Array`, hand-written solver |
| Animation     | `requestAnimationFrame` at 60fps    |
| In-app docs   | `react-markdown`                    |

## How the Project Was Done

This project was built iteratively, prioritizing physics correctness before UI polish.

1. **Define the numerical model**
   The first milestone was a stable 1D discretization of the time-dependent Schr\u00f6dinger equation on a fixed grid with Dirichlet boundaries.
2. **Implement pure physics operators**
   Functions like second derivative, Hamiltonian action, normalization, and collapse were implemented as pure transforms in `src/physics.js`.
3. **Use immutable stepping**
   Every frame reads old `\u03c8` buffers and writes into new buffers. This avoids accidental cross-cell contamination during stencil evaluation.
4. **Wire the render loop**
   Canvas drawing and evolution were tied to `requestAnimationFrame`, keeping the simulation smooth while React handled controls and navigation.
5. **Add interaction and interpretation**
   The click-to-measure flow was added using Born-rule sampling (inverse CDF), then companion pages were created to explain delayed choice and uncertainty.
6. **Document design decisions**
   Supporting markdown docs captured why natural units were used, why immutability matters, and what physical assumptions the simulator makes.
7. **Prepare for deployment**
   The app was configured with Vite build scripts and GitHub Pages deployment so the whole simulation runs statically in the browser.

---

## The Physics Engine: A Study in Functional Design

This is where it gets interesting for developers.

`physics.js` is built almost entirely from **pure functions**. Every operator — `secondDerivativeAt`, `hamiltonianAt`, `stepSchrodinger` — reads only its arguments and returns new values. There are no global state mutations, no side effects hidden in closures.

This is a deliberate architectural decision with a concrete physical motivation: _stencil errors at one grid point must not corrupt neighboring points within the same time step_. By reading from an immutable snapshot of ψ and writing to fresh buffers, you guarantee that the Hamiltonian at every grid point sees the same consistent wavefunction.

```js
// Simplified illustration of the read-old / write-new pattern
function stepSchrodinger(psiRe, psiIm, potential, dt) {
  const nextRe = new Float64Array(psiRe.length);
  const nextIm = new Float64Array(psiIm.length);
  for (let i = 1; i < psiRe.length - 1; i++) {
    const H_psi = hamiltonianAt(i, psiRe, psiIm, potential);
    nextRe[i] = psiRe[i] + dt * H_psi.im; // iℏ ∂ψ/∂t = Hψ
    nextIm[i] = psiIm[i] - dt * H_psi.re;
  }
  return [nextRe, nextIm];
}
```

The time integration uses explicit (forward) Euler. This doesn't preserve unitarity, so after each step the wavefunction is renormalized — compensating for Euler's energy drift, not replacing the need for a small enough `dt`.

### Natural Units

The simulation uses `ℏ = m = 1` throughout, which is standard for pedagogical quantum simulations and removes physical constants from the equations. A dedicated document in the repo (`PLANCK_CONSTANTS.md`) explains what would be required to convert to SI units.

### Born-Rule Sampling via Inverse CDF

When you click the canvas to "measure" the particle, the code samples a position from the probability distribution `P(x) = |ψ(x)|²`. It does this with an elegant O(N) inverse CDF scan — a single pass over the array, accumulating probability until it exceeds a random threshold. No precomputed CDF array needed.

---

## Wavefunction Collapse, Made Interactive

The click-to-measure feature is one of the most compelling parts of the demo. After a measurement:

1. The position is sampled stochastically from `|ψ|²`.
2. The wavefunction is replaced with a narrow Gaussian centered at the sampled point.
3. The simulation continues from the collapsed state.

Click multiple times and you'll see the wave packet re-spread after each collapse, then collapse again — a live demonstration of the measurement problem.

---

## The Wheeler Delayed-Choice Experiment

One of the auxiliary pages simulates a Mach-Zehnder interferometer with a twist: you can toggle the second beam splitter _after_ the photon has (conceptually) already entered the apparatus.

With the beam splitter in place, the photon behaves like a wave — it interferes with itself and exits only one port. Remove it, and it behaves like a particle — it exits randomly from either path. The simulation animates this geometry and updates the exit probabilities in real time, making the delayed-choice paradox viscerally tangible.

---

## What's Next

Some natural extensions for this project:

- **Crank-Nicolson integration** — a unitary, unconditionally stable alternative to Euler that would remove the need for renormalization.
- **2D simulation** — extend the grid to two dimensions and watch interference patterns form.
- **Custom potential drawing** — let users sketch arbitrary potential wells on the canvas.
- **Export / replay** — record a simulation run and share it as an animation.

---

## Running It

```bash
cd wave-function-react
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. No API keys, no backend, no configuration.

---

Quantum mechanics is famously hard to build intuition for. A simulator that lets you _play_ with the equations — not just read about them — is one of the best tools for developing that intuition. This project is a solid foundation for exactly that.
