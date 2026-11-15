import { useEffect, useState } from 'react'

const KEY = 'deadlinelab.v1'
const uid = () => Math.random().toString(36).slice(2, 10)

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function daysLeft(due) {
  return Math.ceil((new Date(due + 'T23:59:59') - new Date()) / 86400000)
}

function progress(p) {
  if (p.tasks.length) return Math.round((p.tasks.filter(t => t.done).length / p.tasks.length) * 100)
  return p.done ? 100 : 0
}

function status(p) {
  if (p.done) return { text: 'Tamamlandı', cls: 'ok' }
  const d = daysLeft(p.due)
  if (d < 0) return { text: `${-d} gün gecikti`, cls: 'late' }
  if (d === 0) return { text: 'Bugün son gün!', cls: 'urgent' }
  return { text: `${d} gün kaldı`, cls: d <= 3 ? 'urgent' : 'normal' }
}

export default function App() {
  const [projects, setProjects] = useState(load)
  const [form, setForm] = useState({ title: '', course: '', due: '' })
  const [filter, setFilter] = useState('all')

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(projects)) }, [projects])

  const update = (id, fn) => setProjects(ps => ps.map(p => (p.id === id ? fn(p) : p)))

  const add = e => {
    e.preventDefault()
    if (!form.title.trim() || !form.due) return
    setProjects(ps => [...ps, { id: uid(), ...form, title: form.title.trim(), tasks: [], done: false }])
    setForm({ title: '', course: '', due: '' })
  }

  const toggleProject = p =>
    update(p.id, x => {
      const done = !x.done
      return { ...x, done, tasks: x.tasks.map(t => ({ ...t, done })) }
    })

  const addTask = (p, text) => {
    if (!text.trim()) return
    update(p.id, x => ({ ...x, done: false, tasks: [...x.tasks, { id: uid(), text: text.trim(), done: false }] }))
  }

  const toggleTask = (p, tid) =>
    update(p.id, x => {
      const tasks = x.tasks.map(t => (t.id === tid ? { ...t, done: !t.done } : t))
      return { ...x, tasks, done: tasks.every(t => t.done) }
    })

  const visible = projects
    .filter(p => filter === 'all' || (filter === 'done' ? p.done : !p.done))
    .sort((a, b) => a.due.localeCompare(b.due))

  const total = projects.length
  const doneCount = projects.filter(p => p.done).length
  const overall = total ? Math.round(projects.reduce((s, p) => s + progress(p), 0) / total) : 0

  return (
    <div className="app">
      <header>
        <h1>⏳ DeadlineLab</h1>
        <p>Akıllı Teslim Takip Paneli</p>
      </header>

      <section className="summary">
        <div className="card"><b>{total}</b><span>Toplam</span></div>
        <div className="card"><b>{doneCount}</b><span>Tamamlanan</span></div>
        <div className="card"><b>{total - doneCount}</b><span>Bekleyen</span></div>
        <div className="card wide">
          <span>Genel ilerleme: %{overall}</span>
          <div className="bar"><div style={{ width: overall + '%' }} /></div>
        </div>
      </section>

      <form className="add" onSubmit={add}>
        <input placeholder="Ödev / proje adı" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Ders (isteğe bağlı)" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} />
        <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
        <button>Ekle</button>
      </form>

      <div className="filters">
        {[['all', 'Tümü'], ['active', 'Bekleyen'], ['done', 'Tamamlanan']].map(([k, l]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {visible.length === 0 && <p className="empty">Henüz kayıt yok. Yukarıdan ilk teslimini ekle!</p>}

      <div className="grid">
        {visible.map(p => {
          const s = status(p)
          const pr = progress(p)
          return (
            <article key={p.id} className={'project ' + s.cls}>
              <div className="top">
                <div>
                  <h3 className={p.done ? 'strike' : ''}>{p.title}</h3>
                  {p.course && <small>{p.course}</small>}
                </div>
                <span className={'badge ' + s.cls}>{s.text}</span>
              </div>
              <small>Son teslim: {new Date(p.due).toLocaleDateString('tr-TR')}</small>
              <div className="bar"><div style={{ width: pr + '%' }} /></div>
              <small>İlerleme: %{pr}</small>

              <ul>
                {p.tasks.map(t => (
                  <li key={t.id}>
                    <label>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(p, t.id)} />
                      <span className={t.done ? 'strike' : ''}>{t.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <input
                className="task-input"
                placeholder="Alt görev ekle + Enter"
                onKeyDown={e => {
                  if (e.key === 'Enter') { addTask(p, e.target.value); e.target.value = '' }
                }}
              />
              <div className="actions">
                <button onClick={() => toggleProject(p)}>{p.done ? 'Geri al' : '✓ Tamamlandı'}</button>
                <button className="danger" onClick={() => setProjects(ps => ps.filter(x => x.id !== p.id))}>Sil</button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
