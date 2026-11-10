// Lógica de la superherramienta "¿Cuánto CO₂ emite tu tecnología?".
// Funciones puras (sin DOM): se prueban con `node --test` en tests/calculadora.test.js.
// Toda potencia y factor sale de js/datos.js (fuente: diagnóstico §1.3). Lo que no está
// en la fuente se marca con `fuente: null` y lo tiene que poner el visitante.
import { EQUIPOS, FACTOR_EMISION, TOTAL_FUENTE_KG, VEHICULOS_EQUIVALENTES, HOGARES_POR_CRU } from './datos.js';
import { kwhAnual } from './calculos.js';

const ref = (id) => EQUIPOS.find((e) => e.id === id);

/**
 * Catálogo de la calculadora. Potencia y horas/día por defecto = tabla §1.3.2 de la fuente.
 * El monitor no aparece en la tabla: su potencia queda vacía (null) y la escribe el visitante.
 */
export const CATALOGO = [
  { id: 'servidor', nombre: 'Servidor rack', ref: ref('hpe') },
  { id: 'servidor-alto', nombre: 'Servidor rack (gama alta)', ref: ref('dell') },
  { id: 'pc', nombre: 'PC de escritorio', ref: ref('ws') },
  { id: 'laptop', nombre: 'Laptop', ref: ref('laptop') },
  { id: 'monitor', nombre: 'Monitor', ref: null, horasDia: 9 },
  { id: 'switch', nombre: 'Switch de red', ref: ref('switch') },
  { id: 'router', nombre: 'Router', ref: ref('router') },
  { id: 'firewall', nombre: 'Firewall', ref: ref('firewall') },
  { id: 'ups', nombre: 'UPS', ref: ref('ups') },
  { id: 'storage', nombre: 'Almacenamiento SAN', ref: ref('storage') },
  { id: 'aire', nombre: 'Aire de precisión', ref: ref('cru') },
].map((c) => ({
  id: c.id,
  nombre: c.nombre,
  potenciaW: c.ref ? c.ref.potenciaW : null,
  horasDia: c.ref ? c.ref.horasDia : c.horasDia,
  fuente: c.ref ? `${c.ref.nombre} · tabla §1.3.2` : null,
}));

export const porIdCatalogo = (id) => CATALOGO.find((c) => c.id === id);

/** Ejemplo precargado: una pequeña oficina (composición inventada como EJEMPLO; potencias de la fuente). */
export const EJEMPLO_OFICINA = [
  { tipo: 'servidor', cantidad: 1, horasDia: 24 },
  { tipo: 'pc', cantidad: 6, horasDia: 9 },
  { tipo: 'laptop', cantidad: 4, horasDia: 9 },
  { tipo: 'switch', cantidad: 1, horasDia: 24 },
  { tipo: 'router', cantidad: 1, horasDia: 24 },
];

/** Crea una fila de la calculadora a partir del catálogo. */
export function nuevaFila(tipo, cambios = {}) {
  const c = porIdCatalogo(tipo);
  if (!c) throw new RangeError(`Tipo de equipo desconocido: ${tipo}`);
  return { tipo, cantidad: 1, horasDia: c.horasDia, potenciaW: c.potenciaW, ...cambios };
}

