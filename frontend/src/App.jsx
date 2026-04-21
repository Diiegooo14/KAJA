import { useState } from 'react'
import Login from './views/Login'
import Register from './views/Register'
import Dashboard from './views/Dashboard'

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const stored = localStorage.getItem('kaja_user')
        return stored ? JSON.parse(stored) : null
    })
    const [vista, setVista] = useState('login')

    function handleLogin(user) {
        setUsuario(user)
        setVista('login')
    }

    function handleLogout() {
        localStorage.removeItem('kaja_token')
        localStorage.removeItem('kaja_user')
        setUsuario(null)
        setVista('login')
    }

    if (usuario) {
        return <Dashboard usuario={usuario} onLogout={handleLogout} />
    }

    if (vista === 'registro') {
        return <Register onVolver={() => setVista('login')} />
    }

    return <Login onLogin={handleLogin} onRegistro={() => setVista('registro')} />
}
