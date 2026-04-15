import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos(search = '') {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('kaja_token')
      const url = search
        ? `${API_URL}/productos?search=${encodeURIComponent(search)}`
        : `${API_URL}/productos`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const text = await res.text()

      let data
      try {
        data = JSON.parse(text)
      } catch {
        setError(`Error ${res.status}: el servidor devolvió una respuesta inesperada. Comprueba que Apache y la BD están activos y que la ruta "${url}" es correcta.`)
        return
      }

      if (!res.ok) {
        setError(`Error ${res.status}: ${data?.error ?? 'Error desconocido'}`)
        return
      }

      setProductos(data)
    } catch (e) {
      setError(`No se pudo conectar con el servidor. Comprueba que Apache está corriendo. (${e.message})`)
    } finally {
      setLoading(false)
    }
  }

  function handleBusqueda(e) {
    const val = e.target.value
    setBusqueda(val)
    const timeout = setTimeout(() => cargarProductos(val), 300)
    return () => clearTimeout(timeout)
  }

  function badgeStock(stock) {
    if (stock === 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Sin stock</span>
    if (stock <= 5)
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{stock} uds</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{stock} uds</span>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-kaja-blue">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Listado de productos en la base de datos</p>
        </div>
        <div className="text-sm text-gray-400">{productos.length} productos</div>
      </div>

      {/* Buscador */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={handleBusqueda}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-kaja-light focus:border-kaja-blue transition"
          />
        </div>
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
          <svg className="animate-spin w-5 h-5 text-kaja-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Cargando productos...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {productos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No se encontraron productos
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Coste</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">P. Venta</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                  >
                    <td className="px-4 py-3 text-gray-400">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-kaja-light text-kaja-blue font-medium">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{parseFloat(p.precioCoste).toFixed(2)} €</td>
                    <td className="px-4 py-3 text-right font-semibold text-kaja-blue">
                      {parseFloat(p.precioVenta).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-center">{badgeStock(p.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
