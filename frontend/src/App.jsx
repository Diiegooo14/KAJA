import { useState } from 'react'
import Login from './views/Login'
import Dashboard from './views/Dashboard'

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const stored = localStorage.getItem('kaja_user')
        return stored ? JSON.parse(stored) : null
    })

    function handleLogin(user) {
        setUsuario(user)
    }

    function handleLogout() {
        localStorage.removeItem('kaja_token')
        localStorage.removeItem('kaja_user')
        setUsuario(null)
    }

    if (!usuario) {
        return <Login onLogin={handleLogin} />
    }

    return <Dashboard usuario={usuario} onLogout={handleLogout} />
}
