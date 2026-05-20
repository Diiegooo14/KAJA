import { useState, useEffect, useRef } from 'react'
import { User, Lock, Building2, Camera, Loader2, Trash2, AlertTriangle, X, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const DEFAULT_AVATAR = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778341124/basica_usuario_qvq2fm.png'
const DEFAULT_EMPRESA_LOGO = 'https://res.cloudinary.com/di1ujwvir/image/upload/v1778342336/empresa-basico_ykh1p1.png'

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

function validarArchivo(file) {
  if (!TIPOS_IMAGEN.includes(file.type))
    return 'Solo se permiten imágenes JPG, PNG, GIF o WEBP'
  if (file.size > MAX_BYTES)
    return 'La imagen no puede superar 5MB'
  return null
}

function Campo({ label, value, onChange, type = 'text', readOnly = false, autoComplete, maxLength, inputMode, pattern }) {
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
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className={`w-full px-3 py-2 border rounded-lg text-sm transition
          focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-transparent
          ${readOnly
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-800'
          }`}
      />
      {maxLength && (value ?? '').length === maxLength && (
        <p className="text-xs text-amber-500 mt-1">Límite de {maxLength} caracteres alcanzado</p>
      )}
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

function SubidaImagen({ urlActual, placeholder, endpoint, publicLabel, onSubida }) {
  const inputRef = useRef(null)
  const defaultPreview = publicLabel === 'Foto de perfil' ? DEFAULT_AVATAR : DEFAULT_EMPRESA_LOGO
  const [preview, setPreview] = useState(urlActual || defaultPreview)
  const [hayImagen, setHayImagen] = useState(!!urlActual)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const ocupado = subiendo || eliminando

  function seleccionar(e) {
    const file = e.target.files[0]
    if (!file) return
    const error = validarArchivo(file)
    if (error) {
      setMensaje({ ok: false, texto: error })
      e.target.value = ''
      return
    }
    setMensaje(null)
    setPreview(URL.createObjectURL(file))
    subir(file)
  }

  async function subir(file) {
    setSubiendo(true)
    setMensaje(null)
    const fd = new FormData()
    fd.append('imagen', file)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      setHayImagen(true)
      setMensaje({ ok: true, texto: `${publicLabel} actualizada correctamente` })
      onSubida(data.url)
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
      setPreview(urlActual || defaultPreview)
    } finally {
      setSubiendo(false)
    }
  }

  async function eliminar() {
    setEliminando(true)
    setMensaje(null)
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')
      setPreview(defaultPreview)
      setHayImagen(false)
      setMensaje({ ok: true, texto: `${publicLabel} eliminada correctamente` })
      onSubida(null)
    } catch (err) {
      setMensaje({ ok: false, texto: err.message })
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-kaja-light flex items-center justify-center border-2 border-gray-100">
          {preview
            ? <img src={preview} alt={publicLabel} width="80" height="80" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold text-kaja-blueText">{placeholder}</span>
          }
        </div>
        {ocupado && (
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={seleccionar}
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            disabled={ocupado}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                       text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" />
            Cambiar imagen
          </button>
          {hayImagen && (
            <button
              type="button"
              onClick={eliminar}
              disabled={ocupado}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm
                         text-red-500 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF o WEBP · Máx. 5MB</p>
        {mensaje && (
          <p className={`text-xs mt-1 ${mensaje.ok ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Configuracion({ usuario, onActualizarUsuario, onActualizarEmpresa, onLogout }) {
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

  // Eliminar empresa
  const [modalBorrar, setModalBorrar] = useState(false)
  const [borrandoEmpresa, setBorrandoEmpresa] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  // Nóminas
  const [nominas, setNominas] = useState([])
  const [loadingNominas, setLoadingNominas] = useState(true)
  const [aniosAbiertos, setAniosAbiertos] = useState([])

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  async function descargarNomina(id, nombreMes, anio) {
    const res = await fetch(`${API_URL}/nominas?action=descargar&id=${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
    })
    if (!res.ok) return
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `nomina_${nombreMes}_${anio}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  function cargarEmpresa() {
    setErrorCargaEmpresa(false)
    setEmpresa(null)
    fetch(`${API_URL}/empresa`, {
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

  useEffect(() => {
    setLoadingNominas(true)
    fetch(`${API_URL}/nominas`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
    })
      .then(r => r.ok ? r.json() : { nominas: [] })
      .then(data => {
        const lista = data.nominas ?? []
        setNominas(lista)
        const aniosUnicos = [...new Set(lista.map(n => Number(n.anio)))].sort((a, b) => b - a)
        setAniosAbiertos(aniosUnicos.slice(0, 1))
      })
      .catch(() => {})
      .finally(() => setLoadingNominas(false))
  }, [])

  function campoEmpresa(field) {
    return e => setFormEmpresa(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleTelefono(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 9)
    setFormEmpresa(prev => ({ ...prev, telefono: value }))
  }

  async function guardarEmpresa(e) {
    e.preventDefault()
    setCargandoEmpresa(true)
    setMensajeEmpresa(null)
    try {
      const res = await fetch(`${API_URL}/empresa`, {
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
      onActualizarEmpresa?.(formEmpresa)
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
      const res = await fetch(`${API_URL}/perfil`, {
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
      const res = await fetch(`${API_URL}/perfil`, {
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

  async function eliminarEmpresa() {
    setBorrandoEmpresa(true)
    setErrorBorrar('')
    try {
      const res = await fetch(`${API_URL}/empresa?todo=1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('kaja_token')}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar la empresa')
      onLogout()
    } catch (err) {
      setErrorBorrar(err.message)
      setBorrandoEmpresa(false)
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
            <>
              <SubidaImagen
                urlActual={empresa.logo_empresa}
                placeholder={empresa.nombreComercial?.charAt(0)?.toUpperCase() ?? 'E'}
                endpoint={`${API_URL}/empresa`}
                publicLabel="Logo"
                onSubida={url => {
                  setEmpresa(prev => ({ ...prev, logo_empresa: url }))
                  onActualizarEmpresa?.({ logo_empresa: url })
                }}
              />
              <form onSubmit={guardarEmpresa} className="flex flex-col gap-4">
                <Campo label="NIF / CIF" value={empresa.nif} readOnly />
                <Campo
                  label="Razón social"
                  value={formEmpresa.razonSocial}
                  onChange={campoEmpresa('razonSocial')}
                  maxLength={30}
                />
                <Campo
                  label="Nombre comercial"
                  value={formEmpresa.nombreComercial}
                  onChange={campoEmpresa('nombreComercial')}
                  maxLength={30}
                />
                <Campo
                  label="Dirección"
                  value={formEmpresa.direccion}
                  onChange={campoEmpresa('direccion')}
                  maxLength={40}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Campo
                    label="Teléfono"
                    value={formEmpresa.telefono}
                    onChange={handleTelefono}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                  />
                  <Campo
                    label="Email"
                    value={formEmpresa.email}
                    onChange={campoEmpresa('email')}
                    type="email"
                    maxLength={30}
                  />
                </div>
                <Aviso msg={mensajeEmpresa} />
                <BtnGuardar
                  cargando={cargandoEmpresa}
                  label="Guardar empresa"
                  labelCargando="Guardando..."
                />
              </form>
            </>
          )}
        </section>
      )}

      {/* Mi perfil */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-base font-semibold text-kaja-blueText mb-5 flex items-center gap-2">
          <User className="w-5 h-5" />
          Mi perfil
        </h3>

        <SubidaImagen
          urlActual={usuario.imagen_perfil ?? null}
          placeholder={usuario.nombre.charAt(0).toUpperCase()}
          endpoint={`${API_URL}/perfil`}
          publicLabel="Foto de perfil"
          onSubida={url => onActualizarUsuario({ ...usuario, imagen_perfil: url })}
        />

        <form onSubmit={guardarNombre} className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nombre
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              maxLength={30}
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
          {nombre.length === 30 && (
            <p className="text-xs text-amber-500 mt-1">Límite de 30 caracteres alcanzado</p>
          )}
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
              maxLength={15}
            />
            <Campo
              label="Nueva contraseña"
              type="password"
              value={passNueva}
              onChange={e => setPassNueva(e.target.value)}
              autoComplete="new-password"
              maxLength={15}
            />
            <Campo
              label="Confirmar nueva contraseña"
              type="password"
              value={passConfirm}
              onChange={e => setPassConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={15}
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

      {/* Mis nóminas */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h3 className="text-base font-semibold text-kaja-blueText mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Mis nóminas
        </h3>

        {loadingNominas ? (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-kaja-orange" />
            <span className="text-sm">Cargando nóminas…</span>
          </div>
        ) : nominas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Aún no tienes nóminas disponibles</p>
            <p className="text-xs mt-1">Tu administrador las irá subiendo cada mes</p>
          </div>
        ) : (() => {
          const aniosUnicos = [...new Set(nominas.map(n => Number(n.anio)))].sort((a, b) => b - a)
          return (
            <div className="flex flex-col gap-3">
              {aniosUnicos.map(anio => {
                const nominasAnio = nominas.filter(n => Number(n.anio) === anio)
                const abierto = aniosAbiertos.includes(anio)
                return (
                  <div key={anio} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAniosAbiertos(prev =>
                        prev.includes(anio) ? prev.filter(a => a !== anio) : [...prev, anio]
                      )}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="text-sm font-bold text-kaja-blueText">{anio}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{nominasAnio.length} nómina{nominasAnio.length !== 1 ? 's' : ''}</span>
                        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {abierto && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3">
                        {MESES.map((mes, i) => {
                          const nomina = nominasAnio.find(n => Number(n.mes) === i + 1)
                          return nomina ? (
                            <button
                              key={i}
                              type="button"
                              onClick={() => descargarNomina(nomina.id, mes.toLowerCase(), anio)}
                              title={`Descargar nómina de ${mes} ${anio}`}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-kaja-orange/10
                                         border border-kaja-orange/20 hover:bg-kaja-orange/20 transition group"
                            >
                              <Download className="w-4 h-4 text-kaja-orange group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-semibold text-kaja-orange text-center leading-tight">{mes}</span>
                            </button>
                          ) : (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100 opacity-40"
                            >
                              <FileText className="w-4 h-4 text-gray-300" />
                              <span className="text-xs text-gray-400 text-center leading-tight">{mes}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </section>

      {/* Zona de peligro (solo admin) */}
      {esAdmin && (
        <section className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mt-6">
          <h3 className="text-base font-semibold text-red-600 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona de peligro
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Las acciones de esta sección son permanentes e irreversibles.
          </p>
          <div className="flex items-center justify-between gap-4 p-4 border border-red-100 rounded-lg bg-red-50/50">
            <div>
              <p className="text-sm font-semibold text-gray-800">Eliminar empresa</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Borra la empresa y todos sus datos: usuarios, productos, ventas y gastos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setModalBorrar(true); setErrorBorrar('') }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium
                         rounded-lg hover:bg-red-700 active:scale-95 transition"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </section>
      )}

      {/* Modal confirmación borrar empresa */}
      {modalBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <button
                onClick={() => setModalBorrar(false)}
                disabled={borrandoEmpresa}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar la empresa?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta acción es <span className="font-semibold text-gray-700">permanente e irreversible</span>.
              Se eliminarán todos los datos asociados:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-6 pl-4 list-disc">
              <li>Todos los usuarios de la empresa</li>
              <li>Productos y categorías</li>
              <li>Historial de ventas</li>
              <li>Registro de gastos</li>
            </ul>

            {errorBorrar && (
              <p className="text-sm text-red-600 mb-4 px-3 py-2 bg-red-50 rounded-lg">{errorBorrar}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalBorrar(false)}
                disabled={borrandoEmpresa}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600
                           hover:bg-gray-50 transition disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarEmpresa}
                disabled={borrandoEmpresa}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold
                           hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {borrandoEmpresa
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                  : 'Sí, eliminar todo'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
