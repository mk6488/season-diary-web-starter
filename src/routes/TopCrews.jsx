import React, { useMemo } from 'react'
// Vite supports importing raw file contents with ?raw
import crewsMd from '../../J15_Quads_Initial_2025-09-07.md?raw'

function parseFrontmatter(md){
  const m = md.match(/^---([\s\S]*?)---/)
  if(!m) return {}
  const yml = m[1]
  const get = (key) => {
    const rx = new RegExp(`\\b${key}\\s*:\\s*"([^"]*)"`)
    const mm = yml.match(rx); return mm ? mm[1] : ''
  }
  // naive crews parser for fields we need
  const crews = []
  const crewsSection = (()=>{
    const i = yml.indexOf('\ncrews:')
    if(i<0) return ''
    const nextKeyIdx = yml.indexOf('\nverification_plan:')
    return yml.slice(i, nextKeyIdx>i?nextKeyIdx:undefined)
  })()
  if (crewsSection){
    const re = /-\s+name:\s*"([^"]+)"([\s\S]*?)(?=\n\s*-\s+name:|$)/g
    let mm
    while((mm = re.exec(crewsSection))){
      const block = mm[2]
      const name = mm[1]
      const getField = (k) => {
        const rx = new RegExp(`\\b${k}\\s*:\\s*"([^"]*)"`)
        const m2 = block.match(rx); return m2 ? m2[1] : ''
      }
      const seats = []
      const seatRe = /-\s+seat:\s*"([^"]+)"\s*\n\s*athlete:\s*"([^"]+)"/g
      let sm
      while((sm = seatRe.exec(block))){ seats.push({ seat: sm[1], athlete: sm[2] }) }
      crews.push({
        name,
        boat_class: getField('boat_class'),
        steering: getField('steering'),
        rationale: (()=>{ const m3 = block.match(/rationale:\s*\|([\s\S]*?)(?=\n\s*[a-z_]+:|$)/); return m3? m3[1].trim():'' })(),
        test_notes: (()=>{ const m4 = block.match(/test_notes:\s*\|([\s\S]*?)(?=\n\s*[a-z_]+:|$)/); return m4? m4[1].trim():'' })(),
        seats,
      })
    }
  }
  return { title:get('title'), date:get('date'), squad:get('squad'), crews }
}

export default function TopCrews(){
  const data = useMemo(()=> parseFrontmatter(crewsMd), [])
  return (
    <div className="grid">
      <div className="card">
        <h2>{data.title || 'Top Crews'}</h2>
        <p className="small">{data.squad ? `${data.squad} • `: ''}{data.date || ''}</p>
      </div>

      <div className="themes-grid">
        {data.crews && data.crews.map((c)=> (
          <div key={c.name} className="plan-card" style={{padding:14, background:'linear-gradient(135deg,#fff,#f3f4f6)'}}>
            <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <h3 style={{margin:0}}>{c.name}</h3>
              <span className="badge">{c.boat_class || 'crew'}</span>
            </header>
            {!!c.steering && c.steering.toLowerCase().includes('foot-steer') ? null : (
              <p className="small" style={{marginTop:0,marginBottom:8}}>{c.steering}</p>
            )}
            <ul style={{margin:0,paddingLeft:18}}>
              {c.seats?.map(s=> (
                <li key={s.seat}>
                  <strong>{s.seat}:</strong> {s.athlete}
                </li>
              ))}
            </ul>
            {c.rationale && (
              <div style={{marginTop:8}}>
                <div className="small" style={{fontWeight:600}}>Rationale</div>
                <p className="small" style={{whiteSpace:'pre-wrap'}}>{c.rationale}</p>
              </div>
            )}
            {c.test_notes && (
              <div style={{marginTop:4}}>
                <div className="small" style={{fontWeight:600}}>Test notes</div>
                <p className="small" style={{whiteSpace:'pre-wrap'}}>{c.test_notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


