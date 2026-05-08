# Planck Constant, Natural Units, and Dimensional Analysis

## 1. The Planck constant

The Planck constant `h` was introduced by Max Planck in 1900 to explain blackbody radiation. It is a fundamental constant of nature that sets the minimum scale at which quantum effects become significant:

```
h  =  6.62607015 × 10⁻³⁴  J·s   (exact, by SI definition since 2019)
```

In quantum mechanics we almost always use the **reduced** Planck constant (pronounced "h-bar"):

```
ℏ = h / 2π  =  1.054571817 × 10⁻³⁴  J·s
```

The factor of `2π` arises because the natural angular frequency `ω` (radians per second) appears more often than the ordinary frequency `f` (cycles per second), and `E = ℏω` is cleaner than `E = hf/2π`.

---

## 2. Where ℏ appears in the operators

The reduced Planck constant enters the Schrödinger equation in two distinct places, corresponding to the two fundamental operators:

### 2.1 Time evolution (left-hand side)

```
iℏ ∂ψ/∂t = Ĥψ
```

The `ℏ` on the left converts between energy units (right-hand side) and time-rate-of-change units (left-hand side). Rearranging:

```
∂ψ/∂t = -(i/ℏ) Ĥψ
```

The factor `1/ℏ` controls **how fast** a given energy `E` rotates the phase of `ψ`. A large `ℏ` slows the rotation; a small `ℏ` makes it fast. With `ℏ = 1`, energy and frequency (in radians/time) are numerically equal.

### 2.2 Momentum operator (kinetic energy term)

The momentum operator is:

```
p̂ = -iℏ ∂/∂x
```

The `ℏ` here converts between spatial frequency (wave number `k`, in units of `1/length`) and momentum `p`:

```
p = ℏk
```

The kinetic energy operator is `T̂ = p̂²/2m`:

```
T̂ = -(ℏ²/2m) ∂²/∂x²
```

The coefficient `ℏ²/2m` controls **how strongly** the spatial curvature of `ψ` drives the kinetic energy. With `ℏ = m = 1`, the kinetic factor is simply `-½`.

### 2.3 Summary of ℏ roles

| Location | Role |
|---|---|
| `iℏ ∂ψ/∂t` | Converts energy to time-rate-of-change; sets the pace of quantum oscillation |
| `p̂ = -iℏ ∂/∂x` | Converts spatial frequency (wave number) to momentum |
| `T̂ = -(ℏ²/2m) ∂²/∂x²` | Sets the strength of kinetic energy relative to curvature |

---

## 3. Dimensional analysis

In SI units:

| Quantity | SI units |
|---|---|
| `ψ(x)` | `m^{-1/2}` (so that `∫|ψ|²dx = 1` is dimensionless) |
| `ℏ` | `J·s = kg·m²·s⁻¹` |
| `x` | `m` |
| `t` | `s` |
| `m` | `kg` |
| `V(x)` | `J = kg·m²·s⁻²` |
| `p` | `kg·m·s⁻¹` |
| `k` | `m⁻¹` |

Checking the kinetic term: `ℏ²/2m · ∂²ψ/∂x²` has units:

```
[J·s]² / kg · m⁻² · m^{-1/2}
= kg²·m⁴·s⁻² / kg · m⁻² · m^{-1/2}  [... simplifying ...]
= kg·m²·s⁻² · m^{-1/2}
= J · m^{-1/2}
```

And `Ĥψ` must have units of `J · m^{-1/2}`, which matches `iℏ ∂ψ/∂t`:

```
ℏ · s⁻¹ · m^{-1/2} = J·s · s⁻¹ · m^{-1/2} = J · m^{-1/2}  ✓
```

All terms balance. When `ℏ = m = 1` (natural units), all these factors collapse to pure numbers and the balance is trivially satisfied.

---

## 4. Natural units: why this simulation uses ℏ = 1

