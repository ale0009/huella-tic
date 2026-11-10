# Huella TIC — ISO 14001 in a data center

[Versión en español](README.md)

A single-page interactive landing that turns an **ISO 14001:2015 environmental assessment** into something you can play with: how much CO₂ the IT infrastructure of *a regional managed-services and data-center provider (case study)* emits, which impacts are critical, whether it complies with e-waste regulations, and which actions would cut the footprint.

> **≈ 490 t of CO₂ per year** across 6 data centers. Cooling accounts for 42 %.

Black-and-white manga look: paper, ink, a single red accent, hand-made SVG screentones, comic panels, speed lines and CSS-drawn sound effects. No copyrighted characters, logos or artwork. The interface is in Spanish.

## Features

1. **Splash** with the headline figure.
2. **Why ISO 14001 + PDCA** (PHVA in Spanish): four keyboard-navigable panels (P: clauses 4–6, D: 7–8, C: 9, A: 10) mapped to what the assessment did.
3. **Footprint calculator**: 10 equipment types with live controls (units, hours/day, kW) and an editable emission factor; per-category distribution bar; PUE gauge.
4. **Aspects & impacts heat map** (probability × severity) using the source's traffic-light scale, with click-for-detail.
5. **Inventory & obsolescence** chart, % obsolete and critical materials.
6. **E-waste (RAEE) compliance checklist** against Colombian law — verdict: *partially compliant*.
7. **Scenario simulator**: toggle actions (free cooling, virtualization, auto power-off, solar…) and see CO₂ reduction vs. target, resulting footprint and payback.
8. **KPI board**: 3 SMART objectives, 6 indicators (baseline → target), SDGs 7, 12 and 13, plus an **errata note** documenting the source's internal inconsistencies.
9. **Credits**.

## Run it

No build step — plain HTML, CSS and ES modules:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Deployable as-is on GitHub Pages (branch `main`, root folder).

## Tests

```bash
node --test   # Node 20+
```

`tests/calculos.test.js` checks that the recomputed baseline reproduces the source total (490,014 kg CO₂/yr) within 0.1 %, the 42 % / 38 % split, the heat-map scale and the scenario logic. GitHub Actions runs them on every push.

## Data & method

`CO₂ (kg/yr) = kW × hours/day × 365 × units × 0.196` (IDEAM 2023 grid factor). Every figure comes from the assessment document (`js/datos.js` cites the section). Values are technical estimates from public information, not audited data. Investment amounts were redacted in the public version of the case, so the simulator does not invent them. Where the source contradicts itself, the site follows the **objectives** section and explains it in the errata note.

## Credits

Academic team project — Systems Engineering. Web development: Mario Puerta. Assessment co-authorship: David Alexander Rincón Corredor (Kuronoma) and team.

## License

[MIT](LICENSE) © 2026 Mario Alejandro Puerta Alarcón
