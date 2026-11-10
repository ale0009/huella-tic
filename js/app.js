// Interfaz de "Huella TIC": pinta las secciones a partir de datos.js y usa calculos.js.
// Todo el contenido viene de datos estáticos del propio repositorio (no hay entrada externa).
import {
  EQUIPOS, FACTOR_EMISION, TOTAL_FUENTE_KG, VEHICULOS_EQUIVALENTES, CATEGORIAS, MATERIALES, ESCALA, ASPECTOS,
  RAEE_CHECKLIST, RAEE_VEREDICTO, OBJETIVOS, META_REDUCCION_CO2, AHORRO_APAGADO, ACCIONES, KPIS, ODS, PHVA,
  OBSOLESCENCIA_FUENTE, BENEFICIO_CONSOLIDADO,
} from './datos.js';
import {
  huellaTotal, distribucionPorCategoria, significancia, nivelSignificancia, porcentajeObsoleto,
  reduccionAccion, simularEscenario, paybackSimple, kwhAnual, formatoNumero as fmt,
} from './calculos.js';

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Menú y navegación ---------- */
function iniciarMenu() {
  const boton = $('.menu-boton');
  const menu = $('#menu');
  boton.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('abierto')) { menu.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); boton.focus(); }
  });
  // Marca el capítulo visible en el menú
  const enlaces = [...menu.querySelectorAll('a')];
  const obs = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      if (!en.isIntersecting) continue;
      for (const a of enlaces) {
        if (a.getAttribute('href') === `#${en.target.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach((s) => obs.observe(s));
}

/* ---------- 1. Splash: contador ---------- */
function iniciarSplash() {
  const n = $('[data-contador]');
  const final = Number(n.dataset.final);
  if (movimientoReducido) return;
  const inicio = performance.now();
  const dur = 1400;
  const paso = (t) => {
    const p = Math.min(1, (t - inicio) / dur);
    n.textContent = String(Math.round(final * (1 - (1 - p) ** 3)));
    if (p < 1) requestAnimationFrame(paso);
  };
  n.textContent = '0';
  requestAnimationFrame(paso);
}

/* ---------- 2. PHVA: pestañas accesibles ---------- */
function iniciarPhva() {
  const lista = $('.phva-pestanas');
  const panel = $('#phva-panel');
  const botones = PHVA.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'phva-pestana';
    b.id = `pestana-${f.letra}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'phva-panel');
    b.innerHTML = `<span class="phva-letra" aria-hidden="true">${f.letra}</span><span><span class="phva-nombre">${f.nombre}</span><br><span class="phva-clausulas">${f.clausulas}</span></span>`;
    b.addEventListener('click', () => seleccionar(i));
    lista.append(b);
    return b;
  });
  function seleccionar(i, foco = false) {
    botones.forEach((b, j) => {
      b.setAttribute('aria-selected', String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    const f = PHVA[i];
    panel.setAttribute('aria-labelledby', botones[i].id);
    const siguiente = PHVA[(i + 1) % PHVA.length];
    panel.innerHTML = `<h3>${f.letra} · ${f.nombre} <small class="pie">(${f.clausulas}: ${f.resumen})</small></h3>
      <p>Lo que hizo el diagnóstico en esta fase:</p>
      <ul>${f.hizo.map((h) => `<li>${h}</li>`).join('')}</ul>
      <p class="phva-flecha">Siguiente viñeta: ${siguiente.letra} · ${siguiente.nombre} &rarr;</p>`;
    if (foco) botones[i].focus();
  }
  lista.addEventListener('keydown', (e) => {
    const actual = botones.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const mapa = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in mapa) { e.preventDefault(); seleccionar((actual + mapa[e.key] + botones.length) % botones.length, true); }
    if (e.key === 'Home') { e.preventDefault(); seleccionar(0, true); }
    if (e.key === 'End') { e.preventDefault(); seleccionar(botones.length - 1, true); }
  });
  seleccionar(0);
}

/* ---------- 3. Calculadora ---------- */
const estadoCalc = { equipos: EQUIPOS.map((e) => ({ ...e })), factor: FACTOR_EMISION };

function iniciarCalculadora() {
  const tbody = $('#filas-calc');
  tbody.innerHTML = estadoCalc.equipos.map((e) => `
    <tr data-id="${e.id}" class="${e.categoria === 'enfriamiento' ? 'fila-enfriamiento' : ''}">
      <td><span class="equipo-nombre">${e.nombre}</span><span class="equipo-tipo">${e.tipo} · ${CATEGORIAS[e.categoria].nombre}</span></td>
      <td data-etiqueta="Unidades"><input type="number" min="0" max="2000" step="1" data-campo="unidades" value="${e.unidades}" aria-label="Unidades de ${e.corto}"></td>
      <td data-etiqueta="Horas/día"><span class="horas"><input type="range" min="0" max="24" step="1" data-campo="horasDia" value="${e.horasDia}" aria-label="Horas de uso al día de ${e.corto}"><output>${e.horasDia}</output></span></td>
      <td data-etiqueta="kW/unidad"><input type="number" min="0" max="50" step="0.005" data-campo="kw" value="${e.potenciaW / 1000}" aria-label="Potencia en kilovatios por unidad de ${e.corto}"></td>
      <td data-etiqueta="kWh/año" class="num" data-salida="kwh"></td>
      <td data-etiqueta="kg CO₂/año" class="num co2"><span data-salida="co2"></span><span class="mini-barra"></span></td>
    </tr>`).join('');

  tbody.addEventListener('input', (ev) => {
    const input = ev.target;
    const fila = input.closest('tr');
    const eq = estadoCalc.equipos.find((x) => x.id === fila.dataset.id);
    const v = Math.max(0, Number(input.value) || 0);
    if (input.dataset.campo === 'unidades') eq.unidades = v;
    if (input.dataset.campo === 'horasDia') { eq.horasDia = Math.min(24, v); fila.querySelector('output').textContent = eq.horasDia; }
    if (input.dataset.campo === 'kw') eq.potenciaW = v * 1000;
    pintarCalculadora();
  });
  $('#factor').addEventListener('input', (ev) => {
    estadoCalc.factor = Math.max(0, Number(ev.target.value) || 0);
    pintarCalculadora();
  });
  $('#restaurar').addEventListener('click', () => {
    estadoCalc.equipos = EQUIPOS.map((e) => ({ ...e }));
    estadoCalc.factor = FACTOR_EMISION;
    $('#factor').value = String(FACTOR_EMISION);
    for (const e of estadoCalc.equipos) {
      const fila = tbody.querySelector(`tr[data-id="${e.id}"]`);
      fila.querySelector('[data-campo="unidades"]').value = e.unidades;
      fila.querySelector('[data-campo="horasDia"]').value = e.horasDia;
      fila.querySelector('output').textContent = e.horasDia;
      fila.querySelector('[data-campo="kw"]').value = e.potenciaW / 1000;
    }
    pintarCalculadora();
  });
  pintarCalculadora();
}

function pintarCalculadora() {
  const { porEquipo, totalKwh, totalCo2 } = huellaTotal(estadoCalc.equipos, estadoCalc.factor);
  const maxCo2 = Math.max(...porEquipo.map((p) => p.co2), 1);
  for (const p of porEquipo) {
    const fila = document.querySelector(`#filas-calc tr[data-id="${p.id}"]`);
    fila.querySelector('[data-salida="kwh"]').textContent = fmt(p.kwh);
    fila.querySelector('[data-salida="co2"]').textContent = fmt(p.co2);
    fila.querySelector('.mini-barra').style.setProperty('--w', `${(p.co2 / maxCo2) * 100}%`);
  }
  $('#total-co2').textContent = fmt(totalCo2);
  $('#total-kwh').textContent = fmt(totalKwh);
  $('.formula-factor').textContent = fmt(estadoCalc.factor, 3);
  const dif = (totalCo2 - TOTAL_FUENTE_KG) / TOTAL_FUENTE_KG;
  const vehiculos = (totalCo2 / TOTAL_FUENTE_KG) * VEHICULOS_EQUIVALENTES;
  $('#total-diferencia').textContent = Math.abs(dif) < 0.001
    ? `Coincide con el total de la fuente (${fmt(TOTAL_FUENTE_KG)} kg; diferencia por redondeo < 0,01 %). ≈ ${fmt(vehiculos)} vehículos a gasolina.`
    : `${dif > 0 ? '+' : '−'}${fmt(Math.abs(dif) * 100, 1)} % frente al total de la fuente (${fmt(TOTAL_FUENTE_KG)} kg). ≈ ${fmt(vehiculos)} vehículos a gasolina.`;

  const dist = distribucionPorCategoria(estadoCalc.equipos, estadoCalc.factor);
  const barra = $('#barra-distribucion');
  barra.innerHTML = dist.map((d) => `<span style="flex-basis:${(d.pct * 100).toFixed(2)}%;background:${CATEGORIAS[d.categoria].color}" title="${CATEGORIAS[d.categoria].nombre}: ${fmt(d.pct * 100, 1)} %"></span>`).join('');
  barra.setAttribute('aria-label', `Distribución de la huella: ${dist.map((d) => `${CATEGORIAS[d.categoria].nombre} ${fmt(d.pct * 100, 1)} %`).join(', ')}`);
  $('#leyenda-distribucion').innerHTML = dist.map((d) => `<li><span class="muestra" style="background:${CATEGORIAS[d.categoria].color}"></span>${CATEGORIAS[d.categoria].nombre}<span class="pct">${fmt(d.pct * 100, 1)} %</span></li>`).join('');

  // La onomatopeya del enfriamiento crece o se encoge con su peso en la huella
  const enf = dist.find((d) => d.categoria === 'enfriamiento')?.pct ?? 0;
  $('.onomato-zumb').style.setProperty('--zumb', String(0.6 + enf * 1.0));
}

/* ---------- 4. Matriz de aspectos e impactos ---------- */
function iniciarMatriz() {
  const mapa = $('#mapa-calor');
  const nombresP = { 3: 'Alta (3)', 2: 'Media (2)', 1: 'Baja (1)' };
  const nombresS = { 1: 'Leve (1)', 2: 'Moderada (2)', 3: 'Grave (3)' };
  let html = '';
  for (const p of [3, 2, 1]) {
    html += `<div class="mapa-eje mapa-eje-y">${nombresP[p]}</div>`;
    for (const s of [1, 2, 3]) {
      const v = significancia(p, s);
      const nivel = nivelSignificancia(v);
      const chips = ASPECTOS.filter((a) => a.p === p && a.s === s)
        .map((a) => `<button type="button" class="chip" data-aspecto="${a.id}" aria-pressed="false">${a.proceso}</button>`).join('');
      html += `<div class="mapa-celda nivel-${nivel}" role="group" aria-label="Probabilidad ${nombresP[p]}, severidad ${nombresS[s]}: significancia ${v}, nivel ${ESCALA[nivel].nombre}">${chips}<span class="valor" aria-hidden="true">${v}</span></div>`;
    }
  }
  html += '<div></div>' + [1, 2, 3].map((s) => `<div class="mapa-eje">${nombresS[s]}</div>`).join('');
  mapa.innerHTML = html;
  mapa.insertAdjacentHTML('beforebegin', '<p class="pie">Filas: probabilidad · Columnas: severidad</p>');

  $('#semaforo').innerHTML = Object.entries(ESCALA).map(([k, e]) =>
    `<li><span class="etiqueta nivel-${k}">${e.color} ${e.rango}</span><span><strong>${e.nombre}:</strong> ${e.accion}</span></li>`).join('');

  mapa.addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    mapa.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    mostrarAspecto(chip.dataset.aspecto);
  });
  mostrarAspecto('dc');
  mapa.querySelector('[data-aspecto="dc"]').setAttribute('aria-pressed', 'true');
}

