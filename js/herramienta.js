// Interfaz de la superherramienta. La lógica vive en calculadora.js (funciones puras).
import {
  CATALOGO, EJEMPLO_OFICINA, porIdCatalogo, nuevaFila, normalizarFila, calcularFila, calcularTotal,
  potenciaEditada, equivalencias, nivelHud, posicionMedidor, estimarEquipo, textoCompartir,
  MEDIDOR_MIN, MEDIDOR_MAX,
} from './calculadora.js';
import { TOTAL_FUENTE_KG } from './datos.js';
import { formatoNumero as fmt } from './calculos.js';

const $ = (s) => document.querySelector(s);
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const estado = { filas: [], esEjemplo: true, nivelPrevio: null, mostrado: 0 };

/* ---------- Medidor: marcas fijas ---------- */
const CX = 120, CY = 120, R = 100;
const punto = (p, r) => {
  const ang = Math.PI * (1 - p);
  return [CX + r * Math.cos(ang), CY - r * Math.sin(ang)];
};

function dibujarMarcas() {
  const etiquetas = ['10', '100', '1k', '10k', '100k', '1M'];
  const decadas = Math.log10(MEDIDOR_MAX / MEDIDOR_MIN);
  let svg = '';
  etiquetas.forEach((t, i) => {
    const p = i / decadas;
    const [x1, y1] = punto(p, R - 13);
    const [x2, y2] = punto(p, R + 13);
    const [tx, ty] = punto(p, R + 24);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${tx}" y="${ty + 3}">${t}</text>`;
  });
  $('#medidor-marcas').innerHTML = svg;
  const p = posicionMedidor(TOTAL_FUENTE_KG);
  const [a1, b1] = punto(p, R - 16);
  const [a2, b2] = punto(p, R + 16);
  $('#medidor-dc').innerHTML = `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}"/><text x="${a2 - 4}" y="${b2 - 6}">data center</text>`;
}

/* ---------- Chips para añadir ---------- */
function dibujarChips() {
  $('#chips').innerHTML = CATALOGO.map((c) => `
    <button class="chip" type="button" data-tipo="${c.id}" aria-label="Añadir ${c.nombre}${c.potenciaW ? `, ${c.potenciaW} vatios` : ', sin potencia en la fuente'}">
      + ${c.nombre} <small>${c.potenciaW ? `${c.potenciaW} W` : '? W'}</small>
    </button>`).join('');
}

/* ---------- Filas ---------- */
function textoFuente(f) {
  const c = porIdCatalogo(f.tipo);
  if (!c.fuente) return '<span class="chip-fuente sin">Sin dato en la fuente: escribe la potencia de su etiqueta</span>';
  if (potenciaEditada(f)) return `<span class="chip-fuente editada">Potencia editada por ti (fuente: ${c.potenciaW} W)</span>`;
  return `<span class="chip-fuente">Fuente: ${c.fuente}</span>`;
}

function htmlFila(f, i) {
  const c = porIdCatalogo(f.tipo);
  const id = `f${i}`;
  return `
  <li class="fila" data-i="${i}">
    <div class="fila-cab">
      <h3 id="${id}-n">${c.nombre}</h3>
      <span data-fuente>${textoFuente(f)}</span>
      ${f.medido ? `<span class="nota-medida">Estimación: «medir este equipo»</span>` : ''}
      <button class="quitar" type="button" data-acc="quitar" aria-label="Quitar ${c.nombre}">Quitar</button>
    </div>
    <div class="fila-campos">
      <div class="campo">
        <span id="${id}-c">Cantidad</span>
        <div class="paso">
          <button type="button" data-acc="menos" aria-label="Una unidad menos de ${c.nombre}">−</button>
          <input type="number" inputmode="numeric" min="0" max="9999" step="1" value="${f.cantidad}" data-campo="cantidad" aria-labelledby="${id}-c ${id}-n">
          <button type="button" data-acc="mas" aria-label="Una unidad más de ${c.nombre}">+</button>
        </div>
      </div>
      <label class="campo campo-horas">
        <span class="rotulo"><span>Horas/día</span><output data-horas>${fmt(f.horasDia, f.horasDia % 1 ? 1 : 0)} h</output></span>
        <input type="range" min="0" max="24" step="0.5" value="${f.horasDia}" data-campo="horasDia" aria-label="Horas de uso al día de ${c.nombre}">
      </label>
      <label class="campo">Vatios c/u
        <input type="number" inputmode="decimal" min="0" max="100000" step="1" value="${f.potenciaW ?? ''}" placeholder="etiqueta" data-campo="potenciaW">
      </label>
    </div>
    <p class="fila-res" data-res></p>
  </li>`;
}

