import Link from "next/link"

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[80px] font-serif font-bold text-primary mb-4">404</div>
        <h1 className="text-2xl font-serif text-[#2D2D2D] mb-3">
          Página no encontrada
        </h1>
        <p className="text-[#6B6B6B] text-sm mb-8 leading-relaxed">
          Lo sentimos, la página que buscas no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-semibold no-underline hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_15px_rgba(255,142,159,0.3)]"
          >
            Volver al inicio
          </Link>
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-primary text-sm font-semibold no-underline border border-primary hover:bg-primary/5 transition-all duration-300"
          >
            Ver productos
          </Link>
        </div>
      </div>
    </section>
  )
}
