function PhilosophicalClickPage() {
  return (
    <section className="why-page" aria-label="Philosophical meaning of click in quantum measurement">
      <h2>What a click means philosophically</h2>

      <p>
        In this simulator, a click is not just a visual event. It represents a measurement outcome: one concrete fact
        selected from many quantum possibilities.
      </p>

      <h3>From possibilities to one fact</h3>
      <p>
        Before measurement, the state encodes multiple possible outcomes with different probabilities. After
        measurement, you observe one result. Philosophically, this is the transition from potentiality to actuality.
      </p>

      <h3>Context matters</h3>
      <p>
        The same system can produce different kinds of outcomes depending on what is measured. In this app, changing
        detector conditions changes what pattern appears. This reflects contextuality: outcomes depend on the
        experimental arrangement.
      </p>

      <h3>Complementarity</h3>
      <p>
        Wave-like and particle-like descriptions are complementary views, not simultaneous classical properties. A
        click during a which-path setup supports particle-like behavior; no which-path information supports
        interference.
      </p>

      <h3>Limits of classical questions</h3>
      <p>
        Questions like "where exactly was it before measurement?" may not always have a single classical answer. The
        quantum formalism predicts probabilities for outcomes, and the completed measurement defines the observed fact.
      </p>

      <h3>Operational takeaway</h3>
      <ul>
        <li>The click is the registered outcome.</li>
        <li>The setup defines what kind of outcome is possible.</li>
        <li>The state is a rule for probabilities, not a classical trajectory map.</li>
      </ul>

      <h3>Decoherence (decoherencia)</h3>
      <p>
        Decoherence is the process where interaction with an environment destroys stable phase relations between
        alternatives. Practically, interference visibility fades and results look more classical. In this app, we
        mimic measurement outcomes, but we do not simulate full environment-induced decoherence dynamics.
      </p>

      <h3>What the blob sphere means</h3>
      <p>
        The blob-like sphere in the canvas is a visual encoding of probability amplitude density, not a literal hard
        ball particle. A wider blob means more delocalized position uncertainty; a narrower blob means stronger
        localization after collapse.
      </p>

      <h3>Gravity is out of scope</h3>
      <p>
        This simulator uses a non-relativistic Schrodinger model with prescribed potentials. It does not include
        gravitational field dynamics, spacetime curvature, or quantum gravity effects. Gravity-related phenomena are
        intentionally out of scope here.
      </p>
    </section>
  )
}

export default PhilosophicalClickPage
