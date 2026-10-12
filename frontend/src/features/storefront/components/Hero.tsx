import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
  video?: string
  title: string
  eyebrow: string
  quote: string
  description: string
}

const fallbackSlides: HeroSlide[] = [
  {
    id: 'electrodomesticos',
    image: electrodomesticosImage,
    video: 'https://videos.pexels.com/video-files/853889/853889-hd_1920_1080.mp4',
    title: 'Electrodomésticos que elevan cada espacio de tu hogar',
    eyebrow: 'Hogar con estilo',
    quote: 'Haz de tu casa un lugar más práctico, moderno y listo para impresionar.',
    description: 'Selecciona piezas que combinan funcionalidad, diseño y comodidad para todos los días.',
  },
  {
    id: 'personacomprando',
    image: personaComprandoImage,
    video: 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080.mp4',
    title: 'Una experiencia de compra pensada para enamorar a primera vista',
    eyebrow: 'Compra con actitud',
    quote: 'Descubre, elige y estrena con la confianza de quien sabe que acertó.',
    description: 'Una vitrina digital clara, atractiva y preparada para convertir cada visita en una compra memorable.',
  },
  {
    id: 'productoscuidadopersonal',
    image: cuidadoPersonalImage,
    video: 'https://videos.pexels.com/video-files/3943744/3943744-hd_1920_1080.mp4',
    title: 'Cuidado personal con presencia, frescura y sofisticación',
    eyebrow: 'Bienestar premium',
    quote: 'Tu mejor versión empieza con esos pequeños detalles que sí se notan.',
    description: 'Explora esenciales para una rutina diaria más elegante, cómoda y llena de bienestar.',
  },
  {
    id: 'productosdealimentos',
    image: alimentosImage,
    video: 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080.mp4',
    title: 'Sabores que convierten lo cotidiano en algo especial',
    eyebrow: 'Alimentos seleccionados',
    quote: 'Llena tu mesa de opciones que se ven bien, saben mejor y se eligen fácil.',
    description: 'Encuentra productos para abastecerte con practicidad sin renunciar a calidad ni frescura.',
  },
  {
    id: 'ropa',
    image: ropaImage,
    video: 'https://videos.pexels.com/video-files/3813342/3813342-hd_1920_1080.mp4',
    title: 'Moda actual para destacar con naturalidad',
    eyebrow: 'Estilo que conecta',
    quote: 'Vístete para lo que viene y deja que tu look hable antes que las palabras.',
    description: 'Prendas versátiles, cómodas y con personalidad para un estilo fresco y confident.',
  },
  {
    id: 'tecnologia',
    image: tecnologiaImage,
    video: 'https://videos.pexels.com/video-files/4042802/4042802-hd_1920_1080.mp4',
    title: 'Tecnología que acompaña tu ritmo y potencia tu día',
    eyebrow: 'Innovación cercana',
    quote: 'Conecta con dispositivos que hacen tu vida más ágil, más smart y más tuya.',
    description: 'Descubre equipos y accesorios pensados para productividad, entretenimiento y movimiento.',
  },
]

const AUTO_PLAY_DELAY_MS = 5500

function mapBannerToSlide(banner: Banner, index: number): HeroSlide {
  const fallback = fallbackSlides[index % fallbackSlides.length]
  return {
    id: `banner-${banner.id}`,
    image: banner.image_url || fallback.image,
    video: fallback.video,
    title: banner.title || fallback.title,
    eyebrow: banner.subtitle || fallback.eyebrow,
    quote: banner.description || fallback.quote,
    description: banner.subtitle || fallback.description,
  }
}

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    fetchBanners().then((banners) => {
      if (banners.length > 0) {
        setSlides(banners.map((b, i) => mapBannerToSlide(b, i)))
        setActiveIndex(0)
      }
    })
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)
    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length < 2) return

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length)
    }, AUTO_PLAY_DELAY_MS)

    return () => window.clearInterval(intervalId)
  }, [isPaused, prefersReducedMotion, slides.length])

  const activeSlide = slides[activeIndex]
  const showVideo = !prefersReducedMotion && Boolean(activeSlide.video)

  return (
    <section
      aria-label="Colecciones destacadas"
      aria-roledescription="carrusel"
      className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#111827] shadow-[0_45px_100px_-60px_rgba(15,23,42,0.95)] sm:rounded-[40px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
    >
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}: ${slide.eyebrow}`}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isActive && showVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  className={`h-full w-full object-cover transition-transform duration-[1800ms] ease-out ${
                    isActive ? 'scale-100' : 'scale-105'
                  }`}
                  poster={slide.image}
                >
                  <source src={slide.video} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={slide.image}
                  alt=""
                  className={`h-full w-full object-cover transition-transform duration-[1800ms] ease-out ${
                    isActive ? 'scale-100' : 'scale-105'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,10,20,0.88)_6%,rgba(17,24,39,0.68)_42%,rgba(17,24,39,0.36)_72%,rgba(17,24,39,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,176,109,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(122,143,114,0.18),_transparent_28%)]" />

      <div className="relative z-10 flex min-h-[540px] items-end px-6 py-9 sm:min-h-[620px] sm:px-8 sm:py-12 lg:min-h-[660px] lg:px-14 lg:py-16">
        <div
          key={activeSlide.id}
          className="max-w-3xl animate-[heroContentFade_700ms_ease-out]"
          style={{ animationFillMode: 'both' }}
        >
          <span className="premium-badge backdrop-blur-sm">{activeSlide.eyebrow}</span>

          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            {activeSlide.quote}
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
            {activeSlide.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#colecciones" className="premium-button inline-flex items-center justify-center gap-2 px-6 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] sm:text-sm sm:tracking-[0.18em]">
              Descubre colecciones
            </a>
            <Link to="/products" className="premium-button secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-white sm:text-sm sm:tracking-[0.18em]">
              Ver catálogo
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3" aria-label="Controles del carrusel">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex

              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full border border-white/35 transition-all duration-300 ${
                    isActive
                      ? 'w-16 bg-[#d6b06d] shadow-[0_0_0_4px_rgba(214,176,109,0.24)]'
                      : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir al slide ${index + 1}: ${slide.title}`}
                  aria-pressed={isActive}
                />
              )
            })}
            {!prefersReducedMotion && (
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                className="ml-1 rounded-full border border-white/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:border-[#d6b06d] hover:text-[#f5e5be]"
                aria-label={isPaused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático'}
              >
                {isPaused ? 'Reanudar' : 'Pausar'}
              </button>
            )}
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
