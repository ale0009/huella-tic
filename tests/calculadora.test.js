import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATALOGO, EJEMPLO_OFICINA, nuevaFila, normalizarFila, calcularFila, calcularTotal, potenciaEditada,
  KG_POR_VEHICULO_ANIO, KWH_POR_HOGAR_ANIO, equivalencias, nivelHud, posicionMedidor, estimarEquipo, textoCompartir,
} from '../js/calculadora.js';
import { EQUIPOS, FACTOR_EMISION, TOTAL_FUENTE_KG } from '../js/datos.js';
import { formatoNumero } from '../js/calculos.js';

const cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

test('el catálogo usa las potencias y horas de la tabla de la fuente', () => {
  const pares = { servidor: 'hpe', 'servidor-alto': 'dell', pc: 'ws', laptop: 'laptop', switch: 'switch', router: 'router', firewall: 'firewall', ups: 'ups', storage: 'storage', aire: 'cru' };
  for (const [id, ref] of Object.entries(pares)) {
    const c = CATALOGO.find((x) => x.id === id);
    const e = EQUIPOS.find((x) => x.id === ref);
    assert.equal(c.potenciaW, e.potenciaW, id);
    assert.equal(c.horasDia, e.horasDia, id);
    assert.ok(c.fuente.includes('§1.3.2'), id);
  }
});

test('el monitor no tiene potencia en la fuente: queda vacía y no suma', () => {
  const m = CATALOGO.find((c) => c.id === 'monitor');
  assert.equal(m.potenciaW, null);
  assert.equal(m.fuente, null);
  const r = calcularFila(nuevaFila('monitor', { cantidad: 3 }));
  assert.deepEqual(r, { kwh: 0, co2: 0, completa: false });
  assert.equal(calcularTotal([nuevaFila('monitor')]).incompletas, 1);
});

test('1 laptop de 45 W, 9 h/día: 147,825 kWh y ≈ 28,97 kg CO₂ al año', () => {
  const r = calcularFila(nuevaFila('laptop'));
  assert.ok(cerca(r.kwh, 147.825));
  assert.ok(cerca(r.co2, 147.825 * 0.196));
});

test('reproducir el inventario completo con la calculadora da el total de la tabla (±0,01 %)', () => {
  const pares = { hpe: 'servidor', dell: 'servidor-alto', ws: 'pc', laptop: 'laptop', switch: 'switch', router: 'router', firewall: 'firewall', ups: 'ups', storage: 'storage', cru: 'aire' };
  const filas = EQUIPOS.map((e) => nuevaFila(pares[e.id], { cantidad: e.unidades }));
  const { co2 } = calcularTotal(filas);
  assert.ok(Math.abs(co2 - TOTAL_FUENTE_KG) / TOTAL_FUENTE_KG < 0.0001);
});

test('el ejemplo de oficina suma ≈ 1 861 kg CO₂/año', () => {
  const { co2, kwh } = calcularTotal(EJEMPLO_OFICINA.map((f) => nuevaFila(f.tipo, f)));
  assert.ok(cerca(kwh, 9493.65, 1e-6));
  assert.equal(Math.round(co2), 1861);
});

test('normalizar: horas 0–24, cantidades enteras no negativas, texto basura → mínimo', () => {
  const n = normalizarFila({ tipo: 'pc', cantidad: -3.7, horasDia: 30, potenciaW: 'abc' });
  assert.equal(n.cantidad, 0);
  assert.equal(n.horasDia, 24);
  assert.equal(n.potenciaW, 0);
  assert.equal(normalizarFila({ tipo: 'monitor', cantidad: 2.4, horasDia: 5, potenciaW: '' }).potenciaW, null);
  assert.equal(normalizarFila({ tipo: 'pc', cantidad: 2.6, horasDia: 5, potenciaW: 85 }).cantidad, 3);
});

test('detecta cuándo la potencia fue editada por el visitante', () => {
  assert.equal(potenciaEditada(nuevaFila('pc')), false);
  assert.equal(potenciaEditada(nuevaFila('pc', { potenciaW: 60 })), true);
  assert.equal(potenciaEditada(nuevaFila('monitor', { potenciaW: 20 })), false);
});

test('equivalencias calculadas con las proporciones de la fuente', () => {
  assert.ok(cerca(KG_POR_VEHICULO_ANIO, 490014 / 106));
  assert.ok(cerca(KWH_POR_HOGAR_ANIO, 2920));
  const eq = equivalencias(TOTAL_FUENTE_KG, 2920 * 10);
  assert.ok(cerca(eq.vehiculos, 106));
  assert.ok(cerca(eq.hogares, 10));
  assert.ok(cerca(eq.pctDataCenter, 1));
});

test('nivel del HUD por décadas de kg CO₂', () => {
  assert.equal(nivelHud(0).n, 1);
  assert.equal(nivelHud(0).progreso, 0);
  assert.equal(nivelHud(99).n, 1);
  assert.equal(nivelHud(100).n, 2);
  assert.equal(nivelHud(1861).nombre, 'Hoguera');
  assert.equal(nivelHud(TOTAL_FUENTE_KG).n, 5);
  assert.ok(cerca(nivelHud(1000).progreso, 0));
  assert.ok(cerca(nivelHud(Math.sqrt(1000 * 10000)).progreso, 0.5));
});

test('posición del medidor logarítmico de 10 kg a 1 000 000 kg', () => {
  assert.equal(posicionMedidor(0), 0);
  assert.equal(posicionMedidor(10), 0);
  assert.ok(cerca(posicionMedidor(1000), 0.4));
  assert.equal(posicionMedidor(5e6), 1);
});

test('medir este equipo: solo deduce el tipo y lo dice con honestidad', () => {
  const sinApi = estimarEquipo({ nucleos: 8, bateria: null });
  assert.equal(sinApi.tipo, 'pc');
  assert.equal(sinApi.seguro, false);
  assert.deepEqual(sinApi.datos, ['8 hilos de CPU']);
  const descargando = estimarEquipo({ nucleos: 4, bateria: { level: 0.62, charging: false, chargingTime: Infinity, dischargingTime: 7200 } });
  assert.equal(descargando.tipo, 'laptop');
  assert.equal(descargando.seguro, true);
  const llena = estimarEquipo({ bateria: { level: 1, charging: true, chargingTime: 0, dischargingTime: Infinity } });
  assert.equal(llena.tipo, 'pc');
  assert.equal(llena.seguro, false);
});

test('el texto para compartir trae cifra, nivel, factor IDEAM y enlace', () => {
  const filas = EJEMPLO_OFICINA.map((f) => nuevaFila(f.tipo, f));
  const { co2, kwh } = calcularTotal(filas, FACTOR_EMISION);
  const t = textoCompartir({ co2, kwh, filas, url: 'https://ejemplo.test/' }, formatoNumero);
  assert.match(t, /13 equipos/);
  assert.match(t, /1 861 kg/);
  assert.match(t, /Nivel 3: Hoguera/);
  assert.match(t, /0,196/);
  assert.match(t, /IDEAM/);
  assert.match(t, /https:\/\/ejemplo\.test\//);
});
