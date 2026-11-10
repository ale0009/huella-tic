# Huella TIC — How much CO₂ does your tech emit?

[Versión en español](README.md) · ![CI](https://github.com/ale0009/huella-tic/actions/workflows/ci.yml/badge.svg)

A calculator that does **one thing**: pick your devices (servers, PCs, laptops, monitors, routers, UPS…), how many and how many hours a day they run, and see **kg of CO₂ per year** live, using Colombia's grid emission factor (**IDEAM 2023: 0.196 kg CO₂/kWh**). The interface is in Spanish.

Two faces:

| Path | What it is |
|---|---|
| `/` | **The tool.** Opens with a labelled example (a small office, ≈ 1,861 kg CO₂/yr). Video-game style HUD gauge with levels, equivalences and a "share result" button that copies a text. |
| `/proceso/` | **How it was made.** The ISO 14001:2015 assessment behind it: method, CO₂-per-device chart, design decisions and samples, PDCA, aspects & impacts matrix, e-waste compliance, scenario simulator, KPIs, errata, sources and limitations. |

## How to use

1. Open `/` — an example is already loaded.
2. Change quantity (− / +), hours per day (slider) or watts; add devices with the "+" chips.
3. "Medir este equipo" (measure this device) adds the device you are browsing from. **It is an estimate**: browsers do not expose watts; battery status (if available) and CPU threads only hint whether it is a laptop or a desktop, and the source's wattage for that type is used.
4. "Compartir resultado" copies a short text with your figure, level and link.

## Where the numbers come from

- **Formula & factor:** `CO₂ (kg/yr) = kW × h/day × 365 × units × 0.196` (assessment §1.3; IDEAM 2023).
- **Default watts & hours:** table §1.3.2 of the assessment. Monitors are not in the table, so their wattage is left blank for the user.
- **Equivalences (computed here)** from the source's own ratios: 490,014 kg ≈ 106 cars → ≈ 4,623 kg per car-year; one 5 kW precision AC ≈ 15 homes → 2,920 kWh per home-year. No trees or kilometres: the source has no such data.
- **HUD levels:** the game's own log scale (each level = 10× more CO₂), not a standard.
- Only operational electricity is counted (no manufacturing, transport or end of life).

## Origin

Team academic project (Systems Engineering, 2026): an ISO 14001:2015 assessment of the IT infrastructure of *a regional managed-services and data-center provider (anonymized case study)*. Figures are technical estimates from public information, not audited data.

## Run & test

```bash
python3 -m http.server 8000   # open http://localhost:8000
node --test                   # Node 20+, 30 tests
```

## Credits

Mario Puerta × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/) · [github.com/ale0009](https://github.com/ale0009).

## License

[MIT](LICENSE) © 2026 Mario Alejandro Puerta Alarcón and David Alexander Rincón Corredor