function mostrarAspecto(id) {
  const a = ASPECTOS.find((x) => x.id === id);
  const v = significancia(a.p, a.s);
  const nivel = nivelSignificancia(v);
  const discrepa = !a.etiquetaFuente.toUpperCase().startsWith(ESCALA[nivel].nombre.split(' ')[0]);
  $('#detalle-aspecto').innerHTML = `
    <span class="insignia nivel-${nivel}">${ESCALA[nivel].nombre} · ${v}</span>
    <h3>${a.proceso}</h3>
    <dl>
      <div><dt>Aspecto (causa)</dt><dd>${a.aspecto}</dd></div>
      <div><dt>Impacto (efecto)</dt><dd>${a.impacto}</dd></div>
      <div><dt>Probabilidad × Severidad</dt><dd>${a.p} × ${a.s} = <strong>${v}</strong></dd></div>
      <div><dt>Acción requerida</dt><dd>${ESCALA[nivel].accion}</dd></div>
    </dl>
    ${discrepa ? `<p class="aviso">La fuente rotula este aspecto como «${a.etiquetaFuente}», pero con su propia escala un 6 es MEDIO. El mapa respeta la escala; ver la fe de erratas.</p>` : ''}`;
}

/* ---------- 5. Inventario ---------- */
function iniciarInventario() {
  const max = Math.max(...EQUIPOS.map((e) => e.unidades));
  const orden = [...EQUIPOS].sort((a, b) => b.unidades - a.unidades);
  $('#grafico-inventario').innerHTML = orden.map((e) => `
    <li>
      <span class="nombre">${e.corto}<small>${e.tipo} · ${e.anioAdquisicion} (${e.antiguedad} años)</small></span>
      <span class="pista"><span class="barra ${e.obsoleto ? 'obsoleto' : 'vigente'}" style="--w:${(e.unidades / max) * 100}%"></span>
      <span class="cuenta">${e.unidades}${e.obsoleto ? ' · OBSOLETO' : ''}</span></span>
    </li>`).join('');
  const total = EQUIPOS.reduce((s, e) => s + e.unidades, 0);
  const obs = EQUIPOS.filter((e) => e.obsoleto).reduce((s, e) => s + e.unidades, 0);
  $('.obsoleto-cifra span').textContent = String(Math.round(OBSOLESCENCIA_FUENTE * 100));
  $('#obsoleto-nota').innerHTML = `Dato reportado por la fuente. Con la tabla de inventario: ${obs} de ${total} unidades (${fmt(porcentajeObsoleto(EQUIPOS) * 100)} %) y ${EQUIPOS.filter((e) => e.obsoleto).length} de ${EQUIPOS.length} tipos. <a href="#titulo-erratas">Ver fe de erratas</a>.`;
  $('#materiales').innerHTML = MATERIALES.map((m) => `
    <li class="material">
      <span class="material-simbolo" aria-hidden="true"><span>${m.simbolo}</span></span>
      <div><h4>${m.nombre}</h4><p class="donde">${m.donde}</p><p>${m.impacto}</p></div>
    </li>`).join('');
}

