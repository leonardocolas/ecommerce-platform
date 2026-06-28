import { useEffect, useState } from 'react'

import electrodomesticosImage from '../../../img/HeroImg/electrodomesticos.webp'
import personaComprandoImage from '../../../img/HeroImg/personacomprando.webp'
import cuidadoPersonalImage from '../../../img/HeroImg/productoscuidadopersonal.webp'
import alimentosImage from '../../../img/HeroImg/productosdealimentos.webp'
import ropaImage from '../../../img/HeroImg/ropa.webp'
import tecnologiaImage from '../../../img/HeroImg/tecnologia.webp'
import { fetchBanners, type Banner } from '../services/bannerService'

type HeroSlide = {
  id: string
  image: string
  title: string
  eyebrow: string
  quote: string
  description: string
}

const fallbackSlides: HeroSlide[] = [
  {
    id: 'electrodomesticos',
    image: electrodomesticosImage,
    title: 'Electrodomesticos que elevan cada espacio de tu hogar',
    eyebrow: 'Hogar con estilo',
    quote: 'Haz de tu casa un lugar mas practico, moderno y listo para impresionar.',
    description: 'Selecciona equipos que combinan funcionalidad, diseno y comodidad para todos los dias.',
  },
  {
    id: 'personacomprando',
    image: personaComprandoImage,
    title: 'Una experiencia de compra pensada para enamorar a primera vista',
    eyebrow: 'Compra con actitud',
    quote: 'Descubre, elige y estrena con la confianza de quien sabe que acerto.',
    description: 'Una vitrina digital clara, atractiva y preparada para convertir cada visita en una buena compra.',
  },
  {
    id: 'productoscuidadopersonal',
    image: cuidadoPersonalImage,
    title: 'Cuidado personal con presencia, frescura y sofisticacion',
    eyebrow: 'Bienestar premium',
    quote: 'Tu mejor version empieza con esos pequenos detalles que si se notan.',
    description: 'Explora esenciales para una rutina diaria mas elegante, comoda y llena de bienestar.',
  },
  {
    id: 'productosdealimentos',
    image: alimentosImage,
    title: 'Sabores que convierten lo cotidiano en algo especial',
    eyebrow: 'Alimentos seleccionados',
    quote: 'Llena tu mesa de opciones que se ven bien, saben mejor y se eligen facil.',
    description: 'Encuentra productos para abastecerte con practicidad sin renunciar a calidad y frescura.',
  },
  {
    id: 'ropa',
    image: ropaImage,
    title: 'Moda actual para destacar con naturalidad',
    eyebrow: 'Estilo que conecta',
    quote: 'Vistete para lo que viene y deja que tu look hable antes que las palabras.',
    description: 'Prendas versatiles, comodas y con personalidad para un estilo fresco y juvenil.',
  },
  {
    id: 'tecnologia',
    image: tecnologiaImage,
    title: 'Tecnologia que acompana tu ritmo y potencia tu dia',
    eyebrow: 'Innovacion cercana',
    quote: 'Conecta con dispositivos que hacen tu vida mas agil, mas smart y mas tuya.',
    description: 'Descubre equipos y accesorios pensados para productividad, entretenimiento y movimiento.',
  },
]

const AUTO_PLAY_DELAY_MS = 5500

function mapBannerToSlide(banner: Banner, index: number): HeroSlide {
  const fallback = fallbackSlides[index % fallbackSlides.length]
  return {
    id: `banner-${banner.id}`,
    image: banner.image_url || fallback.image,
    title: banner.title || fallback.title,
    eyebrow: banner.subtitle || fallback.eyebrow,
    quote: banner.description || fallback.quote,
    description: banner.subtitle || fallback.description,
  }
}

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides)

  useEffect(() => {
    fetchBanners().then((banners) => {
      if (banners.length > 0) {
        setSlides(banners.map((b, i) => mapBannerToSlide(b, i)))
      }
    })
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
    }, AUTO_PLAY_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeIndex, slides.length])

  const activeSlide = slides[activeIndex]

  return (
    <section className="relative isolate overflow-hidden rounded-[40px] bg-slate-950 shadow-[0_38px_90px_-55px_rgba(15,23,42,0.95)]">
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[1600ms] ease-out ${
                  isActive ? 'scale-100' : 'scale-105'
                }`}
              />
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(15,23,42,0.86)_6%,rgba(15,23,42,0.58)_42%,rgba(15,23,42,0.22)_72%,rgba(15,23,42,0.08)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),_transparent_26%)]" />

      <div className="relative z-10 flex min-h-[540px] items-end px-6 py-10 sm:min-h-[580px] sm:px-8 sm:py-12 lg:px-14 lg:py-14">
        <div
          key={activeSlide.id}
          className="max-w-3xl animate-[heroContentFade_700ms_ease-out]"
          style={{ animationFillMode: 'both' }}
        >
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm sm:text-xs">
            {activeSlide.eyebrow}
          </span>

          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {activeSlide.quote}
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
            {activeSlide.description}
          </p>

          <div className="mt-8 flex items-center gap-3">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex

              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-3 w-3 rounded-full border border-white/35 transition-all duration-300 ${
                    isActive
                      ? 'scale-110 bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.14)]'
                      : 'bg-white/35 hover:scale-105 hover:bg-white/70'
                  }`}
                  aria-label={`Ir al slide ${index + 1}: ${slide.title}`}
                  aria-pressed={isActive}
                />
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroContentFade {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
