// Lógica de cálculo de "Huella TIC". Funciones puras: no tocan el DOM ni estado global,
// así se pueden probar con `node --test` y reutilizar en el navegador.

/** Días de un año no bisiesto, tal como usa la fuente (× 365). */
export const DIAS_ANIO = 365;

/**
 * Energía anual de un tipo de equipo en kWh.
 * kWh/año = (W ÷ 1000) × horas/día × 365 × unidades
 */
export function kwhAnual({ potenciaW, horasDia, unidades }) {
  const kw = Number(potenciaW) / 1000;
  return Math.max(0, kw * Number(horasDia) * DIAS_ANIO * Number(unidades));
}

/**
 * Emisiones anuales de un tipo de equipo en kg CO₂.
 * CO₂ (kg/año) = kW × horas/día × 365 × unidades × factor de emisión
 */
export function co2Anual(equipo, factor) {
  return kwhAnual(equipo) * Number(factor);
}

/** Huella de todo el inventario: detalle por equipo y totales. */
export function huellaTotal(equipos, factor) {
  const porEquipo = equipos.map((e) => ({ id: e.id, categoria: e.categoria, kwh: kwhAnual(e), co2: co2Anual(e, factor) }));
  const totalKwh = porEquipo.reduce((s, e) => s + e.kwh, 0);
  const totalCo2 = porEquipo.reduce((s, e) => s + e.co2, 0);
  return { porEquipo, totalKwh, totalCo2 };
}

/** Reparte la huella por categoría; devuelve [{categoria, co2, pct}] ordenado de mayor a menor. */
export function distribucionPorCategoria(equipos, factor) {
  const { porEquipo, totalCo2 } = huellaTotal(equipos, factor);
  const mapa = new Map();
  for (const e of porEquipo) mapa.set(e.categoria, (mapa.get(e.categoria) ?? 0) + e.co2);
  return [...mapa.entries()]
    .map(([categoria, co2]) => ({ categoria, co2, pct: totalCo2 > 0 ? co2 / totalCo2 : 0 }))
    .sort((a, b) => b.co2 - a.co2);
}

/** Significancia de un aspecto ambiental: probabilidad × severidad (1–3 cada una). */
export function significancia(p, s) {
  if (![1, 2, 3].includes(p) || ![1, 2, 3].includes(s)) throw new RangeError('P y S deben ser 1, 2 o 3');
  return p * s;
}

/** Nivel del semáforo según la escala de la fuente: 1–3 bajo, 4–6 medio, 7–9 alto. */
export function nivelSignificancia(valor) {
  if (valor <= 3) return 'bajo';
  if (valor <= 6) return 'medio';
  return 'alto';
}

/**
 * Porcentaje de obsolescencia calculado sobre la tabla.
 * por = 'unidades' (equipos físicos) o 'tipos' (filas del inventario).
 */
export function porcentajeObsoleto(equipos, por = 'unidades') {
  if (por === 'tipos') return equipos.filter((e) => e.obsoleto).length / equipos.length;
  const total = equipos.reduce((s, e) => s + e.unidades, 0);
  const obs = equipos.filter((e) => e.obsoleto).reduce((s, e) => s + e.unidades, 0);
  return total > 0 ? obs / total : 0;
}

/** Payback simple en años = inversión ÷ ahorro anual. Infinity si no hay ahorro. */
export function paybackSimple(inversion, ahorroAnual) {
  if (!(ahorroAnual > 0)) return Infinity;
  return Number(inversion) / Number(ahorroAnual);
}

/** Valor objetivo tras aplicar una reducción porcentual (0,15 = −15 %). */
export function metaReduccion(base, porcentaje) {
  return base * (1 - porcentaje);
}

/**
 * Reducción de CO₂ de una acción: usa los valores de la fuente o, si la acción
 * es "apagado", la deriva como un % del consumo de los puestos de usuario.
 */
export function reduccionAccion(accion, contexto) {
  if (accion.calcular === 'apagado') {
    const usuario = contexto.equipos.filter((e) => e.categoria === 'usuario');
    const kwh = usuario.reduce((s, e) => s + kwhAnual(e), 0);
    const r = kwh * contexto.ahorroApagado * contexto.factor;
    return { min: r, max: r, cuantificada: true };
  }
  if (accion.reduccionMin == null) return { min: 0, max: 0, cuantificada: false };
  return { min: accion.reduccionMin, max: accion.reduccionMax ?? accion.reduccionMin, cuantificada: true };
}

/**
 * Simula un escenario con las acciones activas.
 * Devuelve reducción mínima y máxima, CO₂ resultante, % de reducción y si se alcanza la meta.
 */
export function simularEscenario(acciones, idsActivas, contexto) {
  const activas = acciones.filter((a) => idsActivas.includes(a.id));
  let min = 0;
  let max = 0;
  const paybacks = [];
  const inversiones = [];
  for (const a of activas) {
    const r = reduccionAccion(a, contexto);
    min += r.min;
    max += r.max;
    if (typeof a.paybackAnios === 'number') paybacks.push(a.paybackAnios);
    if (typeof a.inversionUSD === 'number') inversiones.push(a.inversionUSD);
  }
  const base = contexto.base;
  const meta = metaReduccion(base, contexto.metaReduccion);
  return {
    activas: activas.length,
    reduccionMin: min,
    reduccionMax: max,
    co2Min: Math.max(0, base - max),
    co2Max: Math.max(0, base - min),
    pctMin: base > 0 ? min / base : 0,
    pctMax: base > 0 ? max / base : 0,
    meta,
    alcanzaMeta: base - min <= meta,
    alcanzaMetaEnMejorCaso: base - max <= meta,
    paybackMasLargo: paybacks.length ? Math.max(...paybacks) : null,
    inversionTotal: inversiones.length === activas.length && activas.length > 0 ? inversiones.reduce((s, v) => s + v, 0) : null,
  };
}

/** Avance (0–1) de un KPI entre línea base y meta, sirva para subir o bajar. */
export function progresoKpi(base, meta, actual) {
  if (base === meta) return 1;
  const p = (actual - base) / (meta - base);
  return Math.min(1, Math.max(0, p));
}

/**
 * Formato de número en español: coma decimal y espacio fino como separador de miles
 * (estilo SI, evita confundir 490 014 con un decimal). Ej.: 490014 → "490 014".
 */
export function formatoNumero(n, decimales = 0) {
  const fijo = Math.abs(Number(n)).toFixed(decimales);
  const [entero, dec] = fijo.split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  const signo = Number(n) < 0 && Number(fijo) !== 0 ? '−' : '';
  return signo + conMiles + (dec ? ',' + dec : '');
}
