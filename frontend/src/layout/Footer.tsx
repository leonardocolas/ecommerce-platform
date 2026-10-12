import { Link } from 'react-router-dom'

import logo from '../img/LogoNombre.jpeg'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#111827] py-10 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <img
              src={logo}
              alt="Luz Marina"
              className="mx-auto mb-4 h-12 w-auto rounded-full ring-2 ring-[#d6b06d]/60 md:mx-0"
            />
            <h3 className="mb-4 text-3xl font-semibold text-[#f8e7c2] display-font">Luz Marina</h3>
            <p className="text-sm leading-7 text-slate-300">
              Tu tienda virtual de confianza. Encuentra piezas con estilo, detalle y calidad para una vida más refinada.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold text-[#f8e7c2]">Enlaces rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link to="/" className="transition hover:text-white">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/products" className="transition hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/cart" className="transition hover:text-white">
                  Carrito
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-white">
                  Mi cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold text-[#f8e7c2]">Ayuda</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Preguntas frecuentes</li>
              <li>Envíos</li>
              <li>Devoluciones</li>
              <li>Contacto</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-md font-semibold text-[#f8e7c2]">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Política de privacidad</li>
              <li>Términos de servicio</li>
              <li>Política de cookies</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-center text-sm text-slate-400">
          <p>&copy; {currentYear} Luz Marina. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
