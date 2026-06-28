import { Link } from 'react-router-dom'

import logo from '../img/LogoNombre.jpeg'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 py-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <img
              src={logo}
              alt="Luz Marina"
              className="mx-auto mb-4 h-12 w-auto rounded-full md:mx-0"
            />
            <h3 className="mb-4 text-lg font-semibold">Luz Marina</h3>
            <p className="text-sm text-slate-300">
              Tu tienda virtual de confianza. Encuentra todo lo que necesitas con la mejor calidad y
              precios competitivos.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold">Enlaces Rapidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-300 hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-300 hover:text-white">
                  Carrito
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-white">
                  Mi cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold">Ayuda</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Preguntas frecuentes</li>
              <li>Envios</li>
              <li>Devoluciones</li>
              <li>Contacto</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Politica de privacidad</li>
              <li>Terminos de servicio</li>
              <li>Politica de cookies</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-4 text-center text-sm text-slate-400">
          <p>&copy; {currentYear} Luz Marina. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
