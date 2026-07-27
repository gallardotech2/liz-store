---
name: iconografia
description: Convenciones de iconografía, uso de SVG inline y la librería react-icons en Escudo Market
---

# Iconografía — Escudo Market

## Estrategia

**Prioridad: SVG inline** sobre librerías externas para reducir bundle size y tener control total del estilo.

## SVG Inline

### Formato
```tsx
<svg xmlns="http://www.w3.org/2000/svg"
     width="16" height="16"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     strokeLinecap="round"
     strokeLinejoin="round">
  <path d="..." />
</svg>
```

### Tamaños estándar
| Contexto | Tamaño |
|----------|--------|
| Iconos en botones | 16x16 |
| Iconos decorativos | 18x18 |
| Iconos en cards/dashboard | 20x20 - 24x24 |
| Iconos de rating (estrellas) | 16x16 (texto) |

### Dónde se usan
- Botones: icono + texto con `gap-2`
- Header: icons de usuario y carrito
- Rating: estrellas con unicode ★☆ en `color #F4B740`
- Admin Icons: library en `components/admin/Icons.tsx` (22 iconos SVG)

## Iconos en Botones

| Botón | Icono SVG |
|-------|-----------|
| Comprar ahora | `polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"` (rayo) |
| Agregar al carrito | `path` de bolsa de compras con asa |
| Error/alert | Círculo con exclamación |
| Ver detalle | Eye icon |
| Carrito (Header) | Shopping bag |
| Usuario (Header) | User icon |
| WhatsApp | Phone icon (o el de WhatsApp) |

## Admin Icons (`components/admin/Icons.tsx`)

22 iconos SVG exportados como componentes React:
`DashboardIcon`, `BoxIcon`, `TagsIcon`, `CartIcon`, `CreditCardIcon`, `UsersIcon`, `StarIcon`, `BroadcastIcon`, `CogIcon`, `ExternalLinkIcon`, `LogoutIcon`, `BellIcon`, `DollarIcon`, `DashboardSmallIcon`, `MenuIcon`, `EditIcon`, `PlayCircleIcon`, `PauseIcon`, `StopIcon`, `ArrowLeftIcon`, `XIcon`, `MicIcon`, `MicOffIcon`, `CameraIcon`, `CameraOffIcon`, `SettingsIcon`, `MessageSquareIcon`, `HeartIcon`, `EyeIcon`, `ShoppingBagIcon`

## react-icons

La librería `react-icons` (^5.7.0) está disponible como fallback para iconos no cubiertos por SVG inline.

### Reglas
1. **Preferir SVG inline** para iconos comunes y botones.
2. **Usar react-icons** solo si el SVG inline no está definido.
3. **NO** importar toda la librería — importar solo el icono necesario:
   ```tsx
   import { FiShoppingBag } from "react-icons/fi"
   ```
4. **Admin icons** usar `components/admin/Icons.tsx` — no react-icons en admin.
5. **Rating stars** usar unicode ★☆ con color — no SVGs ni iconos.
6. **NO** mezclar estilos de iconos en el mismo contexto.
