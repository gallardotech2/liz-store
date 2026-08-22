import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Liz Store",
  description:
    "Conoce los términos y condiciones de compra, envío, devoluciones y uso de la tienda Liz Store en Bolivia.",
}

export default function TerminosPage() {
  return (
    <section className="py-15">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block text-primary text-[13px] font-semibold uppercase tracking-[2px] mb-3">
            Legal
          </div>
          <h1 className="text-[clamp(28px,3.5vw,42px)] mb-4 font-serif text-[#2D2D2D]">
            Términos y Condiciones
          </h1>
          <p className="text-[#6B6B6B] text-base max-w-[500px] mx-auto">
            Al realizar una compra en Liz Store, aceptas los siguientes términos
            y condiciones que rigen nuestra relación comercial.
          </p>
        </div>

        <div className="bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)] rounded-xl p-4 mb-8">
          <p className="text-[#4A4A4A] text-[13px] font-semibold mb-3">
            Fecha de vigencia: 21 de agosto de 2026
          </p>
          <nav className="flex flex-wrap gap-2">
            {[
              { href: "#introduccion", label: "Inicio" },
              { href: "#pagos", label: "Pagos" },
              { href: "#logistica", label: "Envíos" },
              { href: "#devoluciones", label: "Devoluciones" },
              { href: "#aceptacion", label: "Aceptación" },
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
          <section id="introduccion">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              1. Introducción
            </h2>
            <p>
              Al realizar una compra y enviar el comprobante de pago QR, el
              cliente confirma que ha leído, comprendido y aceptado en su
              totalidad los presentes Términos y Condiciones, los cuales rigen
              la relación comercial y logística con Liz Store.
            </p>
          </section>

          <section id="pagos">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              2. Procesamiento de Pedidos y Políticas de Pago
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Método de pago exclusivo
                </h3>
                <p>
                  Todas las transacciones comerciales en Liz Store se realizan
                  única y exclusivamente mediante transferencia por código QR. No
                  se aceptan pagos en efectivo contra entrega ni transferencias
                  bancarias tradicionales sin el uso del código proporcionado por
                  nuestros canales oficiales.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Validación y despacho
                </h3>
                <p>
                  Tu pedido será procesado, empaquetado y derivado a nuestra red
                  de paquetería de forma exclusiva tras la recepción, verificación
                  y validación interna de tu comprobante de pago. Sin este paso,
                  el producto no se reserva y seguirá disponible en nuestro
                  inventario para otros clientes.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Precios y disponibilidad
                </h3>
                <p>
                  Los precios de todos nuestros accesorios están fijados en
                  bolivianos (BOB) y se encuentran sujetos a la disponibilidad de
                  stock al momento de la compra. Liz Store se reserva el derecho
                  de modificar precios, catálogos y promociones sin previo aviso,
                  respetando incondicionalmente el valor de los pedidos que ya
                  cuenten con un pago validado.
                </p>
              </div>
            </div>
          </section>

          <section id="logistica">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              3. Logística, Entregas en Paquetería y Responsabilidad Legal
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Traspaso de titularidad y entrega efectiva
                </h3>
                <p>
                  En el momento en que depositamos tu compra en la sucursal de
                  paquetería correspondiente, te proporcionaremos un código de uso
                  único para su retiro. En este instante, el sistema marca el
                  producto como &quot;Entregado&quot;, transfiriéndote la
                  propiedad legal, el dominio del artículo y los riesgos
                  asociados. Con este paso, concluye de manera definitiva nuestra
                  responsabilidad directa sobre la custodia y el transporte del
                  mismo.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Costos de retiro
                </h3>
                <p>
                  El servicio de recepción y resguardo en los puntos de
                  paquetería conlleva un costo variable que depende
                  exclusivamente de las políticas y tarifas de cada sucursal
                  física. Este importe adicional debe ser cancelado por el
                  cliente de manera directa al personal de la paquetería al
                  momento de retirar su paquete.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Tiempos de retiro y recargos
                </h3>
                <p>
                  A partir del momento en que se te notifica la disponibilidad de
                  tu paquete mediante el código único, dispones de un plazo
                  estándar de 2 a 3 días hábiles para recogerlo. Superado este
                  tiempo, cualquier cargo adicional por concepto de almacenaje
                  prolongado o penalidades generadas por la empresa de paquetería
                  correrá única y exclusivamente por cuenta del comprador.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Política estricta de abandono
                </h3>
                <p>
                  Si el paquete no es retirado de la sucursal en un plazo máximo
                  de 5 días, se considerará en estado de abandono definitivo.
                  Ante esta situación, Liz Store se deslinda de toda
                  responsabilidad comercial o civil; no se aceptarán reclamos
                  sobre el paradero o estado de la mercancía, ni existirá derecho
                  a devolución de dinero, reposición de productos o saldo a favor
                  bajo ninguna circunstancia.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Exención por fuerza mayor
                </h3>
                <p>
                  Liz Store no asume responsabilidad por retrasos logísticos o
                  inconvenientes en los puntos de recojo derivados de factores
                  externos a nuestro control, tales como bloqueos de rutas,
                  conflictos sociales, paros, condiciones climáticas adversas o
                  problemas operativos internos de las empresas de paquetería.
                </p>
              </div>
            </div>
          </section>

          <section id="devoluciones">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              4. Políticas de Devolución, Reembolsos y Garantías
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Días y horarios de gestión
                </h3>
                <p>
                  Toda solicitud de soporte, reclamo, asesoría o reembolso será
                  analizada y gestionada estrictamente dentro de nuestros horarios
                  y días hábiles de atención al cliente (de lunes a sábado). Las
                  solicitudes recibidas fuera de este rango serán atendidas el
                  siguiente día hábil.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Criterios estrictos de evaluación
                </h3>
                <p>
                  Únicamente procesaremos solicitudes de devolución o cambio en
                  casos comprobables de defectos de fábrica o situaciones
                  excepcionales catalogadas bajo nuestro criterio como compras
                  fallidas o problemas transaccionales ajenos al cliente. Cada
                  caso será auditado exhaustivamente, para lo cual se verificará
                  la validación original del pago, los tiempos exactos de retiro
                  en paquetería y la evidencia fotográfica o en video que el
                  cliente proporcione al momento de abrir su paquete.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  Desgaste y mal uso
                </h3>
                <p>
                  Nuestra garantía de tienda no cubre el desgaste natural de la
                  bisutería ni de los accesorios. Liz Store no se responsabiliza
                  por la pérdida de color, alteración del brillo, oxidación o
                  daños estructurales ocasionados por el mal uso, caídas,
                  exposición a líquidos, productos químicos (perfumes, cremas,
                  cloro, jabones), sudoración excesiva o falta de cuidado básico
                  y almacenamiento adecuado por parte del cliente.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              5. Propiedad Intelectual y Uso de Marca
            </h2>
            <p>
              Todo el material visual, fotográfico, diseños, logotipos,
              identidades gráficas y descripciones publicadas en las redes
              sociales, catálogos, página web o cualquier canal oficial de Liz
              Store son propiedad intelectual exclusiva de la marca. Queda
              estrictamente prohibida su reproducción, copia, alteración o
              distribución con fines comerciales por parte de terceros sin nuestra
              autorización expresa y por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              6. Cláusulas Adicionales de Seguridad y Administración
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  6a. Régimen de Emprendimiento (Fase MVP) y Comprobantes
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>Etapa de Validación:</strong> Liz Store se encuentra
                    actualmente en una fase de lanzamiento y validación de mercado
                    (Producto Mínimo Viable). Al ser un emprendimiento emergente
                    en etapa inicial, operamos bajo un régimen no societario.
                  </p>
                  <p>
                    <strong>Emisión de Recibos:</strong> Por este motivo, en esta
                    fase del proyecto no estamos habilitados para la emisión de
                    facturas con crédito fiscal.
                  </p>
                  <p>
                    <strong>Respaldo de tu compra:</strong> Para garantizar la
                    transparencia de tu pedido, toda compra generará una nota de
                    venta o recibo digital interno. Tu comprobante de pago por
                    código QR servirá como respaldo total de tu transacción y
                    garantía con nosotros, pero no será válido para descargo de
                    impuestos ante el SIN.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  6b. Capacidad Legal y Edad Mínima
                </h3>
                <p>
                  El uso de nuestra tienda y la realización de compras están
                  dirigidos a personas mayores de 18 años con capacidad legal
                  para contratar. Las transacciones realizadas por menores de edad
                  serán responsabilidad exclusiva de sus padres o tutores legales.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  6c. Sincronización de Stock y Reembolsos Automáticos
                </h3>
                <p>
                  Debido a la naturaleza de los pagos mediante código QR, puede
                  ocurrir que múltiples clientes adquieran el mismo producto
                  simultáneamente. Si un artículo se agota pero el pago fue
                  procesado por error del sistema, Liz Store cancelará el pedido
                  y realizará un reembolso inmediato del 100% del monto pagado,
                  sin penalizaciones para el cliente.
                </p>
              </div>
              <div>
                <h3 className="text-[#2D2D2D] font-semibold mb-1.5">
                  6d. Prevención de Fraudes y Conducta del Usuario
                </h3>
                <p>
                  Nos reservamos el derecho de cancelar de manera unilateral
                  cualquier pedido, así como de bloquear permanentemente al
                  usuario, si detectamos el envío de comprobantes de pago
                  falsificados, editados, reutilizados o cualquier actividad
                  sospechosa. Liz Store podrá tomar las acciones legales
                  pertinentes para proteger la integridad de la plataforma.
                </p>
              </div>
            </div>
          </section>

          <section id="aceptacion">
            <h2 className="text-[#2D2D2D] font-serif text-xl mb-3">
              7. Aceptación de los Términos
            </h2>
            <p>
              Al realizar una compra y enviar el comprobante de pago QR, el
              cliente confirma que ha leído, comprendido y aceptado en su
              totalidad los presentes Términos y Condiciones, los cuales rigen
              la relación comercial y logística con Liz Store.
            </p>
          </section>

          <div className="text-center text-sm text-[#6B6B6B] pt-6 border-t border-[rgba(0,0,0,0.08)]">
            Última actualización: Agosto 2026
          </div>
        </div>
      </div>
    </section>
  )
}
