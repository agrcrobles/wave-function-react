function SchrodingerReferencePage() {
  return (
    <section className="why-page" aria-label="Schrodinger equation and scope reference">
      <h2>Schrodinger Equation Reference</h2>

      <p>This page summarizes the basic physical concepts behind the equation.</p>

      <h3>Main equation (time-dependent, 1D)</h3>
      <p className="why-equation">i * hbar * dpsi/dt = -(hbar^2 / 2m) * d2psi/dx2 + V(x) * psi</p>

      <h3>Discrete second derivative used in code</h3>
      <p className="why-equation">d2psi/dx2 approx (psi[i - 1] - 2*psi[i] + psi[i + 1]) / (dx*dx)</p>

      <h3>Core physical concepts</h3>

      <h4>Momentum (p)</h4>
      <p>
        Momentum controls how fast the phase of the wave changes in space. Higher momentum means shorter wavelength,
        faster phase oscillations, and stronger directional propagation.
      </p>

      <h4>Reduced Planck constant (hbar)</h4>
      <p>
        hbar sets the quantum scale. It links wave behavior and particle behavior, appears in the time-evolution term,
        and also in the kinetic-energy term through hbar squared.
      </p>

      <h4>Mass (m)</h4>
      <p>
        Mass controls inertia of the quantum packet. For larger mass, the kinetic term contributes less curvature
        response, so spreading and interference dynamics are typically slower.
      </p>

      <h3>Why energy is quantized</h3>
      <p>
        Energy becomes quantized when the wave is confined by boundary conditions or a bound potential (for example,
        a well or harmonic trap). Only specific standing-wave solutions satisfy both the Schrodinger equation and the
        allowed boundaries.
      </p>
      <p>
        Because each allowed standing-wave mode has a specific frequency and curvature, each mode has a specific
        energy. That is why bound systems show discrete energy levels instead of a continuum.
      </p>

      <h3>Main variables in scope</h3>
      <ul>
        <li><strong>hbar</strong>: reduced Planck constant (scaled to 1 in this educational model).</li>
        <li><strong>mass</strong>: particle mass parameter.</li>
        <li><strong>packetWidth</strong>: initial spatial spread of the packet.</li>
        <li><strong>momentum</strong>: initial phase slope / wave number parameter.</li>
        <li><strong>timeStep</strong>: dt for numerical integration.</li>
        <li><strong>potentialType</strong>: free, barrier, or harmonic.</li>
        <li><strong>psiRe / psiIm</strong>: real and imaginary components of psi on the grid.</li>
        <li><strong>potential</strong>: sampled potential array V(x).</li>
        <li><strong>dx</strong>: spatial step size.</li>
        <li><strong>pointCount</strong>: number of spatial samples in the grid.</li>
      </ul>
    </section>
  )
}

export default SchrodingerReferencePage