/* ---------- 6. RAEE ---------- */
function iniciarRaee() {
  const etiquetas = { cumple: 'Cumple', parcial: 'Parcial', no: 'Sin evidencia', pendiente: 'Pendiente' };
  $('#veredicto').textContent = RAEE_VEREDICTO;
  $('#checklist').innerHTML = RAEE_CHECKLIST.map((c) => `
    <li>
      <span class="estado estado-${c.estado}"><span>${etiquetas[c.estado]}</span></span>
      <div><span class="norma">${c.norma}</span><p class="requisito">${c.requisito}</p><p class="nota">${c.nota}</p></div>
    </li>`).join('');
  const cuenta = (k) => RAEE_CHECKLIST.filter((c) => c.estado === k).length;
  $('#raee-resumen').textContent = `${cuenta('cumple')} cumplen · ${cuenta('parcial')} parcial · ${cuenta('no')} sin evidencia · ${cuenta('pendiente')} pendientes.`;
}

/* ---------- 7. Simulador de escenarios ---------- */
const ESCALA_BARRA = 0.45; // la barra llena representa −45 %
const contextoSim = { equipos: EQUIPOS, factor: FACTOR_EMISION, ahorroApagado: AHORRO_APAGADO, base: TOTAL_FUENTE_KG, metaReduccion: META_REDUCCION_CO2 };

