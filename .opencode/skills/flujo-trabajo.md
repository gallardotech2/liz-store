---
name: flujo-trabajo
description: Flujo de trabajo del proyecto Escudo Market: branching, commits, review y deploy
---

# Flujo de Trabajo — Escudo Market

## Ciclo de Desarrollo

### 1. Análisis
- Consultar documentación existente (`README.md`, `AGENTS.md`, Skills)
- Revisar `docs_migracion/` para contexto histórico
- Consultar `AUDITORIA_FINAL.md` para issues conocidos
- Entender el alcance: NO modificar lo que no está en el alcance

### 2. Planificación
- Definir cambios específicos
- Identificar archivos a modificar
- Verificar Skills relevantes para la tarea
- Confirmar que NO se violan reglas de identidad visual

### 3. Implementación
- Seguir convenciones del proyecto (ver skills `convenciones-desarrollo`, `react-practicas`)
- Usar Tailwind utility classes (no CSS modules)
- Server Components por defecto
- Server Actions para mutaciones

### 4. Verificación
- TypeScript: `npx tsc --noEmit` — sin errores
- Lint: `npm run lint` — sin errores
- Build: `npm run build` — exitoso
- Responsive: probar en mobile y desktop
- NO romper funcionalidad existente

### 5. Documentación
- Documentar cambios significativos en `docs_migracion/`
- Actualizar Skills si se introducen nuevos patrones
- Actualizar `README.md` si cambia la estructura

## Reglas Fundamentales

### No modificar sin autorización
- Identidad visual (colores, tipografía)
- Lógica de negocio (carrito, checkout, pagos)
- Flujo de navegación
- Componentes fuera del alcance de la tarea

### Preservar consistencia
- Todos los botones: `rounded-full` con `transition-all duration-300`
- Precios: `font-serif` + `font-bold` + `text-[rgb(154,90,99)]`
- Categorías label: `text-[12px] uppercase text-[rgb(154,90,99)]`
- Fondo de página: `bg-[#FDF8F6]`
- Cards: `bg-white rounded-[16px]` con sombra suave

### Precauciones
- No exponer secrets (service role key, OIDC token)
- No introducir XSS (sanitizar `dangerouslySetInnerHTML`)
- No deshabilitar zoom en viewport (`userScalable: false` es issue conocido)
- No romper accesibilidad (contraste, focus, touch targets)

## Git

```bash
# Commits descriptivos en español
git add <archivos>
git commit -m "feat: agrega carrusel de productos destacados"
git commit -m "fix: corrige 404 en detalle de producto"
git commit -m "docs: actualiza README con nueva paleta"
```

### Pre-commit checklist
- [ ] TypeScript compila sin errores
- [ ] No hay secrets en el diff
- [ ] Solo los archivos necesarios están staged
- [ ] Los cambios están dentro del alcance definido
- [ ] La identidad visual se respeta
- [ ] El responsive funciona correctamente

## Deploy

- Automático en Vercel al hacer push a `main`
- Preview deployments para PRs
- Verificar ISR funciona correctamente post-deploy
- No hacer deploy si hay issues de `AUDITORIA_FINAL.md` sin resolver
