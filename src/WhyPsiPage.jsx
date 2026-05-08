function WhyPsiPage() {
  return (
    <section className="why-page" aria-label="Why psi and probability density are both important">
      <h2>Why both psi and |psi|^2 matter</h2>

      <p>
        In quantum mechanics, psi is the full wave state. It carries amplitude and phase, and phase is what
        creates interference effects.
      </p>

      <p className="why-equation">psi(x, t) = A(x, t) * exp(i * phi(x, t))</p>

      <p>
        Measurements do not directly read psi. They read probabilities from the Born rule:
      </p>

      <p className="why-equation">P(x, t) = |psi(x, t)|^2</p>

      <h3>What psi gives you</h3>
      <ul>
        <li>Phase information that controls constructive/destructive interference.</li>
        <li>Time evolution from the Schrodinger equation.</li>
        <li>Access to momentum-space behavior after transforms.</li>
      </ul>

      <h3>What |psi|^2 gives you</h3>
      <ul>
        <li>Directly measurable detection probabilities.</li>
        <li>Normalization check: integral |psi|^2 dx = 1.</li>
        <li>Expectation values when combined with observables.</li>
      </ul>

      <p>
        Summary: psi tells you how the quantum state evolves and interferes. |psi|^2 tells you where outcomes are
        likely when you measure.
      </p>
    </section>
  )
}

export default WhyPsiPage
