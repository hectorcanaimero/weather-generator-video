# GTM Skills Workflow Example

This document shows how to use the two GTM skills together for optimal results.

## The Two-Agent Approach

### Agent 1: `/gtm-video` (Strategist)
- **Role**: Marketing strategy and planning
- **Output**: Detailed video strategy with scenes, timing, messaging
- **When**: Use this FIRST for any new video idea

### Agent 2: `/gtm-developer` (Developer)
- **Role**: Clean, production-grade implementation
- **Output**: Well-documented, performant React components
- **When**: Use this AFTER strategy is approved

---

## Example Workflow

### Scenario: Creating a "10K Customers Milestone" Video

#### Step 1: Strategy with `/gtm-video`

```bash
/gtm-video crear un video celebrando el milestone de 10,000 clientes
```

**Agent Response:**
```markdown
## 📊 Estrategia de Video

**Objetivo**: Celebrar el logro de 10,000 clientes y reforzar confianza en la marca

**Audiencia**: Clientes actuales, potenciales clientes, inversores, equipo interno

**Mensaje Clave**: "Juntos llegamos a 10,000 clientes - Gracias por confiar en nosotros"

**Estructura Propuesta**:
1. Intro impactante (0-2s) - "10,000" aparece con confetti
2. Mensaje de agradecimiento (2-5s) - "¡Lo logramos juntos!"
3. Timeline visual (5-10s) - Crecimiento desde el inicio
4. Social proof (10-13s) - Testimonios/números clave
5. CTA futuro (13-15s) - "Vamos por más"

**Duración Total**: ~15 segundos

**Elementos Visuales**:
- Animación de contador llegando a 10,000
- Confetti y celebración
- Gráfico de crecimiento temporal
- Colores de marca con acentos dorados (celebración)

**Paleta de Colores**: creemDark background, creemPeach + gold accents

**Llamada a la Acción**: "Gracias por ser parte de nuestra historia"
```

**You approve** ✅

---

#### Step 2: Implementation with `/gtm-developer`

```bash
/gtm-developer implement the 10K customers milestone celebration video we just approved
```

**Agent Response:**
```markdown
## 🔧 Plan de Implementación

**Componentes a Crear**:
1. `MilestoneCelebration.tsx` - Main celebration component
2. `CounterAnimation.tsx` - Reusable counter component
3. `ConfettiEffect.tsx` - Confetti particle system

**Estructura de Props**:
```typescript
interface MilestoneCelebrationProps {
  milestone: number;          // The number to celebrate (10000)
  startDate: string;          // When the journey started
  message: string;            // Celebration message
  testimonials?: string[];    // Optional customer quotes
}
```

**Arquitectura de Animación**:
- Frame 0-60: Counter animates from 0 to 10,000 with easing
- Frame 30-120: Confetti particles spawn and fall
- Frame 60-180: Thank you message fades in
- Frame 180-360: Timeline graphic shows growth
- Frame 360-540: Social proof testimonials
- Frame 540-600: Final CTA with fade out

**Dependencias**:
- Existing: Colors from theme.ts, FadeWrapper
- New: Custom easing function for counter

**Archivos a Modificar**:
- `src/Root.tsx` - Add MilestoneCelebration composition
- `src/components/MilestoneCelebration.tsx` - Create main component
- `src/components/CounterAnimation.tsx` - Create reusable counter
- `src/utils/easing.ts` - Add easing utilities (new file)
```

**You approve** ✅

**Developer implements with:**
- ✅ Clean, type-safe TypeScript
- ✅ Comprehensive JSDoc comments
- ✅ Performance-optimized interpolations
- ✅ Reusable sub-components
- ✅ Proper error handling
- ✅ Follows project patterns

---

## Alternative: Quick Implementation (Strategy + Code in One)

If you want both strategy AND implementation in a single session, you can use `/gtm-video` which includes implementation. However, for complex videos or when code quality is critical, the two-step approach is recommended.

### Single-Agent Approach:
```bash
/gtm-video crear video de milestone de 10K clientes
```
- Gets strategy + basic implementation
- Faster but less polished code
- Good for quick prototypes

### Two-Agent Approach (Recommended):
```bash
# Step 1
/gtm-video crear video de milestone de 10K clientes
[Review and approve strategy]

# Step 2
/gtm-developer implement the approved 10K milestone strategy
[Review implementation plan, then get production-grade code]
```
- Strategy and implementation are separate concerns
- Higher code quality
- Better documentation
- More maintainable
- Good for production use

---

## When to Use Which Approach

### Use Two-Agent Approach When:
- Building production-ready videos
- Code quality and maintainability matter
- Working on complex animations
- Need comprehensive documentation
- Building reusable components

### Use Single-Agent Approach When:
- Quick prototypes or demos
- Simple, one-off videos
- Tight deadlines
- Don't need extensive documentation

---

## Best Practices

1. **Always start with strategy** (`/gtm-video`) to align on goals
2. **Get approval** before implementation to avoid rework
3. **Use the developer agent** (`/gtm-developer`) for final implementation
4. **Review the code** - both agents ask for confirmation before proceeding
5. **Test thoroughly** in Remotion Studio (`npm run dev`)

---

## Example: Refactoring Existing Code

You can also use `/gtm-developer` to improve existing components:

```bash
/gtm-developer refactor ProductPromo.tsx with better code quality and documentation
```

The developer agent will:
1. Analyze current code
2. Identify improvements (type safety, performance, docs)
3. Present refactoring plan
4. Implement with best practices

---

## Summary

**Marketing Strategy** → `/gtm-video`
**Production Code** → `/gtm-developer`

Both agents follow approval workflows, ensuring you're always in control of what gets built.
