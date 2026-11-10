// Datos del caso de estudio "Huella TIC".
// Fuente: diagnóstico ambiental ISO 14001:2015 hecho en equipo (Ingeniería de Sistemas, 2026)
// sobre un proveedor regional de servicios gestionados y data centers (empresa anonimizada).
// Cada bloque indica la sección del documento fuente de la que sale. No se inventan cifras:
// lo que la fuente no trae (p. ej. montos de inversión, que vienen tachados) se marca como null.

/** §1.3.1 — Factor de emisión de la red eléctrica nacional (IDEAM, 2023), kg CO₂ por kWh. */
export const FACTOR_EMISION = 0.196;

/** §1.3.2 — Total anual reportado en la tabla de la fuente, kg CO₂/año. */
export const TOTAL_FUENTE_KG = 490014;

/** §1.3.3 — Equivalencia reportada: vehículos a gasolina circulando un año. */
export const VEHICULOS_EQUIVALENTES = 106;

/** §1.3.3 — PUE estimado (valor central del rango 1,6–2,0 de benchmarks Tier III). */
export const PUE_BASE = 1.8;
/** Glosario — PUE de eficiencia óptima de referencia. */
export const PUE_OPTIMO = 1.2;

/** §1.1.2 — Centros de datos activos en el país. */
export const DATA_CENTERS = 6;

/** §1.2.1 — Porcentaje de activos con más de 4 años, tal como lo reporta la fuente. */
export const OBSOLESCENCIA_FUENTE = 0.63;

/** Categorías para agrupar la huella (agrupación propia para visualizar §1.3.2). */
export const CATEGORIAS = {
  enfriamiento: { nombre: 'Enfriamiento', color: 'var(--rojo)' },
  servidores: { nombre: 'Servidores', color: 'var(--tinta)' },
  energia: { nombre: 'Respaldo (UPS)', color: 'var(--gris)' },
  red: { nombre: 'Red y seguridad', color: 'var(--cian)' },
  almacenamiento: { nombre: 'Almacenamiento', color: 'var(--cian-claro)' },
  usuario: { nombre: 'Puestos de usuario', color: 'var(--trama)' },
};

/**
 * §1.2.1 (inventario y obsolescencia) + §1.3.2 (potencia, horas/día y CO₂ por equipo).
 * potenciaW: vatios por unidad · horasDia: horas de uso diario · co2Fuente: kg CO₂/año en la tabla fuente.
 */
export const EQUIPOS = [
  { id: 'hpe', nombre: 'Servidores HPE ProLiant DL380 Gen10', corto: 'HPE DL380', tipo: 'Servidor rack', categoria: 'servidores', unidades: 120, anioAdquisicion: 2020, antiguedad: 5, obsoleto: true, potenciaW: 500, horasDia: 24, co2Fuente: 103018 },
  { id: 'dell', nombre: 'Servidores Dell PowerEdge R750', corto: 'Dell R750', tipo: 'Servidor rack', categoria: 'servidores', unidades: 80, anioAdquisicion: 2022, antiguedad: 3, obsoleto: false, potenciaW: 600, horasDia: 24, co2Fuente: 82414 },
  { id: 'switch', nombre: 'Switches Cisco 9300', corto: 'Switch 9300', tipo: 'Switch L3', categoria: 'red', unidades: 45, anioAdquisicion: 2019, antiguedad: 6, obsoleto: true, potenciaW: 125, horasDia: 24, co2Fuente: 9658 },
  { id: 'router', nombre: 'Routers Cisco ASR 1001-X', corto: 'Router ASR', tipo: 'Router core', categoria: 'red', unidades: 20, anioAdquisicion: 2021, antiguedad: 4, obsoleto: true, potenciaW: 200, horasDia: 24, co2Fuente: 6868 },
  { id: 'firewall', nombre: 'Firewalls Fortinet FortiGate 1800F', corto: 'FortiGate 1800F', tipo: 'Seguridad perimetral', categoria: 'red', unidades: 12, anioAdquisicion: 2023, antiguedad: 2, obsoleto: false, potenciaW: 300, horasDia: 24, co2Fuente: 6181 },
  { id: 'ups', nombre: 'UPS APC Symmetra LX', corto: 'UPS Symmetra', tipo: 'UPS industrial', categoria: 'energia', unidades: 30, anioAdquisicion: 2018, antiguedad: 7, obsoleto: true, potenciaW: 800, horasDia: 24, co2Fuente: 41207 },
  { id: 'cru', nombre: 'Aire acondicionado de precisión Liebert CRU', corto: 'Liebert CRU', tipo: 'Enfriamiento de precisión', categoria: 'enfriamiento', unidades: 24, anioAdquisicion: 2020, antiguedad: 5, obsoleto: true, potenciaW: 5000, horasDia: 24, co2Fuente: 206035 },
  { id: 'ws', nombre: 'Workstations HP EliteDesk 800', corto: 'EliteDesk 800', tipo: 'PC de escritorio', categoria: 'usuario', unidades: 150, anioAdquisicion: 2019, antiguedad: 6, obsoleto: true, potenciaW: 85, horasDia: 9, co2Fuente: 8234 },
  { id: 'laptop', nombre: 'Laptops Dell Latitude 5520', corto: 'Latitude 5520', tipo: 'Portátil', categoria: 'usuario', unidades: 200, anioAdquisicion: 2022, antiguedad: 3, obsoleto: false, potenciaW: 45, horasDia: 9, co2Fuente: 5795 },
  { id: 'storage', nombre: 'Storage Dell EMC PowerStore', corto: 'PowerStore', tipo: 'Almacenamiento SAN', categoria: 'almacenamiento', unidades: 10, anioAdquisicion: 2023, antiguedad: 2, obsoleto: false, potenciaW: 1200, horasDia: 24, co2Fuente: 20604 },
];

