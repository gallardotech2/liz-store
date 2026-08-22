import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad | Liz Store",
  description:
    "Conoce cómo Liz Store protege y maneja tu información personal. Transparencia total en el tratamiento de tus datos.",
}

export default function PrivacidadPage() {
  return (
    <section className="py-15">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Legal
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            Política de Privacidad
          </h1>
          <p className="text-[#6B6B6B] text-base max-w-[500px] mx-auto">
            En Liz Store valoramos tu confianza. Al ser un emprendimiento digital
            en Bolivia, nos comprometemos a manejar tu información personal con
            total transparencia y seguridad.
          </p>
        </div>

        <div className="bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)] rounded-xl p-4 mb-8">
          <p className="text-[#4A4A4A] text-[13px] font-semibold mb-3">
            Fecha de vigencia: 21 de agosto de 2026
          </p>
          <nav className="flex flex-wrap gap-2">
            {[
              { href: "#datos", label: "Datos" },
              { href: "#finalidad", label: "Finalidad" },
              { href: "#cookies", label: "Cookies" },
              { href: "#derechos", label: "Derechos ARCO" },
              { href: "#contacto", label: "Contacto" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full bg-white text-[#4A4A4A] text-[12px] font-medium border border-[rgba(0,0,0,0.08)] no-underline hover:border-primary hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="space-y-8 text-[#4A4A4A] text-[15px] leading-[1.8]">
          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              1. Responsable del Tratamiento de Datos
            </h2>
            <p>
              Liz Store, operando en el Estado Plurinacional de Bolivia, es el
              único responsable del manejo y resguardo de la información
              personal que compartes en nuestra plataforma.
            </p>
          </section>

          <section id="datos">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              2. ¿Qué datos recolectamos?
            </h2>
            <p className="mb-3">
              Para brindarte un servicio eficiente, recopilamos la siguiente
              información estrictamente necesaria:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Nombre completo.</li>
              <li>Correo electrónico.</li>
              <li>Número de teléfono (WhatsApp).</li>
              <li>
                Dirección o datos de referencia (para la gestión de paquetería).
              </li>
              <li>
                Datos de facturación y comprobantes de pago (capturas de
                transferencias QR).
              </li>
            </ul>
          </section>

          <section id="finalidad">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              3. Finalidad del Tratamiento
            </h2>
            <p className="mb-3">
              Tus datos son utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Procesar tus pedidos y validar los pagos por QR.</li>
              <li>
                Gestionar la logística y enviarte el código único para recoger
                tu producto en paquetería.
              </li>
              <li>Mejorar la experiencia de usuario en nuestra web.</li>
              <li>
                Enviarte ofertas y novedades (solo si nos das tu permiso para
                marketing).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              4. Base Legal
            </h2>
            <p>
              El tratamiento de tus datos personales se basa enteramente en tu
              consentimiento libre e informado, amparados bajo el derecho a la
              privacidad establecido en el Artículo 21.2 de la Constitución
              Política del Estado (CPE) de Bolivia y tomando como referencia los
              lineamientos del anteproyecto AGETIC 2024.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              5. Uso de Cookies
            </h2>
            <p>
              Utilizamos cookies esenciales en nuestro sitio web. Son pequeños
              archivos que nos ayudan a recordar quién eres para mantener tu
              sesión de usuario iniciada (autenticación) y guardar temporalmente
              los accesorios que agregas a tu carrito de compras para que no los
              pierdas.
            </p>
          </section>

          <section id="derechos">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              6. Tus Derechos (Derechos ARCO)
            </h2>
            <p className="mb-3">
              Tienes control total sobre tu información. En cualquier momento
              puedes ejercer tus derechos de:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong>Acceso:</strong> Saber qué datos tenemos sobre ti.
              </li>
              <li>
                <strong>Rectificación:</strong> Corregir datos inexactos o
                desactualizados.
              </li>
              <li>
                <strong>Cancelación:</strong> Pedir que eliminemos tus datos de
                nuestros registros.
              </li>
              <li>
                <strong>Oposición:</strong> Pedir que dejemos de usar tus datos
                para fines específicos, como el marketing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              7. Seguridad de tu Información
            </h2>
            <p>
              Nos tomamos la seguridad muy en serio. Tu información es
              almacenada utilizando la infraestructura de Supabase, aplicando
              protocolos modernos de cifrado y seguridad para evitar cualquier
              acceso no autorizado, alteración o pérdida de tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              8. Compartición con Terceros
            </h2>
            <p>
              Liz Store no vende ni alquila tu información. Solo compartimos los
              datos estrictamente necesarios (como tu nombre y número) con los
              servicios de paquetería y, cuando corresponda, con las entidades
              tecnológicas que procesan la validación de pagos, única y
              exclusivamente para completar la entrega de tu pedido.
            </p>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              9. Retención de los Datos
            </h2>
            <p>
              Conservaremos tu información personal únicamente mientras mantengas
              una cuenta activa con nosotros o durante el tiempo que sea necesario
              para cumplir con los propósitos descritos en esta política y
              resolver cualquier inconveniente logístico.
            </p>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              10. Cambios en esta Política
            </h2>
            <p>
              Al ser un proyecto en constante evolución, podríamos actualizar
              estas políticas para mejorar. Si realizamos cambios significativos,
              te lo notificaremos a través de un aviso destacado en nuestro sitio
              web o enviándote un correo electrónico.
            </p>
          </section>

          <section id="contacto">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              11. ¿Cómo contactarnos?
            </h2>
            <p className="mb-3">
              Si tienes dudas sobre tu privacidad, quieres ejercer tus derechos
              ARCO o necesitas ayuda con tu cuenta, estamos siempre disponibles.
              Puedes escribirnos a:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong>Correo electrónico:</strong>{" "}
                <a
                  href="mailto:soportLiz@gmail.com"
                  className="text-primary hover:text-primary-dark underline"
                >
                  soportLiz@gmail.com
                </a>
              </li>
              <li>
                <strong>WhatsApp:</strong>{" "}
                <a
                  href="https://wa.me/59176426643"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark underline"
                >
                  +591 76426643
                </a>
              </li>
            </ul>
          </section>

          <div className="text-center text-sm text-[#6B6B6B] pt-6 border-t border-[rgba(0,0,0,0.08)]">
            Última actualización: Agosto 2026
          </div>
        </div>
      </div>
    </section>
  )
}
