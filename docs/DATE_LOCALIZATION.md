# Localización de Fechas

## Descripción General

El sistema ahora retorna las fechas de generación de videos formateadas en el idioma seleccionado por el usuario (EN, ES, PT).

## Idiomas Soportados

| Código | Idioma | Locale | Ejemplo |
|--------|--------|--------|---------|
| `en` | English | `en-US` | Monday, December 29, 2025 |
| `es` | Español | `es-ES` | lunes, 29 de diciembre de 2025 |
| `pt` | Português | `pt-BR` | segunda-feira, 29 de dezembro de 2025 |

## Formato de Fecha

El formato incluye:
- **Día de la semana** (completo)
- **Mes** (completo)
- **Día del mes** (numérico)
- **Año** (numérico de 4 dígitos)

## Uso en la API

### Request

```json
POST /api/generate-image
{
  "city": "Curitiba",
  "weatherData": {
    "temperature": 18,
    "condition": "rain",
    "description": "light rain"
  },
  "language": "pt"  ← Idioma seleccionado
}
```

### Response

```json
{
  "filename": "curitiba-rain.png",
  "imageUrl": "/weather-bg/curitiba-rain.png",
  "reused": true,
  "weatherData": {
    "city": "Curitiba",
    "temperature": 18,
    "condition": "rain",
    "description": "light rain",
    "date": "segunda-feira, 29 de dezembro de 2025"  ← Fecha en portugués
  }
}
```

## Ejemplos por Idioma

### English (en)

```json
{
  "date": "Monday, December 29, 2025"
}
```

### Español (es)

```json
{
  "date": "lunes, 29 de diciembre de 2025"
}
```

### Português (pt)

```json
{
  "date": "segunda-feira, 29 de dezembro de 2025"
}
```

## Implementación

### Backend

Función en `server/routes/generate-image.ts`:

```typescript
function formatDateInLanguage(date: Date, language: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const locale = localeMap[language] || "en-US";

  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
```

### Uso

```typescript
// Cuando se genera o reutiliza una imagen
const formattedDate = formatDateInLanguage(new Date(), language);

// Se incluye en la respuesta
return res.json({
  filename,
  imageUrl: `/weather-bg/${filename}`,
  weatherData: {
    ...weatherData,
    date: formattedDate,  // Fecha formateada en el idioma del usuario
  },
});
```

## Frontend - Mostrar la Fecha

```javascript
// Cuando recibes la respuesta de la API
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    city: 'Curitiba',
    weatherData: weatherData,
    language: currentLanguage, // 'en', 'es', o 'pt'
  }),
});

const result = await response.json();

// La fecha ya viene formateada en el idioma correcto
console.log(result.weatherData.date);
// PT: "segunda-feira, 29 de dezembro de 2025"
// ES: "lunes, 29 de diciembre de 2025"
// EN: "Monday, December 29, 2025"

// Mostrar en la UI
document.getElementById('video-date').textContent = result.weatherData.date;
```

## Testing

### Script de Prueba

```bash
npm run test:date-localization
```

**Salida esperada:**

```
🧪 Testing Date Localization

📅 Test Date: December 29, 2025

======================================================================

EN (en-US):
   Monday, December 29, 2025

ES (es-ES):
   lunes, 29 de diciembre de 2025

PT (pt-BR):
   segunda-feira, 29 de dezembro de 2025

======================================================================

✅ Date localization working correctly!
```

### Prueba Manual

```bash
# Generar imagen en inglés
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Paris",
    "weatherData": {
      "temperature": 5,
      "condition": "sunny",
      "description": "clear sky"
    },
    "language": "en"
  }' | jq '.weatherData.date'

# Output: "Monday, December 29, 2025"

# Generar imagen en español
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Madrid",
    "weatherData": {
      "temperature": 12,
      "condition": "cloudy",
      "description": "scattered clouds"
    },
    "language": "es"
  }' | jq '.weatherData.date'

# Output: "lunes, 29 de diciembre de 2025"

# Generar imagen en portugués
curl -X POST http://localhost:3001/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "city": "São Paulo",
    "weatherData": {
      "temperature": 25,
      "condition": "rain",
      "description": "light rain"
    },
    "language": "pt"
  }' | jq '.weatherData.date'

# Output: "segunda-feira, 29 de dezembro de 2025"
```

## Manifest.json

El archivo `public/weather-bg/manifest.json` ahora guarda la fecha en el idioma de la última generación:

```json
{
  "curitiba": {
    "city": "Curitiba",
    "temperature": 18,
    "condition": "rain",
    "description": "light rain",
    "date": "segunda-feira, 29 de dezembro de 2025",  ← Fecha localizada
    "filename": "curitiba-rain.png"
  }
}
```

**Nota:** La fecha en el manifest puede cambiar de idioma si la misma imagen se solicita con diferentes idiomas. Esto es esperado ya que el manifest se actualiza cada vez.

## Comportamiento con Reutilización

Cuando se reutiliza una imagen existente:
1. La fecha se **actualiza** con la fecha actual
2. La fecha se formatea en el **idioma de la solicitud actual**
3. El manifest se actualiza con la nueva fecha

**Ejemplo:**

```javascript
// Primera solicitud (en inglés)
POST /api/generate-image { language: "en" }
// date: "Monday, December 29, 2025"

// Segunda solicitud (en portugués, misma ciudad + condición)
POST /api/generate-image { language: "pt" }
// date: "segunda-feira, 29 de dezembro de 2025"  ← Actualizada en PT
```

## Agregar Nuevos Idiomas

Para agregar un nuevo idioma:

1. Editar `server/routes/generate-image.ts`:

```typescript
const localeMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",  // ← Agregar aquí
  de: "de-DE",
};
```

2. Actualizar `public/index.html` para agregar el botón del idioma

3. Probar con el script de testing

## Consideraciones de Zona Horaria

La fecha se genera usando la **zona horaria del servidor**:

```typescript
const formattedDate = formatDateInLanguage(new Date(), language);
```

Si necesitas usar una zona horaria específica:

```typescript
// Ejemplo: usar UTC
const formattedDate = formatDateInLanguage(
  new Date(Date.UTC(...)),
  language
);

// O usar zona horaria específica
const date = new Date().toLocaleString('en-US', {
  timeZone: 'America/Sao_Paulo'
});
```

## Archivos Relacionados

| Archivo | Función |
|---------|---------|
| `server/routes/generate-image.ts` | Implementación de formatDateInLanguage() |
| `scripts/test-date-localization.ts` | Script de testing |
| `public/index.html` | Selector de idioma en el frontend |
| `public/app.js` | Manejo de cambio de idioma |

## FAQ

**P: ¿La fecha cambia según el idioma seleccionado?**
R: Sí, la fecha se formatea automáticamente según el idioma (`language`) enviado en la request.

**P: ¿Qué pasa si no se especifica el idioma?**
R: Por defecto se usa `"en"` (inglés).

**P: ¿La fecha en el manifest se mantiene en el idioma original?**
R: No, el manifest se actualiza cada vez con el idioma de la última solicitud.

**P: ¿Puedo cambiar el formato de la fecha?**
R: Sí, modificando las opciones en `toLocaleDateString()`:

```typescript
// Formato corto
date.toLocaleDateString(locale, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
// Output: "Dec 29, 2025" (en) / "29 dic 2025" (es)

// Solo fecha numérica
date.toLocaleDateString(locale);
// Output: "12/29/2025" (en-US) / "29/12/2025" (pt-BR)
```
