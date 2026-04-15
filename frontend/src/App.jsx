import { useState } from 'react'
import Login from './views/Login'

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('kaja_user')
    return stored ? JSON.parse(stored) : null
  })

  function handleLogin(user) {
    setUsuario(user)
  }

  if (!usuario) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kaja-blue">
      <div className="bg-white rounded-2xl p-10 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-kaja-blue mb-2">Bienvenido, {usuario.nombre}</h1>
        <p className="text-gray-500 mb-6">Rol: <span className="font-medium text-kaja-orange">{usuario.rol}</span></p>
        <button
          onClick={() => {
            localStorage.removeItem('kaja_token')
            localStorage.removeItem('kaja_user')
            setUsuario(null)
          }}
          className="px-6 py-2 bg-kaja-orange text-white rounded-lg hover:bg-[#b8660a] transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
