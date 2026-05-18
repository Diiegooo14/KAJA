import { useState, lazy, Suspense } from 'react'

const Login = lazy(() => import('./views/Login'))
const Register = lazy(() => import('./views/Register'))
const Dashboard = lazy(() => import('./views/Dashboard'))

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const stored = sessionStorage.getItem('kaja_user')
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
        sessionStorage.removeItem('kaja_user')
        setUsuario(null)
        setVista('login')
    }

    function handleActualizarUsuario(userActualizado) {
        setUsuario(userActualizado)
        localStorage.setItem('kaja_user', JSON.stringify(userActualizado))
        sessionStorage.setItem('kaja_user', JSON.stringify(userActualizado))
    }

    if (usuario) {
        return (
            <Suspense fallback={null}>
                <Dashboard
                    usuario={usuario}
                    onLogout={handleLogout}
                    onActualizarUsuario={handleActualizarUsuario}
                />
            </Suspense>
        )
    }

    if (vista === 'registro') {
        return (
            <Suspense fallback={null}>
                <Register onVolver={() => setVista('login')} />
            </Suspense>
        )
    }

    return (
        <Suspense fallback={null}>
            <Login onLogin={handleLogin} onRegistro={() => setVista('registro')} />
        </Suspense>
    )
}