function textoReduccion(a) {
  const r = reduccionAccion(a, contextoSim);
  if (!r.cuantificada) return 'No cuantificada';
  if (r.min === r.max) return `${a.prefijo ? a.prefijo + ' ' : ''}${fmt(r.min)} kg`;
  return `${fmt(r.min)}–${fmt(r.max)} kg`;
}

function iniciarEscenarios() {
  $('#lista-acciones').innerHTML = ACCIONES.map((a) => `
    <label class="accion">
      <input type="checkbox" value="${a.id}">
      <span class="interruptor" aria-hidden="true"></span>
      <span><span class="accion-nombre">${a.nombre}</span><span class="accion-detalle">${a.detalle}</span></span>
      <span class="accion-valor">${textoReduccion(a)}<small>CO₂/año · payback ${a.paybackTexto}</small></span>
    </label>`).join('');
  $('#lista-acciones').addEventListener('change', pintarEscenario);
  $('#meta-marca').style.setProperty('--pos', `${(META_REDUCCION_CO2 / ESCALA_BARRA) * 100}%`);
  pintarEscenario();

  const calcPb = () => {
    const inv = Number($('#pb-inversion').value);
    const ah = Number($('#pb-ahorro').value);
    const out = $('#pb-resultado');
    if (!inv || !ah) { out.textContent = 'Payback simple = inversión ÷ ahorro anual.'; return; }
    const pb = paybackSimple(inv, ah);
    out.textContent = Number.isFinite(pb) ? `Payback simple: ${fmt(pb, 1)} años.` : 'Sin ahorro no hay retorno.';
  };
  $('#pb-inversion').addEventListener('input', calcPb);
  $('#pb-ahorro').addEventListener('input', calcPb);
}

