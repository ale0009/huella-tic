# Huella TIC — ¿Cuánto CO₂ emite tu tecnología?

[English version](README.en.md) · ![CI](https://github.com/ale0009/huella-tic/actions/workflows/ci.yml/badge.svg)

Una calculadora que hace **una sola cosa**: dices qué equipos tienes (servidores, PC, laptops, monitores, routers, UPS…), cuántos y cuántas horas al día están encendidos, y ves en vivo los **kg de CO₂ al año** con el factor de la red eléctrica de Colombia (**IDEAM 2023: 0,196 kg CO₂/kWh**).

El proyecto tiene dos caras:

| Ruta | Qué es |
|---|---|
| `/` | **La herramienta.** Abre con un ejemplo marcado (una pequeña oficina, ≈ 1 861 kg CO₂/año). Medidor tipo HUD de videojuego con niveles, equivalencias y botón «Compartir resultado» que copia un texto. |
| `/proceso/` | **Cómo se hizo.** El diagnóstico ISO 14001:2015 del que sale todo: método, gráfica de CO₂ por equipo, decisiones y muestras de diseño, PHVA, matriz de aspectos e impactos, RAEE, simulador de escenarios, KPI, fe de erratas, fuentes y limitaciones. |

## Cómo usarlo

1. Abre `/`: ya hay un ejemplo cargado.
2. Cambia cantidad (− / +), horas al día (deslizador) o vatios. Añade equipos con los botones «+ Servidor rack», «+ Laptop»…
3. «Medir este equipo» añade el equipo desde el que navegas. **Es una estimación**: el navegador no mide vatios; con la batería (si la expone) y los hilos de CPU solo se adivina si es laptop o PC, y se usan los vatios de la fuente para ese tipo.
4. «Compartir resultado» copia un texto con tu cifra, tu nivel y el enlace.

## De dónde salen las cifras

- **Fórmula y factor:** `CO₂ (kg/año) = kW × h/día × 365 × unidades × 0,196` (diagnóstico §1.3; IDEAM, 2023).
- **Potencias y horas por defecto:** tabla §1.3.2 del diagnóstico (p. ej. servidor rack 500 W, PC 85 W, laptop 45 W, 24 h o 9 h al día). El **monitor** no está en la tabla: su potencia queda vacía y la escribe el usuario.
- **Equivalencias (calculado aquí)** con proporciones de la propia fuente: 490 014 kg ≈ 106 carros → ≈ 4 623 kg por carro al año; 1 aire de precisión de 5 kW ≈ 15 hogares → 2 920 kWh por hogar al año. **No** hay árboles ni kilómetros: la fuente no trae esos datos.
- **Niveles del HUD:** escala propia del juego (cada nivel es 10 veces más CO₂), no de la norma.
- Solo se cuenta la electricidad de uso; no fabricación, transporte ni fin de vida.

## De qué trabajo sale

Diagnóstico ambiental ISO 14001:2015 de la infraestructura TIC de *un proveedor regional de servicios gestionados y data centers (caso de estudio, anonimizado)*, hecho en equipo en Ingeniería de Sistemas (2026). Las cifras son estimaciones técnicas con información pública, no datos auditados. Las contradicciones de la fuente están en la fe de erratas de `/proceso/`.

## Ejecutar y probar

Sin instalación ni compilación (HTML, CSS y módulos JS):

```bash
python3 -m http.server 8000   # abre http://localhost:8000
node --test                   # Node 20 o superior
```

- `tests/calculos.test.js` (18 pruebas): el inventario reproduce el total de la fuente (490 014 kg), reparto por categoría, semáforo, escenarios.
- `tests/calculadora.test.js` (12 pruebas): potencias del catálogo = tabla de la fuente, monitor sin dato, ejemplo de oficina, límites de entrada, equivalencias, niveles, medidor, «medir este equipo» y texto para compartir.

GitHub Pages: *Settings → Pages → `main` / raíz*.

## Estructura

```
index.html              la herramienta
proceso/index.html      cómo se hizo (diagnóstico completo)
css/herramienta.css     estilos de la herramienta (claro «Tinta y trama», oscuro «Jisseki»)
css/estilos.css         estilos de /proceso/
js/datos.js             datos del caso, con la sección de la fuente
js/calculos.js          funciones puras del diagnóstico
js/calculadora.js       funciones puras de la herramienta
js/herramienta.js       interfaz de la herramienta
js/app.js               interfaz de /proceso/
tests/                  pruebas con node:test
```

## Accesibilidad

Contraste AA en claro y oscuro, uso completo con teclado, etiquetas en todos los controles, resultados en regiones `aria-live`, `prefers-reduced-motion` y diseño de 390 a 1440 px sin scroll horizontal.

## Créditos

Mario Puerta × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) · [github.com/ale0009](https://github.com/ale0009). Diagnóstico hecho en equipo.

Tipografías de Google Fonts (OFL): Dela Gothic One, Bangers, IBM Plex Sans, IBM Plex Mono y Noto Serif JP.

## Licencia

[MIT](LICENSE) © 2026 Mario Alejandro Puerta Alarcón y David Alexander Rincón Corredor
