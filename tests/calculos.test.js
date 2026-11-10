import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  kwhAnual, co2Anual, huellaTotal, distribucionPorCategoria, significancia, nivelSignificancia,
  porcentajeObsoleto, paybackSimple, metaReduccion, reduccionAccion, simularEscenario, progresoKpi,
} from '../js/calculos.js';
import {
  EQUIPOS, FACTOR_EMISION, TOTAL_FUENTE_KG, ASPECTOS, ACCIONES, KPIS, META_REDUCCION_CO2, AHORRO_APAGADO,
} from '../js/datos.js';

const contexto = { equipos: EQUIPOS, factor: FACTOR_EMISION, ahorroApagado: AHORRO_APAGADO, base: TOTAL_FUENTE_KG, metaReduccion: META_REDUCCION_CO2 };
const porId = (id) => EQUIPOS.find((e) => e.id === id);
// Valores de referencia de la fuente (§1.3.2 y §6)
const CO2_CRU_FUENTE = 206035;
const KWH_USUARIO_FUENTE = 71573;
const KWH_USUARIO_FORMULA = 71448.75;
const CIEN_MIL = 100000;

test('kWh/año de los servidores HPE coincide con la tabla fuente (525 600)', () => {
  assert.equal(kwhAnual(porId('hpe')), 525600);
});

test('CO₂ del enfriamiento Liebert CRU ≈ 206 035 kg', () => {
  assert.ok(Math.abs(co2Anual(porId('cru'), FACTOR_EMISION) - CO2_CRU_FUENTE) < 1);
});

test('cada equipo reproduce el CO₂ de la fuente con tolerancia del 0,5 %', () => {
  for (const e of EQUIPOS) {
    const calc = co2Anual(e, FACTOR_EMISION);
    const err = Math.abs(calc - e.co2Fuente) / e.co2Fuente;
    assert.ok(err < 0.005, `${e.id}: calculado ${calc.toFixed(0)} vs fuente ${e.co2Fuente}`);
  }
});

test('el total base reproduce el total de la fuente (490 014 kg) con tolerancia del 0,1 %', () => {
  const { totalCo2 } = huellaTotal(EQUIPOS, FACTOR_EMISION);
  assert.ok(Math.abs(totalCo2 - TOTAL_FUENTE_KG) / TOTAL_FUENTE_KG < 0.001, `total ${totalCo2}`);
});

test('la suma de CO₂ por fila de la fuente da exactamente el total reportado', () => {
  assert.equal(EQUIPOS.reduce((s, e) => s + e.co2Fuente, 0), TOTAL_FUENTE_KG);
});

test('distribución: enfriamiento ≈ 42 % y servidores ≈ 38 %; suma 100 %', () => {
  const d = distribucionPorCategoria(EQUIPOS, FACTOR_EMISION);
  const pct = Object.fromEntries(d.map((x) => [x.categoria, x.pct]));
  assert.equal(d[0].categoria, 'enfriamiento');
  assert.equal(Math.round(pct.enfriamiento * 100), 42);
  assert.equal(Math.round(pct.servidores * 100), 38);
  assert.equal(Math.round(pct.usuario * 100), 3);
  assert.ok(Math.abs(d.reduce((s, x) => s + x.pct, 0) - 1) < 1e-9);
});

test('el consumo de puestos de usuario es ≈ 71 573 kWh/año (KPI de la fuente)', () => {
  const kwh = EQUIPOS.filter((e) => e.categoria === 'usuario').reduce((s, e) => s + kwhAnual(e), 0);
  assert.ok(Math.abs(kwh - KWH_USUARIO_FUENTE) / KWH_USUARIO_FUENTE < 0.005, `kWh ${kwh}`);
});

test('la huella responde a los cambios de entrada (función pura, sin mutar)', () => {
  const copia = EQUIPOS.map((e) => ({ ...e }));
  copia.find((e) => e.id === 'cru').unidades = 12;
  const { totalCo2 } = huellaTotal(copia, FACTOR_EMISION);
  assert.ok(totalCo2 < TOTAL_FUENTE_KG - CIEN_MIL);
  assert.equal(porId('cru').unidades, 24);
  assert.equal(kwhAnual({ potenciaW: 100, horasDia: -5, unidades: 1 }), 0);
});