/** §1.2.2 — Materiales y recursos críticos presentes en los equipos. */
export const MATERIALES = [
  { simbolo: 'Li', nombre: 'Litio', donde: 'Baterías de laptops, UPS y equipos portátiles', impacto: 'Su extracción afecta los ecosistemas hídricos de los salares sudamericanos.' },
  { simbolo: 'Co', nombre: 'Cobalto', donde: 'Baterías de iones de litio en servidores y portátiles', impacto: 'Cerca del 70 % del suministro mundial sale de un solo país, con condiciones laborales y ambientales cuestionadas.' },
  { simbolo: 'Ta', nombre: 'Tantalio', donde: 'Condensadores de alta densidad en servidores y equipos de red', impacto: 'Se extrae como coltán, mineral asociado a conflictos en África Central.' },
  { simbolo: 'TR', nombre: 'Tierras raras', donde: 'Motores de ventiladores, discos duros y componentes magnéticos', impacto: 'Neodimio, cerio y disprosio: su extracción deja grandes volúmenes de residuos levemente radiactivos.' },
  { simbolo: 'Hg', nombre: 'Mercurio', donde: 'Lámparas fluorescentes de data centers antiguos y monitores viejos', impacto: 'Tóxico persistente; contamina suelo y agua si se desecha mal.' },
  { simbolo: 'Cu', nombre: 'Cobre y aluminio', donde: 'Cableado estructurado, conectores y disipadores', impacto: 'Reciclables, pero su refinación primaria consume mucha energía.' },
];

/** §1.4 — Escala de significancia (semáforo) de la matriz de aspectos e impactos. */
export const ESCALA = {
  bajo: { rango: '1 – 3', nombre: 'BAJO', color: 'Verde', accion: 'Monitoreo periódico; no requiere acción inmediata.' },
  medio: { rango: '4 – 6', nombre: 'MEDIO', color: 'Amarillo', accion: 'Control activo; incluir en programas de mejora.' },
  alto: { rango: '7 – 9', nombre: 'ALTO / CRÍTICO', color: 'Rojo', accion: 'Intervención prioritaria; tratamiento urgente bajo el SGA.' },
};

/**
 * §1.4 — Matriz de aspectos e impactos. p = probabilidad (1–3), s = severidad (1–3).
 * etiquetaFuente: lo que escribe la fuente en la columna "Significancia" (ver fe de erratas para HVAC).
 */
