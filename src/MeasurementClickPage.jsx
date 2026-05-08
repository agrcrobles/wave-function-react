function MeasurementClickPage() {
  return (
    <section className="why-page" aria-label="Physical meaning of click collapse">
      <h2>What physically happens when you click</h2>

      <p>
        In this simulator, a click represents a position measurement. The measurement updates the state from a
        spread-out wave into a localized packet around one position.
      </p>

      <p className="why-equation">Before measurement: psi(x) is delocalized over many x values.</p>
      <p className="why-equation">After measurement: psi(x) is localized near one x0.</p>

      <h3>Physical interpretation</h3>
      <ul>
        <li>The wavefunction encodes many possible positions before measurement.</li>
        <li>Measurement selects one outcome position (x0).</li>
        <li>The post-measurement state is sharply peaked around x0.</li>
      </ul>

      <h3>In this app</h3>
      <ul>
        <li>Click mode: x0 is your click position on the canvas.</li>
        <li>Born mode: x0 is sampled from |psi|^2, matching the Born probability rule.</li>
        <li>After collapse, Schrodinger evolution continues, so the packet spreads and moves again.</li>
      </ul>

      <h3>Why the packet spreads again</h3>
      <p>
        A narrow packet in position contains many momentum components. Those components evolve at different phases,
        so the packet broadens over time.
      </p>

      <p className="why-equation">Narrower in x  -&gt;  wider in p (uncertainty tradeoff)</p>

      <p>
        So the click does not freeze the state permanently. It performs one measurement update, then unitary
        evolution resumes.
      </p>
    </section>
  )
}

export default MeasurementClickPage
