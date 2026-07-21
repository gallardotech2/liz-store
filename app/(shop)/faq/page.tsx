import type { Metadata } from "next"
import { ESCUDO_PAGO_ENABLED } from "@/lib/features"

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | Liz Store",
  description:
    "Encuentra respuestas a las dudas más comunes sobre envíos, pagos, cambios y devoluciones en Liz Store.",
}

const FAQS = [
  {
    q: "¿Cómo funcionan los envíos?",
    a: "Realizamos envíos a todo el país. Puedes elegir envío a domicilio o recoger tu pedido en nuestra paquetería de forma gratuita. Los pedidos se procesan de lunes a sábado de 10:00 a 20:00.",
  },
  {
    q: "¿El envío tiene costo?",
    a: "El envío a domicilio tiene un costo según la zona, mientras que recoger en paquetería es totalmente gratis. Además, el envío es gratis en compras mayores a Bs. 599.",
  },
  ...(ESCUDO_PAGO_ENABLED
    ? [
        {
          q: "¿Qué es el Escudo Pago?",
          a: "Es nuestro sistema de protección al comprador. Tu dinero está seguro y solo se libera al vendedor cuando confirmas que recibiste tu producto en perfectas condiciones. No pagas hasta estar satisfecha.",
        },
      ]
    : []),
  {
    q: "¿Qué métodos de pago aceptan?",
    a: ESCUDO_PAGO_ENABLED
      ? "Aceptamos Pago Directo vía QR o transferencia bancaria, y próximamente Escudo Pago para mayor seguridad en tus compras."
      : "Aceptamos Pago Directo vía QR o transferencia bancaria para mayor seguridad en tus compras.",
  },
  {
    q: "¿Puedo hacer cambios o devoluciones?",
    a: "Sí. Si tu producto presenta algún inconveniente, contáctanos por WhatsApp dentro de las 48 horas posteriores a la recepción para coordinar el cambio.",
  },
  {
    q: "¿Cómo sé el estado de mi pedido?",
    a: "Al confirmar tu pedido recibirás un resumen. Puedes escribirnos por WhatsApp en cualquier momento para dar seguimiento a tu compra.",
  },
  {
    q: "¿Los productos son reales?",
    a: "Trabajamos únicamente con materiales de calidad premium seleccionados cuidadosamente para realzar tu belleza natural. Cada pieza es revisada antes de enviarse.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white rounded-[16px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(255,142,159,0.05)] transition-all duration-300 open:shadow-[0_4px_15px_rgba(255,142,159,0.12)] open:border-[rgb(251,132,150)]">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[#2D2D2D] font-semibold text-[15px] font-sans">
        {q}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-primary transition-transform duration-300 group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <p className="text-[#4A4A4A] text-[14px] leading-[1.8] mt-3 mb-0">
        {a}
      </p>
    </details>
  )
}

export default function FaqPage() {
  return (
    <section className="py-15">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Ayuda
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            Preguntas Frecuentes
          </h1>
          <p className="text-[#888888] text-base max-w-[500px] mx-auto">
            Resolvemos las dudas más comunes para que tu experiencia de compra
            sea fácil y segura.
          </p>
        </div>

        <div className="flex flex-col gap-3.75">
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        <div className="mt-10 text-center bg-gradient-to-br from-[#FDF8F6] to-[#F5E6E8] rounded-[16px] p-7.5 border border-[rgba(255,142,159,0.2)]">
          <p className="text-[#4A4A4A] text-[15px] mb-4">
            ¿No encontraste tu respuesta? Escríbenos y te ayudamos.
          </p>
          <a
            href="https://wa.me/59176426643"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#25D366] text-white text-sm font-semibold no-underline hover:bg-[#1DA851] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