export const ASPECTOS = [
  { id: 'dc', proceso: 'Operación de los 6 data centers', aspecto: 'Consumo masivo de energía y generación de calor residual', impacto: 'Aumento de emisiones de CO₂ y del calentamiento global', p: 3, s: 3, etiquetaFuente: 'ALTO 9 — CRÍTICO' },
  { id: 'hvac', proceso: 'Sistemas de enfriamiento HVAC/CRAC', aspecto: 'Uso de refrigerantes HFC y mayor consumo eléctrico', impacto: 'Destrucción de la capa de ozono y aumento del potencial de calentamiento global (GWP)', p: 2, s: 3, etiquetaFuente: 'ALTO 6 — CRÍTICO' },
  { id: 'raee', proceso: 'Reemplazo y baja de equipos TI', aspecto: 'Generación de residuos electrónicos (RAEE)', impacto: 'Contaminación de suelos y aguas subterráneas por metales pesados', p: 3, s: 3, etiquetaFuente: 'ALTO 9 — CRÍTICO' },
  { id: 'fibra', proceso: 'Red de fibra óptica', aspecto: 'Consumo de sílice y polímeros; residuos de instalación', impacto: 'Agotamiento de recursos naturales y residuos en campo', p: 2, s: 2, etiquetaFuente: 'MEDIO 4' },
  { id: 'papel', proceso: 'Impresión de documentación técnica', aspecto: 'Consumo de papel, tóner y cartuchos', impacto: 'Agotamiento forestal y residuos peligrosos (tóner)', p: 1, s: 1, etiquetaFuente: 'BAJO 1' },
  { id: 'nube', proceso: 'Servicio en nube y virtualización', aspecto: 'Más carga en servidores físicos y más consumo eléctrico', impacto: 'Aumento de la huella de carbono con cada nuevo cliente', p: 3, s: 3, etiquetaFuente: 'ALTO 9 — CRÍTICO' },
  { id: 'campo', proceso: 'Soporte técnico en campo', aspecto: 'Consumo de combustibles fósiles en desplazamientos', impacto: 'Emisión de CO₂ y NOₓ; contaminación del aire urbano', p: 2, s: 2, etiquetaFuente: 'MEDIO 4' },
  { id: 'diesel', proceso: 'Generadores diésel de emergencia', aspecto: 'Quema de diésel; emisión de gases y ruido', impacto: 'Contaminación del aire y contaminación acústica', p: 1, s: 2, etiquetaFuente: 'BAJO 2' },
];

/**
 * §1.5 (RAEE) + §7 (normativa) — Checklist de cumplimiento.
 * estado: 'cumple' | 'parcial' | 'no' (sin evidencia pública) | 'pendiente' (propuesto en el plan).
 */
export const RAEE_CHECKLIST = [
  { norma: 'ISO 27001', requisito: 'Borrado seguro y certificado de datos antes de dar de baja un equipo', estado: 'cumple', nota: 'Práctica declarada públicamente (§1.5.2).' },
  { norma: 'Ley 1672 de 2013', requisito: 'Entregar los RAEE a gestores autorizados por la autoridad ambiental', estado: 'parcial', nota: 'Usa programas de retorno de fabricantes, pero sin contratos formales con gestores RAEE (§1.5.3).' },
  { norma: 'Ley 1672 de 2013', requisito: 'Conservar certificados de disposición final de cada lote', estado: 'no', nota: 'Hallazgo crítico: no hay evidencia pública de certificados (§1.5.3).' },
  { norma: 'Resolución 851 de 2022', requisito: 'Demostrar entrega documentada a gestores RAEE certificados (gran consumidor)', estado: 'no', nota: 'Riesgo legal: sin registros, hay exposición a sanciones (§1.5.3).' },
  { norma: 'Resolución 1297 de 2010', requisito: 'Gestionar baterías y UPS como residuos peligrosos (RESPEL) con empresas autorizadas', estado: 'cumple', nota: 'Práctica declarada; el plan pide además registro de cantidades y certificados (§1.5.2, §4).' },
  { norma: 'Resolución 1512 de 2010', requisito: 'Entrega de computadores y periféricos a gestores y reporte de volúmenes', estado: 'pendiente', nota: '150 workstations y 200 laptops están sujetas; el reporte se propone en el plan (§7).' },
  { norma: 'Protocolo de Montreal', requisito: 'Disposición controlada de refrigerantes HFC por técnicos certificados', estado: 'pendiente', nota: 'Propuesto en las estrategias de residuos (§4).' },
  { norma: 'Buena práctica', requisito: 'Mantenimiento extendido para alargar la vida útil de equipos de alto valor', estado: 'cumple', nota: 'Contratos de mantenimiento preventivo para servidores, switches y UPS (§1.5.2).' },
];

/** §1.5.3 — Veredicto global de la fuente. */
export const RAEE_VEREDICTO = 'CUMPLE PARCIALMENTE';

/**
 * §2 — Objetivos específicos SMART (se usan estos valores cuando la fuente se contradice).
 */