function pintarEscenario() {
  const ids = [...document.querySelectorAll('#lista-acciones input:checked')].map((i) => i.value);
  const r = simularEscenario(ACCIONES, ids, contextoSim);
  $('#esc-reduccion').textContent = r.reduccionMin === r.reduccionMax
    ? `${fmt(r.reduccionMin)} kg`
    : `${fmt(r.reduccionMin)}–${fmt(r.reduccionMax)} kg`;
  const pct = r.pctMin;
  $('#meta-relleno').style.width = `${Math.min(100, (pct / ESCALA_BARRA) * 100)}%`;
  $('#meta-barra').setAttribute('aria-label', `Reducción del ${fmt(r.pctMin * 100, 1)} % frente a una meta del 15 %`);
  const meta = $('#esc-meta');
  const rangoPct = r.pctMin === r.pctMax ? `${fmt(r.pctMin * 100, 1)} %` : `${fmt(r.pctMin * 100, 1)}–${fmt(r.pctMax * 100, 1)} %`;
  if (r.activas === 0) { meta.textContent = 'Activa una o más acciones.'; meta.classList.remove('logrado'); }
  else if (r.alcanzaMeta) { meta.textContent = `−${rangoPct}: cumple la meta del objetivo 1 (≤ ${fmt(r.meta)} kg).`; meta.classList.add('logrado'); }
  else if (r.alcanzaMetaEnMejorCaso) { meta.textContent = `−${rangoPct}: solo cumple la meta en el mejor caso.`; meta.classList.remove('logrado'); }
  else { meta.textContent = `−${rangoPct}: aún no llega al −15 %.`; meta.classList.remove('logrado'); }
  $('#esc-co2').textContent = r.co2Min === r.co2Max ? `${fmt(r.co2Max)} kg/año` : `${fmt(r.co2Min)}–${fmt(r.co2Max)} kg/año`;
  $('#esc-payback').textContent = r.paybackMasLargo == null ? '—' : r.paybackMasLargo === 0 ? 'Inmediato' : `~${r.paybackMasLargo} años`;
  $('#esc-inversion').textContent = r.activas === 0 ? '—' : (r.inversionTotal == null ? 'No publicada (montos anonimizados en la fuente)' : `${fmt(r.inversionTotal)} USD`);
}

