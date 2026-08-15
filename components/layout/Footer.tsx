"use client"

import Link from "next/link"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"
import { WHATSAPP_NUMBER } from "@/lib/constants"
import { SocialIcons } from "./SocialIcons"

interface FooterCategory {
  name: string
  slug: string
}

interface FooterProps {
  categories?: FooterCategory[]
  whatsappNumber?: string
}

export function Footer({ categories = [], whatsappNumber = "" }: FooterProps) {
  return (
    <>
      <section className="bg-gradient-to-br from-primary to-primary-dark py-20 text-center text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-white text-[clamp(28px,3vw,38px)] font-serif mb-4">
            Únete a nuestra comunidad
          </h2>
          <p className="text-base opacity-90 mb-7.5 max-w-[500px] mx-auto">
            Recibe las últimas tendencias en bisutería y ofertas exclusivas directamente en tu correo.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex max-w-[500px] mx-auto rounded-full overflow-hidden bg-white max-md:flex-col max-md:rounded-lg">
            <input
              type="email"
              placeholder="Tu mejor correo electrónico"
              required
              className="flex-1 border-none px-6 py-4 text-[15px] text-[#4A4A4A] outline-none font-sans"
            />
            <button
              type="submit"
              className="bg-[#2D2D2D] text-white border-none px-8 py-4 font-semibold cursor-pointer transition-colors duration-300 font-sans whitespace-nowrap hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:bg-primary-dark"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-[#2D2D2D] text-[rgba(255,255,255,0.8)] pt-15 pb-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10 mb-10">
            <div>
              <h3 className="text-white text-xl mb-5 flex items-baseline gap-1">
                <span className="font-['Great_Vibes',cursive] text-[24px] text-primary">Liz</span>
                <span className="font-['Cinzel',serif] text-[14px] text-white font-medium tracking-[2px] uppercase">Store</span>
              </h3>
              <p className="text-sm leading-[1.8]">
                Bisutería y accesorios elegantes en Bolivia. Tu estilo merece lo mejor, con la confianza de un pago completamente seguro.
              </p>
              <div className="flex gap-3 mt-5">
                <SocialIcons />
              </div>
            </div>
            <div>
              <h4 className="text-white text-[13px] mb-5 font-sans uppercase tracking-[1px]">Tienda</h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-2.5">
                  <Link href="/productos" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
                    Todos los productos
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug} className="mb-2.5">
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li className="mb-2.5">
                  <Link href="/productos?sort=price_asc" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
                    Ofertas especiales
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[13px] mb-5 font-sans uppercase tracking-[1px]">Ayuda</h4>
              <ul className="list-none p-0 m-0">
                {[
                  { href: "/faq", label: "Preguntas frecuentes" },
                  { href: "/faq", label: "Cómo comprar" },
                  { href: "/faq", label: "Envíos y devoluciones" },
                  ...(ESCUDO_PAGO_ENABLED
                    ? [{ href: "#", label: "Escudo Pago" }]
                    : []),
                  { href: "#", label: "Términos y condiciones" },
                ].map((link) => (
                  <li key={link.label} className="mb-2.5">
                    <Link
                      href={link.href}
                      className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[13px] mb-5 font-sans uppercase tracking-[1px]">Contacto</h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-2.5">
                  <a href="#" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    hola@lizstore.bo
                  </a>
                </li>
                <li className="mb-2.5">
                  <a href={`https://wa.me/${whatsappNumber || WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline mr-2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    +591 76426643
                  </a>
                </li>
                <li className="mb-2.5">
                  <a href="#" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Lun-Sáb 9:00-18:00
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.1)] py-5 text-center text-[13px] text-[rgba(255,255,255,0.5)]">
            &copy; 2026 Liz Store. Todos los derechos reservados. La Paz - Bolivia
          </div>
        </div>
      </footer>
    </>
  )
}
