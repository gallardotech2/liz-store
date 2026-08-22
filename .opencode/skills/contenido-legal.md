---
name: contenido-legal
description: Convenciones para páginas legales (privacidad, términos) en Liz Store
---

# Contenido Legal — Liz Store

## Páginas Legales

| Ruta | Archivo | Contenido |
|------|---------|-----------|
| `/privacidad` | `app/(shop)/privacidad/page.tsx` | Política de privacidad (11 secciones) |
| `/terminos` | `app/(shop)/terminos/page.tsx` | Términos y condiciones (7 secciones) |

## Origen del Contenido

> **IMPORTANTE:** El contenido textual de ambas páginas fue escrito
> por el propietario del proyecto, NO generado por IA.
> Cualquier modificación al texto debe ser aprobada por el propietario.

## Estructura

### `/privacidad` — Secciones
1. Responsable del Tratamiento de Datos
2. ¿Qué datos recolectamos?
3. Finalidad del Tratamiento
4. Base Legal (Art. 21.2 CPE + AGETIC 2024)
5. Uso de Cookies
6. Tus Derechos (ARCO)
7. Seguridad de tu Información (Supabase)
8. Compartición con Terceros
9. Retención de los Datos
10. Cambios en esta Política
11. ¿Cómo contactarnos?

### `/terminos` — Secciones
1. Introducción
2. Procesamiento de Pedidos y Políticas de Pago
3. Logística, Entregas y Responsabilidad Legal
4. Devoluciones, Reembolsos y Garantías
5. Propiedad Intelectual
6. Cláusulas Adicionales de Seguridad y Administración
   - 6a. Régimen de Emprendimiento (Fase MVP)
   - 6b. Capacidad Legal y Edad Mínima
   - 6c. Sincronización de Stock y Reembolsos
   - 6d. Prevención de Fraudes
7. Aceptación de los Términos

## Patrón Visual (estilo Shein)

```tsx
// Fecha de vigencia + barra de navegación
<div className="bg-[rgba(255,142,159,0.06)] border border-[rgba(255,142,159,0.15)] rounded-xl p-4 mb-8">
  <p className="text-[#4A4A4A] text-[13px] font-semibold mb-3">
    Fecha de vigencia: 21 de agosto de 2026
  </p>
  <nav className="flex flex-wrap gap-2">
    {/* Links a secciones con #id */}
  </nav>
</div>
```

## Contacto
- Email: soportLiz@gmail.com
- WhatsApp: +591 76426643

## Reglas
1. **NO modificar** el texto sin aprobación del propietario
2. **Fecha de vigencia** siempre visible al inicio del documento
3. **Barra de navegación** con links a secciones principales
4. **Última actualización** al final del documento
5. **Estilo consistente** con el resto del sitio (colores, tipografía)
