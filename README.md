# Huella TIC — ISO 14001 en un data center

[English version](README.en.md) · ![CI](https://github.com/ale0009/huella-tic/actions/workflows/ci.yml/badge.svg)

Landing interactiva de una sola página que convierte un **diagnóstico ambiental ISO 14001:2015** en algo que se puede manipular: cuánto CO₂ emite la infraestructura TIC de *un proveedor regional de servicios gestionados y data centers (caso de estudio)*, qué impactos son críticos, si cumple la normativa de residuos electrónicos y qué acciones bajarían la huella.

> **≈ 490 t de CO₂ al año** en 6 data centers. El 42 % lo pone el enfriamiento.

Estética de manga en blanco y negro: papel, tinta, un acento rojo, tramas de puntos dibujadas en SVG, viñetas, líneas cinéticas y onomatopeyas hechas con CSS. No usa personajes, logos ni arte con derechos de autor.

## Qué incluye

| # | Sección | Qué hace |
|---|---|---|
| 1 | Splash | El dato principal (≈ 490 t CO₂/año) en página completa. |
| 2 | Por qué ISO 14001 + PHVA | Cuatro viñetas navegables con teclado (P: cláusulas 4–6, H: 7–8, V: 9, A: 10), cada una con lo que hizo el diagnóstico. |
| 3 | Calculadora de huella | Tabla de 10 equipos con controles (unidades, horas/día, kW) y factor de emisión editable. Recalcula kWh y kg CO₂ en vivo; barra de distribución por categoría; regla de PUE. |
| 4 | Matriz de aspectos e impactos | Mapa de calor P × S con el semáforo de la fuente; al hacer clic muestra causa, efecto y acción requerida. |
| 5 | Inventario y obsolescencia | Gráfico de unidades por tipo, % obsoleto y materiales críticos. |
| 6 | RAEE | Checklist de cumplimiento (Ley 1672 de 2013, resoluciones 851/2022, 1297/2010, 1512/2010, Protocolo de Montreal). Veredicto: *cumple parcialmente*. |
| 7 | Simulador de escenarios | Activa acciones (free cooling, virtualización, apagado automático, solar…) y mira la reducción de CO₂ frente a la meta, la huella resultante y el payback. |
| 8 | Tablero de KPI | 3 objetivos SMART, 6 indicadores (línea base → meta) y ODS 7, 12 y 13. Incluye la **fe de erratas del caso**. |
| 9 | Créditos | Autoría y nota metodológica. |

## Cómo verlo

No necesita instalación ni compilación: es HTML, CSS y módulos de JavaScript.

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

(Los módulos ES no cargan desde `file://`, por eso hace falta un servidor estático.)

**GitHub Pages:** *Settings → Pages → Deploy from a branch → `main` / raíz*.

## Pruebas

```bash
node --test        # Node 20 o superior
```

Las pruebas (`tests/calculos.test.js`) comprueban, entre otras cosas, que el total recalculado reproduzca el total de la fuente (490 014 kg CO₂/año) con un margen del 0,1 %, que el reparto por categoría dé 42 % enfriamiento y 38 % servidores, y la lógica del semáforo y del simulador. La CI de GitHub Actions las ejecuta en cada *push*.

## Estructura

```
index.html            página única
css/estilos.css       estilos (tokens de color, viñetas, trama, onomatopeyas)
js/datos.js           datos del caso, con la sección de la fuente en comentarios
js/calculos.js        funciones puras: huella, distribución, significancia, escenarios, payback
js/app.js             interfaz (pinta las secciones y conecta los controles)
tests/                pruebas con node:test
assets/favicon.svg    icono (kanji 環 «medio ambiente»)
```

## Metodología y cifras

- Fórmula: `CO₂ (kg/año) = kW × horas/día × 365 × unidades × 0,196`, con el factor de emisión del IDEAM (2023).
- Todas las cifras salen del documento del diagnóstico. Son **estimaciones técnicas** hechas con información pública y especificaciones de fabricantes, no datos auditados.
- Los montos de inversión vienen anonimizados en la versión pública del caso; el simulador no los inventa.
- Cuando la fuente se contradice (meta de CO₂ −15 % frente a −20 %, plazos RAEE y SGA, 63 % de obsolescencia, nivel de la fila de enfriamiento en la matriz), el sitio usa la sección de **objetivos** y lo explica en la fe de erratas.

## Accesibilidad

Contraste AA, navegación completa por teclado (pestañas PHVA con flechas, enlace para saltar al contenido, foco visible), etiquetas en todos los controles, regiones `aria-live` para los resultados, respeto a `prefers-reduced-motion` y diseño adaptable sin scroll horizontal en móvil.

## Créditos

Trabajo académico en equipo — Ingeniería de Sistemas. Desarrollo web: Mario Puerta. Coautoría del diagnóstico: {DAVID} y equipo.

Tipografías de Google Fonts (licencia OFL): Dela Gothic One, Bangers, Noto Serif JP e Inter.

## Licencia

[MIT](LICENSE) © 2026 Mario Alejandro Puerta Alarcón
