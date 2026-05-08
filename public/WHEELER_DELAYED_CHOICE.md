# Wheeler Delayed-Choice Experiment

## Core idea

Wheeler's delayed-choice experiment probes one of the deepest questions in quantum mechanics:

> Does a photon "decide" whether to behave as a particle or as a wave before it is measured, or is that behavior not defined until the measurement is complete?

The answer quantum mechanics gives is the latter — and this has profound consequences for how we think about quantum reality.

---

## Setup

The experiment uses an interferometer (or double-slit equivalent) where a photon can travel two distinct paths to a detector. The key feature is that the choice of measurement apparatus — which determines whether wave-like interference or particle-like path information is observed — is made **after the photon has already entered the apparatus**.

---

## Case A: Measuring which path (particle behavior)

Place detectors along each path so that we can tell which route the photon took.

Result:

1. The photon is associated with a definite path.
2. The superposition of both paths is destroyed.
3. No interference pattern appears at the detector screen.
4. The photon behaves as a classical particle.

Knowing *which path* is equivalent to measuring the observable `|path⟩`, which does not commute with the interference observable. The act of gathering path information collapses the wavefunction into a path eigenstate.

---

## Case B: Not measuring which path (wave behavior)

Remove the path detectors, allowing both paths to be taken simultaneously in superposition.

Result:

1. The photon propagates as a superposition of both paths.
2. The two amplitudes interfere at the detector screen.
3. A fringe pattern appears.
4. The photon behaves as a wave.

Here the photon's wavefunction is:

```
|ψ⟩ = (1/√2)(|path 1⟩ + e^{iφ}|path 2⟩)
```

The interference visibility is:

```
V = |⟨path 1|path 2⟩|
```

When path information is completely erased (`V = 1`), fringes have maximum contrast. When path information is fully available (`V = 0`), fringes vanish. Partial which-path information gives partial fringe visibility — this is the **complementarity principle**.

---

## The "delayed" part

Wheeler's insight was to make the choice between Case A and Case B **after the photon has already passed the beam splitter** — the point where it "decides" which path to take.

Variants of the experiment have pushed this delay to:

- After the photon passed the slits
- While the photon is in mid-flight between source and detector
- (In cosmic variants) after light has traveled billions of light-years around a gravitational lens

In all cases, the result is the same as if the apparatus had been set up before the photon entered. There is no evidence that the photon "knew in advance" which measurement would be made.

---

## Wheeler's conclusion

Wheeler's famous formulation:

> No phenomenon is a phenomenon until it is an observed phenomenon.

More precisely: in quantum mechanics, asking "which path did the photon *really* take" before specifying the complete measurement context is not a well-posed question. The measurement apparatus and the quantum system form a single experimental arrangement; the observable recorded depends on the full context, not just the preparation.

Key points:

1. The experimental outcome is determined by **what is measured**, not by a pre-existing hidden trajectory.
2. Introducing path detectors after the photon enters does not change a "past decision" — quantum mechanics simply does not assign a definite path to the photon unless a path-measuring observable is part of the experiment.
3. This is not retrocausality. The photon does not travel backward in time and change its behavior. Rather, the concept of "which path it took" is not defined until the measurement is closed.

---

## Connection to the Schrödinger equation

The wave behavior in the Wheeler experiment is governed by the same Schrödinger equation that drives the main simulation. The photon's spatial wavefunction evolves as:

```
iℏ ∂ψ/∂t = Ĥψ
```

At the beam splitter, `ψ` enters a superposition:

```
|ψ_after_splitter⟩ = (1/√2)(|path 1⟩ + |path 2⟩)
```

If a path detector is inserted, the interaction Hamiltonian entangles the photon with the detector:

```
|ψ⟩ → (1/√2)(|path 1⟩|detector clicks on 1⟩ + |path 2⟩|detector clicks on 2⟩)
```

The reduced state of the photon alone (tracing out the detector) is now a **mixed state** — superposition is lost and interference disappears. This is **decoherence** driven by entanglement with the environment.

Without path detectors, no entanglement occurs and the pure superposition reaches the screen, producing fringes.

---

## Complementarity principle

The quantitative statement is the **Englert–Greenberger–Yasin (EGY) duality relation**:

```
D² + V² ≤ 1
```

Where:
- `D` is the **distinguishability** — how well we can tell which path the photon took (0 = no information, 1 = full information)
- `V` is the **fringe visibility** — the contrast of the interference pattern (0 = no fringes, 1 = perfect fringes)

This is a theorem derived from quantum mechanics, not an experimental postulate. It shows that interference and path information are genuinely complementary: gaining one necessarily costs the other.

---

## The simulation (WheelerCanvasPage)

The `WheelerCanvasPage` component animates the experiment with two modes:

| Mode | Description | Physics |
|---|---|---|
| **Detectors off** | Both paths shown simultaneously; intensity pattern at screen shows interference fringes | `D = 0`, `V = 1` |
| **Detectors on** | One path is highlighted; fringe pattern disappears | `D = 1`, `V = 0` |

The toggle between modes can be switched while the photon is "in flight" — illustrating the delayed-choice aspect. The fringe vs. no-fringe outcome depends on the state of the detectors at the moment the result is recorded, regardless of when the switch happened.

---

## Further reading

- J. A. Wheeler, "The 'Past' and the 'Delayed-Choice' Double-Slit Experiment" (1978)
- B.-G. Englert, "Fringe Visibility and Which-Way Information: An Inequality" (1996)
- V. Jacques et al., "Experimental Realization of Wheeler's Delayed-Choice Gedanken Experiment" (2007, *Science*)
- R. Ionicioiu & D. R. Terno, "Proposal for a Quantum Delayed-Choice Experiment" (2011, *PRL*)
