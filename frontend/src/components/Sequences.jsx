import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Sequences = () => {
  const [sequences, setSequences] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/sequences')
        setSequences(res.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetch()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    try {
      await api.post('/sequences', { name })
      setName('')
      const res = await api.get('/sequences')
      setSequences(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/sequences/${id}`)
      const res = await api.get('/sequences')
      setSequences(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <h2>Sequences</h2>
      <form onSubmit={create} style={{ marginBottom: 12 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Create</button>
      </form>
      <ul>
        {sequences.map((s) => (
          <li key={s.id}>{s.name} <button onClick={() => remove(s.id)}>Delete</button></li>
        ))}
      </ul>
    </div>
  )
}

export default Sequences