test('significancia P×S y semáforo según la escala de la fuente', () => {
  assert.equal(significancia(3, 3), 9);
  assert.equal(nivelSignificancia(1), 'bajo');
  assert.equal(nivelSignificancia(3), 'bajo');
  assert.equal(nivelSignificancia(4), 'medio');
  assert.equal(nivelSignificancia(6), 'medio');
  assert.equal(nivelSignificancia(9), 'alto');
  assert.throws(() => significancia(4, 1), RangeError);
  const altos = ASPECTOS.filter((a) => nivelSignificancia(significancia(a.p, a.s)) === 'alto');
  assert.equal(altos.length, 3);
});

test('obsolescencia calculada sobre la tabla (para la fe de erratas)', () => {
  assert.equal(porcentajeObsoleto(EQUIPOS, 'tipos'), 0.6);
  assert.equal(Math.round(porcentajeObsoleto(EQUIPOS, 'unidades') * 100), 56);
});

test('payback simple', () => {
  assert.equal(paybackSimple(100, 50), 2);
  assert.equal(paybackSimple(100, 0), Infinity);
});

test('meta de reducción del 15 % (objetivo 1) ≈ 416 512 kg', () => {
  assert.equal(Math.round(metaReduccion(TOTAL_FUENTE_KG, META_REDUCCION_CO2)), 416512);
  assert.equal(KPIS.find((k) => k.id === 'co2').meta, 416512);
});

test('reducción del apagado automático = 8 % del consumo de usuario × factor', () => {
  const r = reduccionAccion(ACCIONES.find((a) => a.id === 'apagado'), contexto);
  assert.ok(r.cuantificada);
  assert.ok(Math.abs(r.min - KWH_USUARIO_FORMULA * 0.08 * 0.196) < 1);
});

test('escenario vacío no reduce nada', () => {
  const s = simularEscenario(ACCIONES, [], contexto);
  assert.equal(s.reduccionMin, 0);
  assert.equal(s.co2Max, TOTAL_FUENTE_KG);
  assert.equal(s.alcanzaMeta, false);
  assert.equal(s.paybackMasLargo, null);
});

test('free cooling + virtualización + solar supera la meta y el beneficio consolidado (> 160 000 kg)', () => {
  const s = simularEscenario(ACCIONES, ['freecooling', 'virtualizacion', 'solar'], contexto);
  assert.equal(s.reduccionMin, 82400 + 30000 + 73500);
  assert.equal(s.reduccionMax, 82400 + 50000 + 73500);
  assert.ok(s.reduccionMin > 160000);
  assert.ok(s.alcanzaMeta);
  assert.equal(s.paybackMasLargo, 8);
  assert.equal(s.inversionTotal, null, 'la fuente no publica montos de inversión');
});

test('solo virtualización no alcanza la meta del 15 %', () => {
  const s = simularEscenario(ACCIONES, ['virtualizacion'], contexto);
  assert.equal(s.alcanzaMeta, false);
  assert.equal(s.paybackMasLargo, 2);
});

test('progreso de KPI acotado entre 0 y 1, para metas que suben o bajan', () => {
  assert.equal(progresoKpi(1.8, 1.45, 1.8), 0);
  assert.equal(progresoKpi(1.8, 1.45, 1.45), 1);
  assert.equal(progresoKpi(0, 100, 50), 0.5);
  assert.equal(progresoKpi(0, 100, 150), 1);
});

test('formato de número con espacio fino y coma decimal', async () => {
  const { formatoNumero } = await import('../js/calculos.js');
  assert.equal(formatoNumero(490014), '490 014');
  assert.equal(formatoNumero(1.8, 1), '1,8');
  assert.equal(formatoNumero(-1234.5, 1), '−1 234,5');
  assert.equal(formatoNumero(999), '999');
});