export const OBJETIVOS = [
  { id: 1, hallazgo: 'Consumo energético excesivo (PUE 1,8 y 490 014 kg CO₂/año)', texto: 'Reducir la huella de carbono operativa al menos un 15 % frente a la línea base de 490 014 kg CO₂/año, con seguimiento trimestral (kWh × factor IDEAM), en 24 meses desde el segundo semestre de 2026.', meta: '−15 % en 24 meses' },
  { id: 2, hallazgo: 'Incumplimiento potencial de la Ley 1672 de 2013 (RAEE)', texto: 'Lograr el 100 % de trazabilidad certificada de los RAEE mediante contratos con gestores autorizados, con registro mensual de inventario, antes de diciembre de 2027 (18 meses).', meta: '100 % antes de dic. 2027' },
  { id: 3, hallazgo: 'Ausencia de Sistema de Gestión Ambiental (SGA)', texto: 'Diseñar los elementos fundacionales del SGA ISO 14001:2015 en los 6 data centers: política ambiental, identificación completa de aspectos e impactos y al menos una auditoría interna documentada, en 18 meses (primer semestre de 2028). La certificación queda como meta 2029–2030.', meta: 'Fundamentos del SGA al 1.er semestre de 2028' },
];

/** §2 Objetivo 1 — Reducción comprometida (prevalece sobre el −20 % de §6; ver fe de erratas). */
export const META_REDUCCION_CO2 = 0.15;

/** §3 — Ahorro proyectado de las políticas de apagado en puestos de usuario. */
export const AHORRO_APAGADO = 0.08;

/**
 * §3 (acciones) + §5 (costos y beneficios). Reducciones en kg CO₂/año.
 * Las inversiones vienen tachadas en la fuente ("[monto]"), por eso inversionUSD = null.
 * reduccionMin/Max = null significa "no cuantificado en la fuente".
 * calcular: 'apagado' indica que la reducción se deriva con la fórmula (8 % del consumo de usuario).
 */
export const ACCIONES = [
  { id: 'freecooling', nombre: 'Free cooling / HVAC de alta eficiencia', detalle: 'Reemplazo progresivo de los 24 equipos Liebert CRU, empezando por el data center de mayor consumo.', reduccionMin: 82400, reduccionMax: 82400, prefijo: 'hasta', paybackAnios: 5, paybackTexto: '~5 años', inversionUSD: null, onomatopeya: '¡ZUMB!' },
  { id: 'virtualizacion', nombre: 'Virtualización de servidores HPE DL380', detalle: 'Consolidar cargas para reducir un 30 % los servidores físicos activos (40–60 equipos), sin mover datos a terceros.', reduccionMin: 30000, reduccionMax: 50000, prefijo: '', paybackAnios: 2, paybackTexto: '~2 años', inversionUSD: null },
  { id: 'apagado', nombre: 'Apagado automático fuera de horario', detalle: 'Políticas de suspensión en 150 workstations y 200 laptops: ahorro proyectado del 8 % del consumo de usuario.', reduccionMin: null, reduccionMax: null, calcular: 'apagado', prefijo: '≈', paybackAnios: null, paybackTexto: 'No indicado', inversionUSD: null },
  { id: 'solar', nombre: 'Paneles solares en cubiertas', detalle: '15–20 % de energía renovable en los data centers de la capital.', reduccionMin: 73500, reduccionMax: 73500, prefijo: '≈', paybackAnios: 8, paybackTexto: '~8 años', inversionUSD: null },
  { id: 'sensores', nombre: 'Sensores inteligentes por rack', detalle: 'Temperatura y consumo en tiempo real para repartir cargas y detectar ineficiencias.', reduccionMin: null, reduccionMax: null, prefijo: '', paybackAnios: null, paybackTexto: 'No indicado', inversionUSD: null },
  { id: 'gestores', nombre: 'Contratos con gestores RAEE certificados', detalle: 'Disposición correcta del inventario obsoleto; elimina el riesgo de multas de hasta 5 000 SMLMV.', reduccionMin: null, reduccionMax: null, prefijo: '', paybackAnios: 0, paybackTexto: 'Inmediato (evita riesgo legal)', inversionUSD: null },
  { id: 'sga', nombre: 'Implementación del SGA ISO 14001', detalle: 'Marco formal de mejora continua; acceso a licitaciones y clientes con exigencias ESG.', reduccionMin: null, reduccionMax: null, prefijo: '', paybackAnios: null, paybackTexto: 'Estratégico (no monetizable directo)', inversionUSD: null },
];

/** §5 — Beneficio consolidado declarado por la fuente (kg CO₂/año) y su equivalencia. */
export const BENEFICIO_CONSOLIDADO = { kg: 160000, vehiculos: 35 };

/**
 * §6 — Indicadores de seguimiento. Donde §6 contradice a §2 se usa el valor de §2
 * y se guarda el de §6 en "valorIndicadores" para la fe de erratas.
 */
