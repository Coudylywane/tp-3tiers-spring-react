import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const EMPTY_FORM = {
  title: '',
  description: '',
  done: false,
}

function App() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingId) ?? null,
    [editingId, tasks],
  )
  const submitLabel = editingId ? 'Mettre à jour' : 'Ajouter'
  const listState = (() => {
    if (loading) return 'loading'
    if (tasks.length === 0) return 'empty'
    return 'ready'
  })()

  const loadTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/tasks`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError(`Impossible de charger les taches: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    if (!editingTask) return
    setForm({
      title: editingTask.title ?? '',
      description: editingTask.description ?? '',
      done: Boolean(editingTask.done),
    })
  }, [editingTask])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const submitTask = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      done: form.done,
    }

    if (!payload.title) {
      setError('Le titre est obligatoire.')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(
        editingId ? `${API_URL}/tasks/${editingId}` : `${API_URL}/tasks`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setMessage(editingId ? 'Tâche modifiée.' : 'Tâche ajoutée.')
      resetForm()
      await loadTasks()
    } catch (err) {
      setError(`Erreur lors de l'enregistrement: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteTask = async (id) => {
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP ${response.status}`)
      }
      if (editingId === id) {
        resetForm()
      }
      setMessage('Tâche supprimée.')
      await loadTasks()
    } catch (err) {
      setError(`Impossible de supprimer: ${err.message}`)
    }
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      done: Boolean(task.done),
    })
    setMessage('')
    setError('')
  }

  const toggleDone = async (task) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description ?? '',
          done: !task.done,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      await loadTasks()
      setMessage(task.done ? 'Tâche marquée comme à faire.' : 'Tâche terminée.')
    } catch (err) {
      setError(`Impossible de mettre à jour: ${err.message}`)
    }
  }

  let taskListContent
  if (listState === 'loading') {
    taskListContent = <p className="empty-state">Chargement des tâches...</p>
  } else if (listState === 'empty') {
    taskListContent = (
      <p className="empty-state">
        Aucune tâche pour le moment. Commence par en ajouter une.
      </p>
    )
  } else {
    taskListContent = (
      <ul className="task-list">
        {tasks.map((task) => {
          const taskLabel = task.done ? 'Marquer comme à faire' : 'Marquer comme terminée'
          const taskStateIcon = task.done ? '✓' : '○'
          const description = task.description ? (
            <p>{task.description}</p>
          ) : (
            <p className="muted">Pas de description.</p>
          )

          return (
            <li key={task.id} className={task.done ? 'task done' : 'task'}>
              <div className="task-main">
                <button
                  type="button"
                  className="task-check"
                  onClick={() => toggleDone(task)}
                  aria-label={taskLabel}
                >
                  {taskStateIcon}
                </button>

                <div className="task-content">
                  <div className="task-topline">
                    <h3>{task.title}</h3>
                    <span className="badge">#{task.id}</span>
                  </div>
                  {description}
                </div>
              </div>

              <div className="task-actions">
                <button type="button" className="secondary" onClick={() => startEdit(task)}>
                  Modifier
                </button>
                <button type="button" className="danger" onClick={() => deleteTask(task.id)}>
                  Supprimer
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <main className="page">
      <section className="header-card">
        <div>
          <p className="eyebrow">CRUD Frontend</p>
          <h1>Gestion des tâches</h1>
          <p className="subtitle">
            Ajoute, modifie, supprime et marque tes tâches comme terminées.
          </p>
        </div>
        <div className="stats">
          <div>
            <span>{tasks.length}</span>
            <small>tâches</small>
          </div>
          <div>
            <span>{tasks.filter((task) => task.done).length}</span>
            <small>terminées</small>
          </div>
        </div>
      </section>

      <section className="grid">
        <form className="card form-card" onSubmit={submitTask}>
          <div className="card-title">
            <h2>{editingId ? 'Modifier une tâche' : 'Ajouter une tâche'}</h2>
            {editingId && (
              <button type="button" className="ghost" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>

          <label>
            <span>Titre</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Faire les courses"
              maxLength={150}
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Détails, notes, contexte..."
              maxLength={500}
              rows={4}
            />
          </label>

          <div className="checkbox-row">
            <label htmlFor="task-done">Déjà terminée</label>
            <input
              id="task-done"
              type="checkbox"
              checked={form.done}
              onChange={(e) => setForm({ ...form, done: e.target.checked })}
            />
          </div>

          <button className="primary" type="submit" disabled={saving}>
            {submitLabel}
          </button>

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </form>

        <section className="card list-card">
          <div className="card-title">
            <h2>Liste des tâches</h2>
            <button type="button" className="ghost" onClick={loadTasks}>
              Rafraîchir
            </button>
          </div>

          {taskListContent}
        </section>
      </section>
    </main>
  )
}

export default App