Setting `ℏ = 1` and `m = 1` is the standard convention for quantum mechanics simulations, textbook derivations, and theoretical calculations. It is not an approximation — it is a **choice of unit system**.

### 4.1 What the choice means physically

With `ℏ = 1`:

- Energy and angular frequency are numerically equal: `E = ω`
- Momentum and wave number are numerically equal: `p = k`
- The time for a state of energy `E` to complete one phase rotation is `t = 2π/E`

With `m = 1`:

- Kinetic energy equals half the squared wave number: `T = k²/2`

The simulation grid is defined in **dimensionless spatial units**. `dx`, `dt`, `momentum`, and `packetWidth` are all pure numbers, interpreted within this scaled system.

### 4.2 How to read the simulation parameters

| Parameter | Natural-unit interpretation |
|---|---|
| `momentum = 8` | Mean wave number `k = 8` in grid units; packet moves ~8 grid points per unit time |
| `barrierHeight = 1.2` | Potential `V₀ = 1.2`; packets with kinetic energy `T < 1.2` will exhibit tunneling |
| `k = 8` (harmonic) | Spring constant; energy levels are `E_n = (n + ½)√(k/m) = (n + ½)·2√2` |
| `dt` (set in `App.jsx`) | Time step in natural units; must satisfy the CFL condition `dt ≲ m·dx²/ℏ = dx²` |

### 4.3 Why not use SI units?

If the simulation used `ℏ = 1.055 × 10⁻³⁴ J·s` and modeled a real electron (`m = 9.109 × 10⁻³¹ kg`):

- A physically meaningful grid spacing would be on the order of nanometers: `dx ~ 10⁻¹⁰ m`
- A meaningful time step: `dt ~ 10⁻¹⁷ s`
- The CFL condition: `dt ≤ m·dx²/ℏ ~ (9×10⁻³¹ × 10⁻²⁰) / 10⁻³⁴ ~ 10⁻¹⁷ s` — consistent, but all values are tiny floats that provide no visual intuition

The numerical values would be scientifically accurate but pedagogically opaque. Natural units make the physics transparent.

---

## 5. Switching to SI units

If you want to model a real physical system, every quantity must be rescaled together. Changing only `ℏ` while keeping `dx`, `dt`, `m` in natural units breaks the dimensional consistency of the equation.

A complete SI conversion requires:

1. Choose a physical length scale: `L_phys` (e.g., `1 nm = 10⁻⁹ m`)
2. Compute physical `dx`: `dx_phys = L_phys / (N-1)`
3. Choose mass: `m_phys` (e.g., electron mass `9.109 × 10⁻³¹ kg`)
4. Compute time scale from CFL: `dt_phys ≤ m_phys · dx_phys² / ℏ_SI`
5. Set potential scale: `V` must be in Joules; a barrier of `1 eV = 1.6 × 10⁻¹⁹ J`
6. Set initial momentum: `k_phys = p_phys / ℏ_SI = m_phys · v / ℏ_SI`

All six quantities must be changed simultaneously. Missing any one of them will produce results that are either numerically unstable or physically meaningless.

---

## 6. The uncertainty principle and ℏ

The Heisenberg uncertainty principle relates the spreads of the position and momentum operators:

```
Δx · Δp  ≥  ℏ/2
```

With `ℏ = 1`, this becomes `Δx · Δp ≥ ½`. The `packetWidth` parameter in `initializePacket` directly sets `Δx`. A narrow packet (`packetWidth` small) has large `Δp` and disperses quickly. A wide packet has small `Δp` and propagates more coherently.

The energy-time uncertainty relation is analogous:

```
ΔE · Δt  ≥  ℏ/2
```

A wavefunction with a well-defined energy `E` (an energy eigenstate) has a phase that rotates uniformly at rate `E/ℏ`. In natural units this is just `E`. The simulation does not prepare eigenstates directly — the Gaussian packet is a superposition of many energy eigenstates, which is what causes it to spread and develop interference fringes as it evolves.
