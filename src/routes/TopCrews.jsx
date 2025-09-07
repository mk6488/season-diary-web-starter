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
  // Verification plan
  const verStart = yml.indexOf('\nverification_plan:')
  const selStart = yml.indexOf('\nselection_criteria:')
  const nextStart = yml.indexOf('\nnext_actions:')
  const verBlock = verStart >= 0 ? yml.slice(verStart, selStart>verStart?selStart:undefined) : ''
  function extractBlock(parent, key){
    const m = parent.match(new RegExp(`${key}:([\\s\\S]*?)(?=\\n\\s*[a-z_]+:|$)`))
    return m ? m[1] : ''
  }
  function parsePlan(block){
    if(!block) return null
    const session = (block.match(/session:\s*"([^"]*)"/)||[])[1] || ''
    const purpose = (block.match(/purpose:\s*"([^"]*)"/)||[])[1] || ''
    const metricsBlock = extractBlock(block, 'metrics')
    const metrics = metricsBlock
      ? metricsBlock.split(/\n/).map(s=>s.trim()).filter(s=>s.startsWith('-')).map(s=> s.replace(/^-\s*"?/, '').replace(/"$/, ''))
      : []
    return { session, purpose, metrics }
  }
  const verification_plan = verBlock ? {
    rate_capped: parsePlan(extractBlock(verBlock, 'rate_capped')),
    race_rate: parsePlan(extractBlock(verBlock, 'race_rate')),
    seat_races: (()=>{
      const block = extractBlock(verBlock, 'seat_races')
      if(!block) return null
      const crewsMap = {}
      const crewRe = /(\w+):\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/g
      let mcrew
      while((mcrew = crewRe.exec(block))){
        const crewName = mcrew[1].replace(/_/g,' ')
        const items = mcrew[2].split(/\n/).map(s=>s.trim()).filter(s=>s.startsWith('-')).map(s=> s.replace(/^-\s*"?/, '').replace(/"$/, ''))
        crewsMap[crewName] = items
      }
      return crewsMap
    })()
  } : null

  // Selection criteria and next actions as simple lists
  function parseList(startIdx){
    if(startIdx < 0) return []
    const endIdx = (startIdx === selStart && nextStart>selStart) ? nextStart : undefined
    const block = yml.slice(startIdx, endIdx)
    return block.split(/\n/).map(s=>s.trim()).filter(s=>s.startsWith('-')).map(s=> s.replace(/^-\s*"?/, '').replace(/"$/, ''))
  }
  const selection_criteria = parseList(selStart)
  const next_actions = parseList(nextStart)

  return { title:get('title'), date:get('date'), squad:get('squad'), crews, verification_plan, selection_criteria, next_actions }
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
        {data.crews && data.crews.map((c, i)=> (
          <div key={c.name} className={`crew-card crew-${i%5}`}>
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
      {data.verification_plan && (
        <div className="card">
          <h2>Verification Plan</h2>
          <div className="plan-grid">
            {data.verification_plan.rate_capped && (
              <div className="plan-card"><h3 style={{marginTop:0}}>Rate-capped</h3>
                <p className="small"><strong>Session:</strong> {data.verification_plan.rate_capped.session}</p>
                <p className="small"><strong>Purpose:</strong> {data.verification_plan.rate_capped.purpose}</p>
                {data.verification_plan.rate_capped.metrics?.length>0 && (
                  <ul className="small" style={{marginTop:8}}>
                    {data.verification_plan.rate_capped.metrics.map((m,i)=>(<li key={i}>{m}</li>))}
                  </ul>
                )}
              </div>
            )}
            {data.verification_plan.race_rate && (
              <div className="plan-card"><h3 style={{marginTop:0}}>Race-rate</h3>
                <p className="small"><strong>Session:</strong> {data.verification_plan.race_rate.session}</p>
                <p className="small"><strong>Purpose:</strong> {data.verification_plan.race_rate.purpose}</p>
                {data.verification_plan.race_rate.metrics?.length>0 && (
                  <ul className="small" style={{marginTop:8}}>
                    {data.verification_plan.race_rate.metrics.map((m,i)=>(<li key={i}>{m}</li>))}
                  </ul>
                )}
              </div>
            )}
            {data.verification_plan.seat_races && (
              <div className="plan-card"><h3 style={{marginTop:0}}>Seat races</h3>
                {Object.entries(data.verification_plan.seat_races).map(([k, items])=> (
                  <div key={k} style={{marginBottom:8}}>
                    <div className="small" style={{fontWeight:600}}>{k}</div>
                    <ul className="small" style={{marginTop:4}}>
                      {items.map((it,i)=>(<li key={i}>{it}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {data.selection_criteria?.length>0 && (
        <div className="card">
          <h2>Selection Criteria</h2>
          <ul className="small" style={{marginTop:6}}>
            {data.selection_criteria.map((c,i)=>(<li key={i}>{c}</li>))}
          </ul>
        </div>
      )}

      {data.next_actions?.length>0 && (
        <div className="card">
          <h2>Next Actions</h2>
          <ul className="small" style={{marginTop:6}}>
            {data.next_actions.map((n,i)=>(<li key={i}>{n}</li>))}
          </ul>
        </div>
      )}
    </div>
  )
}