/* ---------- 8. KPI, objetivos, ODS y erratas ---------- */
function valorKpi(k, v) {
  if (k.unidad === '%') return `${fmt(v)} %`;
  if (k.unidad === '') return fmt(v, 2).replace(/0$/, '');
  return `${fmt(v)} ${k.unidad}`;
}

function iniciarKpi() {
  $('#objetivos').innerHTML = OBJETIVOS.map((o) => `
    <li class="objetivo"><span class="hallazgo">${o.hallazgo}</span>${o.texto}<br><span class="meta">${o.meta}</span></li>`).join('');
  $('#tablero-kpi').innerHTML = KPIS.map((k) => `
    <li class="kpi">
      <h4>${k.nombre}</h4>
      <p class="formula-kpi">${k.formula}</p>
      <div class="kpi-trayecto">
        <div class="kpi-valor kpi-base"><small>Línea base 2026</small><span>${k.baseTexto}</span></div>
        <span class="kpi-flecha" aria-hidden="true">${k.sentido === 'bajar' ? '&#8600;' : '&#8599;'}</span>
        <div class="kpi-valor kpi-meta"><small>Meta</small>${k.metaTexto}</div>
      </div>
      <p class="kpi-pie"><span>${k.frecuencia}</span><span>Objetivo numérico: ${valorKpi(k, k.meta)}</span>${k.valorIndicadores ? `<span class="errata">* §6 decía: ${k.valorIndicadores}</span>` : ''}</p>
    </li>`).join('');
  $('#ods').innerHTML = ODS.map((o) => `<li><b>ODS ${o.n}</b>${o.nombre}</li>`).join('');

  const { totalCo2 } = huellaTotal(EQUIPOS, FACTOR_EMISION);
  const ws = EQUIPOS.find((e) => e.id === 'ws');
  const total = EQUIPOS.reduce((s, e) => s + e.unidades, 0);
  const obs = EQUIPOS.filter((e) => e.obsoleto).reduce((s, e) => s + e.unidades, 0);
  const erratas = [
    '<strong>Meta de CO₂:</strong> el objetivo 1 pide −15 % (≤ 416 512 kg) y la tabla de indicadores −20 % (≤ 392 011 kg). Se usa el −15 % del objetivo, que es el compromiso formal.',
    '<strong>Plazo RAEE 100 %:</strong> el objetivo 2 dice antes de diciembre de 2027 (18 meses) y la tabla de indicadores, diciembre de 2026. Se usa diciembre de 2027.',
    '<strong>Plazo del SGA:</strong> el objetivo 3 fija el primer semestre de 2028 y la tabla de indicadores, diciembre de 2027. Se usa el plazo del objetivo.',
    `<strong>Obsolescencia:</strong> la fuente reporta 63 %, pero su propia tabla da ${obs} de ${total} unidades (${fmt((obs / total) * 100)} %) o 6 de 10 tipos (60 %). Además marca como obsoletos los routers con exactamente 4 años, aunque el criterio es «más de 4». Se muestra el 63 % como dato reportado.`,
    '<strong>Enfriamiento en la matriz:</strong> Media (2) × Grave (3) = 6 es MEDIO según la escala de la fuente, pero aparece como «ALTO 6 — CRÍTICO». El mapa usa la escala. La misma fila habla de destrucción de la capa de ozono, mientras el glosario aclara que los HFC no la dañan (su problema es el alto GWP).',
    `<strong>Redondeo:</strong> las workstations figuran con ${fmt(42008)} kWh/año; la fórmula da ${fmt(kwhAnual(ws))} (0,085 kW × 9 h × 365 × 150). Por eso el total recalculado es ${fmt(totalCo2)} kg frente a ${fmt(TOTAL_FUENTE_KG)} kg (diferencia < 0,01 %).`,
    `<strong>Equivalencia en carros:</strong> §1.3.3 dice que 490 014 kg ≈ 106 carros (≈ ${fmt(TOTAL_FUENTE_KG / VEHICULOS_EQUIVALENTES)} kg por carro al año) y §5 que ${fmt(BENEFICIO_CONSOLIDADO.kg)} kg ≈ ${BENEFICIO_CONSOLIDADO.vehiculos} carros (≈ ${fmt(BENEFICIO_CONSOLIDADO.kg / BENEFICIO_CONSOLIDADO.vehiculos)} kg). La diferencia es de ~1 %; la calculadora usa la proporción de §1.3.3, que es la de la línea base.`,
    '<strong>Inversiones:</strong> los montos en USD de la tabla de costos vienen anonimizados en la versión pública del caso; el simulador muestra reducción de CO₂ y payback, pero no inventa la inversión total.',
  ];
  $('#lista-erratas').innerHTML = erratas.map((e) => `<li>${e}</li>`).join('');
}