function dibujarFilas() {
  $('#filas').innerHTML = estado.filas.map(htmlFila).join('');
  $('#vacio').hidden = estado.filas.length > 0;
  actualizar();
}

function pintarResultadoFila(li, f) {
  const r = calcularFila(f);
  li.querySelector('[data-res]').innerHTML = r.completa
    ? `<b>${fmt(r.co2, r.co2 < 10 ? 1 : 0)}</b><span>kg CO₂/año</span>`
    : '<span class="falta">Falta la potencia</span>';
}

/* ---------- HUD ---------- */
function animarNumero(el, desde, hasta) {
  if (movimientoReducido || Math.abs(hasta - desde) < 1) { el.textContent = fmt(hasta); return; }
  const t0 = performance.now();
  const dur = 450;
  const paso = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(desde + (hasta - desde) * (1 - (1 - p) ** 3));
    if (p < 1 && estado.mostrado === hasta) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

function actualizar() {
  document.querySelectorAll('#filas .fila').forEach((li) => pintarResultadoFila(li, estado.filas[Number(li.dataset.i)]));
  const t = calcularTotal(estado.filas);
  const previo = estado.mostrado;
  estado.mostrado = t.co2;
  animarNumero($('#total-co2'), previo, t.co2);
  $('#total-kwh').textContent = fmt(t.kwh);
  $('#mini-co2').textContent = fmt(t.co2);

  const p = posicionMedidor(t.co2);
  $('#medidor-valor').setAttribute('stroke-dasharray', `${(p * 100).toFixed(2)} 100`);
  $('#aguja').style.transform = `rotate(${(-90 + p * 180).toFixed(2)}deg)`;

  const nv = nivelHud(t.co2);
  $('#nivel-n').textContent = nv.n;
  $('#mini-n').textContent = nv.n;
  $('#nivel-nombre').textContent = nv.nombre;
  $('#xp-relleno').style.width = `${(nv.progreso * 100).toFixed(1)}%`;
  $('#xp-texto').textContent = nv.siguiente
    ? `${fmt(nv.progreso * 100)} % hacia NV ${nv.siguiente.n} · ${nv.siguiente.nombre} (${fmt(nv.siguiente.desde)} kg)`
    : 'Nivel máximo: escala de un data center';
  if (estado.nivelPrevio !== null && nv.n !== estado.nivelPrevio) {
    const ono = $('#hud-ono');
    ono.textContent = nv.n > estado.nivelPrevio ? '¡FSSSH! ▲' : '¡PFF! ▼';
    ono.classList.remove('sube');
    void ono.offsetWidth; // reinicia la animación
    ono.classList.add('sube');
  }
  estado.nivelPrevio = nv.n;

  const eq = equivalencias(t.co2, t.kwh);
  $('#eq-vehiculos').textContent = fmt(eq.vehiculos, eq.vehiculos < 10 ? 2 : 0);
  $('#eq-hogares').textContent = fmt(eq.hogares, eq.hogares < 10 ? 1 : 0);
  $('#eq-dc').textContent = `${fmt(eq.pctDataCenter * 100, eq.pctDataCenter < 0.1 ? 2 : 0)} %`;

  const sello = $('#sello');
  sello.textContent = estado.esEjemplo ? 'Ejemplo: pequeña oficina' : 'Tu cálculo';
  sello.classList.toggle('propio', !estado.esEjemplo);
  $('#hud').setAttribute('aria-label', `${fmt(t.co2)} kilos de CO₂ al año, nivel ${nv.n}`);
}

function marcarPropio() { estado.esEjemplo = false; }

/* ---------- Eventos ---------- */
function iniciarEventos() {
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    estado.filas.push(nuevaFila(b.dataset.tipo));
    marcarPropio();
    dibujarFilas();
    const ultima = $('#filas').lastElementChild;
    ultima?.querySelector(estado.filas.at(-1).potenciaW === null ? '[data-campo="potenciaW"]' : '[data-campo="cantidad"]').focus({ preventScroll: true });
    ultima?.scrollIntoView({ block: 'nearest', behavior: movimientoReducido ? 'auto' : 'smooth' });
  });

  $('#filas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-acc]');
    if (!b) return;
    const li = b.closest('.fila');
    const i = Number(li.dataset.i);
    const f = estado.filas[i];
    marcarPropio();
    if (b.dataset.acc === 'quitar') {
      estado.filas.splice(i, 1);
      dibujarFilas();
      const sig = $('#filas').children[Math.min(i, estado.filas.length - 1)];
      (sig?.querySelector('[data-acc="quitar"]') ?? $('#chips .chip')).focus();
      return;
    }
    f.cantidad = normalizarFila({ ...f, cantidad: f.cantidad + (b.dataset.acc === 'mas' ? 1 : -1) }).cantidad;
    li.querySelector('[data-campo="cantidad"]').value = f.cantidad;
    actualizar();
  });

  $('#filas').addEventListener('input', (e) => {
    const campo = e.target.dataset.campo;
    if (!campo) return;
    const li = e.target.closest('.fila');
    const f = estado.filas[Number(li.dataset.i)];
    const v = e.target.value;
    if (campo === 'potenciaW') f.potenciaW = v === '' ? null : normalizarFila({ ...f, potenciaW: v }).potenciaW;
    else f[campo] = normalizarFila({ ...f, [campo]: v === '' ? 0 : v })[campo];
    if (campo === 'horasDia') li.querySelector('[data-horas]').textContent = `${fmt(f.horasDia, f.horasDia % 1 ? 1 : 0)} h`;
    li.querySelector('[data-fuente]').innerHTML = textoFuente(f);
    marcarPropio();
    actualizar();
  });

  $('#ejemplo').addEventListener('click', () => { cargarEjemplo(); $('#medicion').textContent = ''; });
  $('#vaciar').addEventListener('click', () => {
    estado.filas = [];
    marcarPropio();
    dibujarFilas();
    $('#chips .chip').focus();
  });
  $('#medir').addEventListener('click', medirEquipo);
  $('#compartir').addEventListener('click', compartir);
}

