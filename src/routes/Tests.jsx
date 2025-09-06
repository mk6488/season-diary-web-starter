import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTests } from '../data/useData'
import { useFilters } from '../data/filters'

export default function Tests(){
  const { focus } = useFilters()
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })

  const baseRows = getTests().filter(r => (focus ? r.focus === focus : true))

  const rows = useMemo(() => {
    const copy = baseRows.slice()
    const dir = sort.dir === 'asc' ? 1 : -1
    const getVal = (r) => {
      switch (sort.key) {
        case 'date': return new Date(r.date).getTime()
        case 'athlete': return r.athlete?.toLowerCase() ?? ''
        case 'type': return r.type?.toLowerCase() ?? ''
        case 'time': return parseTime(r.time)
        case 'split': return parseTime(r.split)
        case 'rate': return Number.isFinite(r.rate) ? r.rate : NaN
        default: return ''
      }
    }
    copy.sort((a,b) => {
      const av = getVal(a)
      const bv = getVal(b)
      const aInvalid = av === '' || Number.isNaN(av)
      const bInvalid = bv === '' || Number.isNaN(bv)
      if (aInvalid && bInvalid) return 0
      if (aInvalid) return 1
      if (bInvalid) return -1
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * dir
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir
    })
    return copy
  }, [baseRows, sort])

  function toggleSort(key){
    setSort(prev => {
      if (prev.key === key){
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      const defaultDir = (key === 'date' || key === 'time' || key === 'split' || key === 'rate') ? 'desc' : 'asc'
      return { key, dir: defaultDir }
    })
  }

  const ariaFor = (key) => sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
  const caret = (key) => sort.key === key ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''
  return (
    <div className="card">
      <h2>Testing Log</h2>
      <div className="table-wrap"><table className="table">
        <thead style={{position:'sticky',top:0,background:'var(--panel)'}}>
          <tr>
            <th aria-sort={ariaFor('date')}>
              <button className="th-sort" onClick={()=>toggleSort('date')}>Date <span className="sort-caret">{caret('date')}</span></button>
            </th>
            <th aria-sort={ariaFor('athlete')}>
              <button className="th-sort" onClick={()=>toggleSort('athlete')}>Athlete <span className="sort-caret">{caret('athlete')}</span></button>
            </th>
            <th aria-sort={ariaFor('type')}>
              <button className="th-sort" onClick={()=>toggleSort('type')}>Test <span className="sort-caret">{caret('type')}</span></button>
            </th>
            <th aria-sort={ariaFor('time')}>
              <button className="th-sort" onClick={()=>toggleSort('time')}>Time <span className="sort-caret">{caret('time')}</span></button>
            </th>
            <th aria-sort={ariaFor('split')}>
              <button className="th-sort" onClick={()=>toggleSort('split')}>Split <span className="sort-caret">{caret('split')}</span></button>
            </th>
            <th aria-sort={ariaFor('rate')}>
              <button className="th-sort" onClick={()=>toggleSort('rate')}>Rate <span className="sort-caret">{caret('rate')}</span></button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={`${r.id}-${r.date}-${r.type}`}>
              <td className="mono">{r.date}</td>
              <td><Link to={`/athlete/${r.id}`}>{r.athlete}</Link></td>
              <td>{r.type}</td>
              <td className="mono">{r.time}</td>
              <td className="mono">{r.split}</td>
              <td className="mono">{r.rate ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <button onClick={()=>downloadCsv(rows)} className="tag">Export CSV</button>
      </div>
    </div>
  )
}

function downloadCsv(rows){
  const header = ['date','athlete','id','type','time','split','rate']
  const csv = [header.join(',')].concat(
    rows.map(r=> header.map(k=>escapeCsv(r[k] ?? '')).join(','))
  ).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'tests.csv'; a.click();
  URL.revokeObjectURL(url)
}
function escapeCsv(val){
  const s = String(val)
  return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s
}

function parseTime(text){
  if (!text) return NaN
  if (text === '(DNF)') return NaN
  // mm:ss.s or m:ss.s
  const parts = String(text).split(':')
  if (parts.length === 1){
    const v = Number(parts[0])
    return Number.isFinite(v) ? v : NaN
  }
  let total = 0
  for(const p of parts){ total = total*60 + Number(p) }
  return Number.isFinite(total) ? total : NaN
}
