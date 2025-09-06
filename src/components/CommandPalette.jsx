import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAthletes } from '../data/useData'
import { useFilters } from '../data/filters'

export default function CommandPalette(){
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { setFocus } = useFilters()

  useEffect(() => {
    const onKey = (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const input = document.getElementById('cmd-input')
    input && input.focus()
  }, [open])

  const athletes = getAthletes()
  const baseItems = useMemo(() => {
    const items = [
      { type:'route', label:'Dashboard', to:'/' },
      { type:'route', label:'Testing Log', to:'/tests' },
      { type:'route', label:'Focus & Themes', to:'/themes' },
      { type:'route', label:'6-Week Plan', to:'/plan' },
      { type:'route', label:'Data Manager', to:'/data' },
    ]
    for(const a of athletes){
      items.push({ type:'athlete', label:a.name, to:`/athlete/${a.id}`, meta:a.group })
    }
    return items
  }, [athletes])

  const q = query.trim().toLowerCase()
  const results = q
    ? baseItems.filter(it => (it.label.toLowerCase().includes(q) || (it.meta?.toLowerCase().includes(q))))
    : baseItems.slice(0, 10)

  function onSelect(it){
    setOpen(false)
    if (it.type === 'athlete' || it.type === 'route'){
      navigate(it.to)
    }
  }

  function onQuickFocus(f){
    setOpen(false)
    setFocus(f)
    navigate('/')
  }

  if(!open) return null
  return (
    <div className="cmd-overlay" role="dialog" aria-modal="true" aria-label="Command palette" onClick={()=>setOpen(false)}>
      <div className="cmd" onClick={e=>e.stopPropagation()}>
        <input id="cmd-input" placeholder="Search athletes or pages… (Esc to close)" value={query} onChange={e=>setQuery(e.target.value)} />
        <div className="cmd-actions">
          <button className="tag" onClick={()=>onQuickFocus('Endurance')}>Endurance</button>
          <button className="tag" onClick={()=>onQuickFocus('Aerobic base')}>Aerobic base</button>
          <button className="tag" onClick={()=>onQuickFocus('Technique')}>Technique</button>
          <button className="tag" onClick={()=>onQuickFocus('Power')}>Power</button>
        </div>
        <ul className="cmd-list">
          {results.map((it,i)=> (
            <li key={i}>
              <button onClick={()=>onSelect(it)}>
                <span className="cmd-label">{it.label}</span>
                {it.meta && <span className="small">{it.meta}</span>}
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="small" style={{padding:'8px 12px'}}>No results</li>}
        </ul>
      </div>
    </div>
  )
}