export const KPIS = [
  { id: 'pue', nombre: 'PUE', formula: 'Energía total del DC ÷ energía de equipos TI', base: 1.8, meta: 1.45, metaTexto: '≤ 1,45 en 18 meses', baseTexto: '1,8 (estimado)', frecuencia: 'Mensual', sentido: 'bajar', unidad: '' },
  { id: 'co2', nombre: 'Huella de carbono total', formula: 'kWh consumidos × 0,196 (IDEAM)', base: 490014, meta: Math.round(490014 * (1 - 0.15)), metaTexto: '−15 % (≤ 416 512 kg)', baseTexto: '490 014 kg CO₂/año', frecuencia: 'Trimestral', sentido: 'bajar', unidad: 'kg', valorIndicadores: '−20 % (≤ 392 011 kg)' },
  { id: 'raee', nombre: 'RAEE con certificado de disposición', formula: 'RAEE certificados ÷ RAEE generados × 100', base: 0, meta: 100, metaTexto: '100 % antes de dic. 2027', baseTexto: '0 % (no documentado)', frecuencia: 'Mensual', sentido: 'subir', unidad: '%', valorIndicadores: '100 % antes de dic. 2026' },
  { id: 'obsoletos', nombre: 'Equipos obsoletos gestionados', formula: 'N.º de equipos dados de baja con trazabilidad', base: 0, meta: 100, metaTexto: '100 % del inventario > 4 años', baseTexto: '0 equipos con trazabilidad', frecuencia: 'Semestral', sentido: 'subir', unidad: '%' },
  { id: 'iso', nombre: 'Avance de implementación ISO 14001', formula: 'Etapas completadas ÷ etapas del SGA × 100', base: 0, meta: 100, metaTexto: '100 % de los fundamentos al 1.er sem. 2028', baseTexto: '0 % (SGA no iniciado)', frecuencia: 'Trimestral', sentido: 'subir', unidad: '%', valorIndicadores: '100 % antes de dic. 2027' },
  { id: 'usuario', nombre: 'Consumo de workstations y laptops', formula: 'kWh consumidos por usuario al mes', base: 71573, meta: Math.round(71573 * (1 - 0.08)), metaTexto: '−8 % vs. línea base 2026', baseTexto: '71 573 kWh/año', frecuencia: 'Mensual', sentido: 'bajar', unidad: 'kWh' },
];

/** §7 — Objetivos de Desarrollo Sostenible con los que se alinea el plan. */
export const ODS = [
  { n: 7, nombre: 'Energía asequible y no contaminante' },
  { n: 12, nombre: 'Producción y consumo responsables' },
  { n: 13, nombre: 'Acción por el clima' },
];

/** §7 — PHVA aplicado al diagnóstico (mapeo propio a las cláusulas de ISO 14001:2015). */
export const PHVA = [
  { letra: 'P', nombre: 'Planear', clausulas: 'Cláusulas 4 – 6', resumen: 'Contexto, liderazgo y planificación', hizo: ['Contexto de la organización: 6 data centers, portafolio y certificaciones (sin ISO 14001).', 'Matriz de aspectos e impactos con P × S y semáforo.', 'Requisitos legales: Ley 1672 de 2013 y resoluciones RAEE.', 'Tres objetivos SMART con línea base medible.'] },
  { letra: 'H', nombre: 'Hacer', clausulas: 'Cláusulas 7 – 8', resumen: 'Apoyo y operación', hizo: ['Acciones de energía: free cooling, virtualización, apagado automático, sensores, solar.', 'Control operacional de residuos: RESPEL, refrigerantes HFC, gestores RAEE.', 'Formación y sensibilización de los colaboradores.', 'Compras con debida diligencia sobre materiales críticos.'] },
  { letra: 'V', nombre: 'Verificar', clausulas: 'Cláusula 9', resumen: 'Evaluación del desempeño', hizo: ['Seis indicadores con fórmula, frecuencia, línea base y meta.', 'Seguimiento trimestral de kWh × factor IDEAM.', 'Al menos una auditoría interna documentada.', 'Evaluación de cumplimiento legal RAEE.'] },
  { letra: 'A', nombre: 'Actuar', clausulas: 'Cláusula 10', resumen: 'Mejora', hizo: ['Tratar los hallazgos críticos como no conformidades.', 'Revisar cada año los impactos de nivel bajo.', 'Extender la gestión de energía (ISO 50001) al país.', 'Mejora continua hacia la certificación 2029–2030.'] },
];

/** §1.3.3 — "Cada unidad de enfriamiento Liebert CRU consume el equivalente a lo que gastan 15 hogares colombianos en un año". */
export const HOGARES_POR_CRU = 15;
