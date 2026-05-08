import { useState, useEffect } from 'react'
import { User, Lock, Building2 } from 'lucide-react'

const API = '/api'

function Campo({ label, value, onChange, type = 'text', readOnly = false, autoComplete }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        readOnly={readOnly}
        autoComplete={autoComplete}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition
          focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-transparent
          ${readOnly
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-800'
          }`}
      />
    </div>
  )
}

function Aviso({ msg }) {
  if (!msg) return null
  return (
    <p className={`text-sm mt-2 ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
      {msg.texto}
    </p>
  )
}

function BtnGuardar({ cargando, disabled, label, labelCargando }) {
  return (
    <div className="flex justify-end mt-1">
      <button
        type="submit"
        disabled={cargando || disabled}
        className="px-4 py-2 bg-kaja-orange text-white rounded-lg text-sm font-medium
                  hover:brightness-95 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? labelCargando : label}
      </button>
    </div>
  )
}

export default function Configuracion({ usuario, onActualizarUsuario }) {
  const esAdmin = usuario.rol === 'Administrador'

  // Empresa
  const [empresa, setEmpresa] = useState(null)
  const [errorCargaEmpresa, setErrorCargaEmpresa] = useState(false)
  const [formEmpresa, setFormEmpresa] = useState({
    razonSocial: '', nombreComercial: '', direccion: '', telefono: '', email: '',
  })
  const [mensajeEmpresa, setMensajeEmpresa] = useState(null)
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false)

  // Nombre
  const [nombre, setNombre] = useState(usuario.nombre)
  const [mensajeNombre, setMensajeNombre] = useState(null)
  const [cargandoNombre, setCargandoNombre] = useState(false)

  // Contraseña
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [mensajePass, setMensajePass] = useState(null)
  const [cargandoPass, setCargandoPass] = useState(false)

  function cargarEmpresa() {
    setErrorCargaEmpresa(false)
    setEmpresa(null)
    fetch(`${API}/empresa`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r.json()
      })
      .then(data => {
        setEmpresa(data)
        setFormEmpresa({
          razonSocial:     data.razonSocial     ?? '',
          nombreComercial: data.nombreComercial ?? '',
          direccion:       data.direccion       ?? '',
          telefono:        data.telefono        ?? '',
          email:           data.email           ?? '',
        })
      })
      .catch(() => setErrorCargaEmpresa(true))
  }

  useEffect(() => {
    if (esAdmin) cargarEmpresa()
  }, [esAdmin])

  function campoEmpresa(field) {
    return e => setFormEmpresa(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function guardarEmpresa(e) {
    e.preventDefault()
    setCargandoEmpresa(true)
    setMensajeEmpresa(null)
    try {
      const res = await fetch(`${API}/empresa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kaja_token')}`,
        },
        body: JSON.stringify(formEmpresa),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setMensajeEmpresa({ ok: true, texto: 'Datos de empresa actualizados correctamente' })
    } catch (err) {
      setMensajeEmpresa({ ok: false, texto: err.message })
    } finally {
      setCargandoEmpresa(false)
    }
  }

  async function guardarNombre(e) {
    e.preventDefault()
    const nombreTrimmed = nombre.trim()
    if (!nombreTrimmed) return
    setCargandoNombre(true)
    setMensajeNombre(null)
    try {
      const res = await fetch(`${API}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kaja_token')}`,
        },
        body: JSON.stringify({ nombre: nombreTrimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      onActualizarUsuario({ ...usuario, nombre: nombreTrimmed })
      setMensajeNombre({ ok: true, texto: 'Nombre actualizado correctamente' })
    } catch (err) {
      setMensajeNombre({ ok: false, texto: err.message })
    } finally {
      setCargandoNombre(false)
    }
  }

  async function guardarPassword(e) {
    e.preventDefault()
    if (passNueva !== passConfirm) {
      setMensajePass({ ok: false, texto: 'Las contraseñas nuevas no coinciden' })
      return
    }
    setCargandoPass(true)
    setMensajePass(null)
    try {
      const res = await fetch(`${API}/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kaja_token')}`,
        },
        body: JSON.stringify({ password_actual: passActual, password_nueva: passNueva }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      setPassActual('')
      setPassNueva('')
      setPassConfirm('')
      setMensajePass({ ok: true, texto: 'Contraseña actualizada correctamente' })
    } catch (err) {
      setMensajePass({ ok: false, texto: err.message })
    } finally {
      setCargandoPass(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-kaja-blueText mb-6 uppercase tracking-wide">
        Configuración
      </h2>

      {/* Datos de empresa (solo admin) */}
      {esAdmin && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-kaja-blueText mb-5 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos de la empresa
          </h3>

          {errorCargaEmpresa ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-500">No se pudieron cargar los datos de la empresa.</p>
              <button
                onClick={cargarEmpresa}
                className="text-sm text-kaja-blueText underline hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          ) : empresa === null ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : (
            <form onSubmit={guardarEmpresa} className="flex flex-col gap-4">
              <Campo label="NIF / CIF" value={empresa.nif} readOnly />
              <Campo
                label="Razón social"
                value={formEmpresa.razonSocial}
                onChange={campoEmpresa('razonSocial')}
              />
              <Campo
                label="Nombre comercial"
                value={formEmpresa.nombreComercial}
                onChange={campoEmpresa('nombreComercial')}
              />
              <Campo
                label="Dirección"
                value={formEmpresa.direccion}
                onChange={campoEmpresa('direccion')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Campo
                  label="Teléfono"
                  value={formEmpresa.telefono}
                  onChange={campoEmpresa('telefono')}
                  type="tel"
                />
                <Campo
                  label="Email"
                  value={formEmpresa.email}
                  onChange={campoEmpresa('email')}
                  type="email"
                />
              </div>
              <Aviso msg={mensajeEmpresa} />
              <BtnGuardar
                cargando={cargandoEmpresa}
                label="Guardar empresa"
                labelCargando="Guardando..."
              />
            </form>
          )}
        </section>
      )}

      {/* Mi perfil */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-kaja-blueText mb-5 flex items-center gap-2">
          <User className="w-5 h-5" />
          Mi perfil
        </h3>

        <form onSubmit={guardarNombre} className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nombre
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                        bg-white text-gray-800
                        focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={cargandoNombre || nombre.trim() === usuario.nombre}
              className="px-4 py-2 bg-kaja-orange text-white rounded-lg text-sm font-medium
                        hover:brightness-95 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargandoNombre ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          <Aviso msg={mensajeNombre} />
        </form>

        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Cambiar contraseña
          </h4>
          <form onSubmit={guardarPassword} className="flex flex-col gap-3">
            <Campo
              label="Contraseña actual"
              type="password"
              value={passActual}
              onChange={e => setPassActual(e.target.value)}
              autoComplete="current-password"
            />
            <Campo
              label="Nueva contraseña"
              type="password"
              value={passNueva}
              onChange={e => setPassNueva(e.target.value)}
              autoComplete="new-password"
            />
            <Campo
              label="Confirmar nueva contraseña"
              type="password"
              value={passConfirm}
              onChange={e => setPassConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <Aviso msg={mensajePass} />
            <BtnGuardar
              cargando={cargandoPass}
              disabled={!passActual || !passNueva || !passConfirm}
              label="Actualizar contraseña"
              labelCargando="Actualizando..."
            />
          </form>
        </div>
      </section>
    </div>
  )
}
