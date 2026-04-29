import React, { useEffect, useState } from 'react'

const WebsocketViewer = () => {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    ws.onmessage = (evt) => {
      setMessages((m) => [evt.data, ...m])
    }
    ws.onopen = () => console.log('WS open')
    ws.onclose = () => console.log('WS closed')
    return () => ws.close()
  }, [])

  return (
    <div>
      <h2>WebSocket Viewer</h2>
      <ul>
        {messages.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
    </div>
  )
}

export default WebsocketViewer
