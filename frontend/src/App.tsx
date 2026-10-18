import { useEffect, useState } from 'react'
import { apiBaseUrl, getGatewayStatus } from './api'

function App() {
  const [gatewayStatus, setGatewayStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    let active = true

    void getGatewayStatus().then((status) => {
      if (active) setGatewayStatus(status)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <main>
      <h1>HealthSys Distribuído</h1>
      <p>API Gateway: {gatewayStatus}</p>
      <p>API: {apiBaseUrl}</p>
    </main>
  )
}

export default App