function cargarEjemplo() {
  estado.filas = EJEMPLO_OFICINA.map((f) => nuevaFila(f.tipo, f));
  estado.esEjemplo = true;
  dibujarFilas();
}

/* ---------- Medir este equipo (estimación honesta) ---------- */
async function medirEquipo() {
  const salida = $('#medicion');
  let bateria = null;
  try {
    if (typeof navigator.getBattery === 'function') {
      const b = await navigator.getBattery();
      bateria = { level: b.level, charging: b.charging, chargingTime: b.chargingTime, dischargingTime: b.dischargingTime };
    }
  } catch { bateria = null; }
  const nucleos = Number(navigator.hardwareConcurrency) || null;
  const est = estimarEquipo({ nucleos, bateria });
  const c = porIdCatalogo(est.tipo);
  estado.filas.push(nuevaFila(est.tipo, { medido: true }));
  marcarPropio();
  dibujarFilas();
  const detectado = est.datos.length ? `Detectado: ${est.datos.join(', ')}. ` : '';
  salida.textContent = `Estimación. ${detectado}${est.motivo} El navegador no puede medir vatios: se añadió «${c.nombre}» con ${c.potenciaW} W y ${c.horasDia} h/día, los valores del caso de estudio para ese tipo.`;
}

/* ---------- Compartir ---------- */
async function compartir() {
  const t = calcularTotal(estado.filas);
  const url = location.href.split('#')[0];
  const texto = textoCompartir({ co2: t.co2, kwh: t.kwh, filas: estado.filas, url }, fmt);
  const salida = $('#estado-compartir');
  const manual = $('#copia-manual');
  let ok = false;
  try {
    await navigator.clipboard.writeText(texto);
    ok = true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
  }
  if (ok) {
    manual.hidden = true;
    salida.textContent = '¡CLIC! Copiado';
  } else {
    manual.hidden = false;
    manual.value = texto;
    manual.select();
    salida.textContent = 'Cópialo a mano:';
  }
}

/* En móvil el HUD va debajo de la lista: una barra fija muestra el total mientras el HUD no se ve. */
function iniciarMiniHud() {
  const mini = $('#mini-hud');
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([en]) => mini.classList.toggle('oculto', en.isIntersecting), { threshold: 0.15 }).observe($('#hud'));
}

dibujarMarcas();
dibujarChips();
iniciarMiniHud();
iniciarEventos();
cargarEjemplo();