/* ---------- 0. Método: gráfica SVG de CO₂ por equipo ---------- */
function iniciarGraficaMetodo() {
  const svg = $('#grafica-co2');
  if (!svg) return;
  const filas = [...EQUIPOS].sort((a, b) => b.co2Fuente - a.co2Fuente);
  const max = filas[0].co2Fuente;
  const ancho = 360, izq = 104, barraMax = 180, alto = 26;
  const h = filas.length * alto + 8;
  svg.setAttribute('viewBox', `0 0 ${ancho} ${h}`);
  svg.innerHTML = filas.map((e, i) => {
    const y = 4 + i * alto;
    const w = Math.max(2, (e.co2Fuente / max) * barraMax);
    const clase = e.categoria === 'enfriamiento' ? 'g-rojo' : e.categoria === 'usuario' ? 'g-cian' : 'g-tinta';
    return `<text x="${izq - 6}" y="${y + 15}" class="g-etiqueta" text-anchor="end">${e.corto}</text>
      <rect x="${izq}" y="${y + 3}" width="${w.toFixed(1)}" height="${alto - 8}" class="${clase}"/>
      <text x="${(izq + w + 4).toFixed(1)}" y="${y + 15}" class="g-valor">${fmt(e.co2Fuente)}</text>`;
  }).join('');
  const kg = $('#kg-vehiculo');
  if (kg) kg.textContent = fmt(TOTAL_FUENTE_KG / VEHICULOS_EQUIVALENTES);
}

/* ---------- Entrada de viñetas al hacer scroll ---------- */
function iniciarApariciones() {
  if (movimientoReducido || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entradas) => {
    for (const en of entradas) if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
  }, { threshold: 0.12 });
  document.querySelectorAll('.pagina .vineta, .kpi, .material, .objetivo').forEach((el) => { el.classList.add('aparece'); obs.observe(el); });
}

iniciarMenu();
iniciarSplash();
iniciarGraficaMetodo();
iniciarPhva();
iniciarCalculadora();
iniciarMatriz();
iniciarInventario();
iniciarRaee();
iniciarEscenarios();
iniciarKpi();
iniciarApariciones();