/** Limita un número a [min, max]; lo que no es número cuenta como `min`. */
export function acotar(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Normaliza una fila: cantidad entera 0–9999, horas 0–24, potencia 0–100 000 W o null. */
export function normalizarFila(f) {
  const pot = f.potenciaW === null || f.potenciaW === '' || f.potenciaW === undefined ? null : acotar(f.potenciaW, 0, 100000);
  return { ...f, cantidad: Math.round(acotar(f.cantidad, 0, 9999)), horasDia: acotar(f.horasDia, 0, 24), potenciaW: pot };
}

/** kWh y kg CO₂ al año de una fila. Sin potencia (null) no suma y queda marcada como incompleta. */
export function calcularFila(f, factor = FACTOR_EMISION) {
  const n = normalizarFila(f);
  if (n.potenciaW === null) return { kwh: 0, co2: 0, completa: false };
  const kwh = kwhAnual({ potenciaW: n.potenciaW, horasDia: n.horasDia, unidades: n.cantidad });
  return { kwh, co2: kwh * Number(factor), completa: true };
}

/** Totales de todas las filas. */
export function calcularTotal(filas, factor = FACTOR_EMISION) {
  const detalle = filas.map((f) => calcularFila(f, factor));
  return {
    detalle,
    kwh: detalle.reduce((s, d) => s + d.kwh, 0),
    co2: detalle.reduce((s, d) => s + d.co2, 0),
    incompletas: detalle.filter((d) => !d.completa).length,
  };
}

/** ¿El visitante cambió la potencia frente a la de la fuente? */
export function potenciaEditada(f) {
  const c = porIdCatalogo(f.tipo);
  return Boolean(c) && c.potenciaW !== null && Number(f.potenciaW) !== c.potenciaW;
}

/** Calculado aquí: kg CO₂ que emite un vehículo a gasolina en un año, según la proporción de §1.3.3 (490 014 kg ≈ 106 vehículos). */
export const KG_POR_VEHICULO_ANIO = TOTAL_FUENTE_KG / VEHICULOS_EQUIVALENTES;

/** Calculado aquí: kWh/año de un hogar colombiano, según §1.3.3 (1 Liebert CRU de 5 kW a 24 h ≈ 15 hogares). */
export const KWH_POR_HOGAR_ANIO = kwhAnual({ potenciaW: ref('cru').potenciaW, horasDia: 24, unidades: 1 }) / HOGARES_POR_CRU;

/** Equivalencias de un resultado (todas "calculado aquí" a partir de proporciones de la fuente). */
export function equivalencias(co2, kwh) {
  return {
    vehiculos: co2 / KG_POR_VEHICULO_ANIO,
    hogares: kwh / KWH_POR_HOGAR_ANIO,
    pctDataCenter: co2 / TOTAL_FUENTE_KG,
  };
}

/**
 * Nivel del HUD: escala logarítmica propia (calculado aquí, no viene de la fuente).
 * Cada nivel es diez veces más CO₂ que el anterior.
 */
export const NIVELES = [
  { n: 1, nombre: 'Chispa', desde: 0 },
  { n: 2, nombre: 'Brasa', desde: 100 },
  { n: 3, nombre: 'Hoguera', desde: 1000 },
  { n: 4, nombre: 'Incendio', desde: 10000 },
  { n: 5, nombre: 'Data center', desde: 100000 },
];

export function nivelHud(co2) {
  const kg = Math.max(0, Number(co2) || 0);
  let i = 0;
  for (let k = 0; k < NIVELES.length; k++) if (kg >= NIVELES[k].desde) i = k;
  const nivel = NIVELES[i];
  const siguiente = NIVELES[i + 1] ?? null;
  // Progreso dentro del nivel, en escala logarítmica (el nivel 1 va de 10 a 100 kg).
  const lo = Math.log10(Math.max(nivel.desde, 10));
  const hi = siguiente ? Math.log10(siguiente.desde) : lo + 1;
  const progreso = kg <= 0 ? 0 : Math.min(1, Math.max(0, (Math.log10(Math.max(kg, 1)) - lo) / (hi - lo)));
  return { ...nivel, siguiente, progreso };
}

/** Posición (0–1) en el medidor logarítmico de 10 kg a 1 000 000 kg. */
export const MEDIDOR_MIN = 10;
export const MEDIDOR_MAX = 1e6;
export function posicionMedidor(co2) {
  const kg = Number(co2) || 0;
  if (kg <= MEDIDOR_MIN) return 0;
  const p = (Math.log10(kg) - Math.log10(MEDIDOR_MIN)) / (Math.log10(MEDIDOR_MAX) - Math.log10(MEDIDOR_MIN));
  return Math.min(1, Math.max(0, p));
}

/**
 * "Medir este equipo": deduce SOLO el tipo de equipo a partir de lo que expone el navegador.
 * El navegador no da vatios, así que la potencia sigue siendo la de la fuente para ese tipo.
 * bateria: null si la Battery API no existe; si existe, { level, charging, chargingTime, dischargingTime }.
 */
export function estimarEquipo({ nucleos = null, bateria = null } = {}) {
  const datos = [];
  if (Number.isFinite(nucleos) && nucleos > 0) datos.push(`${nucleos} hilos de CPU`);
  if (!bateria) {
    return { tipo: 'pc', seguro: false, datos, motivo: 'Tu navegador no expone la batería, así que suponemos un PC de escritorio. Cámbialo si no lo es.' };
  }
  const conBateria = bateria.level < 1 || Number.isFinite(bateria.dischargingTime) || (bateria.charging && bateria.chargingTime > 0 && Number.isFinite(bateria.chargingTime));
  datos.push(`batería al ${Math.round(bateria.level * 100)} %${bateria.charging ? ', cargando' : ''}`);
  if (conBateria) return { tipo: 'laptop', seguro: true, datos, motivo: 'El navegador reporta una batería en uso: parece una laptop.' };
  return { tipo: 'pc', seguro: false, datos, motivo: 'La batería aparece llena y sin descarga, como en un equipo de escritorio. Puede ser una laptop enchufada.' };
}

/** Texto para "compartir resultado". */
export function textoCompartir({ co2, kwh, filas, url = '' }, fmt) {
  const nv = nivelHud(co2);
  const eq = equivalencias(co2, kwh);
  const equipos = filas.reduce((s, f) => s + (Number(f.cantidad) || 0), 0);
  return [
    `Mi tecnología (${fmt(equipos)} equipos) emite ≈ ${fmt(co2)} kg de CO₂ al año. Nivel ${nv.n}: ${nv.nombre}.`,
    `Eso es ${fmt(eq.vehiculos, 2)} carros a gasolina andando un año (calculado con la proporción del caso de estudio).`,
    `Factor de la red eléctrica de Colombia: ${String(FACTOR_EMISION).replace('.', ',')} kg CO₂/kWh (IDEAM, 2023).`,
    url ? `Calcula el tuyo: ${url}` : '',
  ].filter(Boolean).join('\n');
}
