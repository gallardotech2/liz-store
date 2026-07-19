import Link from "next/link"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"

interface FooterCategory {
  name: string
  slug: string
}

interface FooterProps {
  categories?: FooterCategory[]
}

export function Footer({ categories = [] }: FooterProps) {
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
          <form className="flex max-w-[500px] mx-auto rounded-full overflow-hidden bg-white max-md:flex-col max-md:rounded-lg">
            <input
              type="email"
              placeholder="Tu mejor correo electrónico"
              required
              className="flex-1 border-none px-6 py-4 text-[15px] outline-none font-sans"
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
                <a
                  href="#"
                  className="w-10 h-10 bg-[rgba(255,255,255,0.1)] rounded-full flex items-center justify-center text-white no-underline transition-all duration-300 hover:bg-primary hover:-translate-y-0.5"
                  aria-label="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[rgba(255,255,255,0.1)] rounded-full flex items-center justify-center text-white no-underline transition-all duration-300 hover:bg-primary hover:-translate-y-0.5"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[rgba(255,255,255,0.1)] rounded-full flex items-center justify-center text-white no-underline transition-all duration-300 hover:bg-primary hover:-translate-y-0.5"
                  aria-label="TikTok"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6-14h-2v2h2v2h-2v6a4 4 0 1 0 4-4V8a2 2 0 0 1-2 2V4z"/></svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-[rgba(255,255,255,0.1)] rounded-full flex items-center justify-center text-white no-underline transition-all duration-300 hover:bg-primary hover:-translate-y-0.5"
                  aria-label="WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </a>
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
                    hola@escutomarket.com
                  </a>
                </li>
                <li className="mb-2.5">
                  <a href="https://wa.me/59176426643" target="_blank" rel="noopener noreferrer" className="text-[rgba(255,255,255,0.7)] no-underline text-sm transition-colors duration-300 hover:text-[#C9A96E]">
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
            &copy; 2026 Liz Store <span className="text-[#C9A96E]">✦</span> Todos los derechos reservados <span className="text-[#C9A96E]">✦</span> Hecho con ❤️
          </div>
        </div>
      </footer>
    </>
  )
}
