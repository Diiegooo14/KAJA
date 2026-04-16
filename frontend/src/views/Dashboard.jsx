import { useState } from 'react'
import { Search } from 'lucide-react'
import Inventario from './Inventario'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tpv', label: 'TPV' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'usuarios', label: 'Gestión Usuarios' },
  { id: 'config', label: 'Configuración' },
]

export default function Dashboard({ usuario, onLogout }) {
  const [seccionActiva, setSeccionActiva] = useState('dashboard')

  function renderContenido() {
    if (seccionActiva === 'inventario') return <Inventario />

    if (seccionActiva === 'dashboard') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8 px-6">
          <h1 className="text-4xl font-bold text-kaja-blueText mb-8 uppercase tracking-wide text-center">
            Bienvenido, {usuario.nombre}!
          </h1>
          <div className="grid grid-cols-2 gap-5 w-full max-w-2xl">
            <div className="bg-kaja-orange rounded-xl flex items-center justify-center h-48 cursor-not-allowed">
              <span className="text-2xl font-bold text-kaja-blueText tracking-wide text-center px-4">
                NUEVA<br />VENTA
              </span>
            </div>
            <div className="bg-kaja-orange rounded-xl flex items-center justify-center h-48 cursor-not-allowed">
              <span className="text-2xl font-bold text-kaja-blueText tracking-wide text-center px-4">
                ALERTA DE<br />STOCK BAJO
              </span>
            </div>
            <div className="bg-kaja-orange rounded-xl flex items-center justify-center h-48 col-span-2 cursor-not-allowed">
              <span className="text-2xl font-bold text-kaja-blueText tracking-wide text-center px-4">
                VENTAS HOY
              </span>
            </div>
          </div>
        </div>
      )
    }

    // Resto de secciones pendientes
    const labels = { tpv: 'TPV', gastos: 'Gastos', usuarios: 'Gestión Usuarios', config: 'Configuración' }
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-3xl font-bold text-kaja-blueText/30 uppercase tracking-widest">{labels[seccionActiva]}</p>
          <p className="text-sm text-gray-400 mt-2">Próximamente disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      <header className="flex items-center bg-kaja-light px-8 h-24 shrink-0 gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2 w-64 shrink-0">
          <img src="/img/kaja-transparente.png" alt="Logo KAJA" className="h-13 object-contain" />
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscador"
              disabled
              className="w-full pl-9 pr-4 py-2 border border-kaja-blueText/20 rounded-lg text-sm
                      bg-white/60 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="w-12 h-12 rounded-full bg-kaja-orange flex items-center justify-center text-gray-600 font-bold text-base">
            {usuario.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="text-right leading-tight">
            <p className="text-base font-semibold text-kaja-blueText">{usuario.nombre}</p>
            <p className="text-sm text-gray-400 capitalize">{usuario.rol}</p>
          </div>
        </div>

      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-kaja-light flex flex-col py-4">
          <nav className="flex-1 flex flex-col gap-1 px-2">
            {NAV_ITEMS.map((item) => {
              const activo = seccionActiva === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setSeccionActiva(item.id)}
                  className={`w-full text-left px-6 py-4 rounded-lg text-base transition font-medium
                    ${activo
                      ? 'bg-white text-kaja-blueText shadow-sm'
                      : 'text-kaja-blueText hover:bg-white/60'
                    }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Cerrar sesión */}
          <div className="px-2 pt-2 border-t border-kaja-blueText/10 mt-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-6 py-4 rounded-lg text-base font-medium text-kaja-blueText hover:bg-white/60 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {renderContenido()}
        </main>

      </div>
    </div>
  )
}
