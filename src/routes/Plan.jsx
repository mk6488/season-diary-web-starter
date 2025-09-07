import React from 'react'

export default function Plan(){
  return (
    <div className="grid">
      <div className="card">
        <h2>Six-Week Training Plan</h2>
        <p className="small" style={{marginTop:-6}}>
          Suggested framework only — not the actual training plan. Coaches may adapt based on testing and crew needs.
        </p>
      </div>

      <div className="plan-grid">
        <section className="plan-card plan-foundation">
          <header>
            <h3>Weeks 1–2</h3>
            <span className="badge">Foundation</span>
          </header>
          <ul>
            <li><strong>Water (Tech)</strong>: Low-rate steady, pause drills, sequencing.</li>
            <li><strong>Water (Endurance)</strong>: 3 × 12 min @18–22 spm.</li>
            <li><strong>Erg (Endurance)</strong>: 4 × 6 min @22–24, 2 min rest.</li>
            <li><strong>Erg (Sprint intro)</strong>: 10 × 30s on/90s off @36–40.</li>
            <li><strong>S&C</strong>: Technique circuits.</li>
          </ul>
        </section>

        <section className="plan-card plan-development">
          <header>
            <h3>Weeks 3–4</h3>
            <span className="badge">Development</span>
          </header>
          <ul>
            <li><strong>Water (Efficiency)</strong>: 5 × 4 min @24, power/length.</li>
            <li><strong>Water (Endurance)</strong>: 2 × 15 min @20–22, neg split.</li>
            <li><strong>Erg (Threshold)</strong>: 3 × 8 min @24–26, 2 min rest.</li>
            <li><strong>Erg (Sprint)</strong>: 6 × 250m @max, 3 min rest.</li>
            <li><strong>S&C</strong>: Strength + plyo.</li>
          </ul>
        </section>

        <section className="plan-card plan-integration">
          <header>
            <h3>Weeks 5–6</h3>
            <span className="badge">Integration</span>
          </header>
          <ul>
            <li><strong>Water (Race prep)</strong>: 3 × 1k @24, free last 200m.</li>
            <li><strong>Water (Endurance)</strong>: 40–50 min steady @18–20.</li>
            <li><strong>Erg (Race blend)</strong>: 4 × 750m @26–28.</li>
            <li><strong>Erg (Sprint sharpen)</strong>: 3 × 500m @36+, 4 min rest.</li>
            <li><strong>S&C</strong>: Mixed lift + trunk.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
