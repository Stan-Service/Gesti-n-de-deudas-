/* =========================
   Persistencia y Estado
   ========================= */
const STORAGE_KEYS = {
  CLIENTES: "clientes_v2",
  CONFIG: "configGeneral_v2",
};

let clientes = readLS(STORAGE_KEYS.CLIENTES, []);
let configGeneral = readLS(STORAGE_KEYS.CONFIG, {
  tasaUsdCup: 250,
  tasaCupTrf: 1.10,
});

function readLS(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}
function writeLS(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

/* =========================
   DOM Refs
   ========================= */
const clientesContainer = document.getElementById("clientesContainer");
const formCliente = document.getElementById("formCliente");
const nombreCliente = document.getElementById("nombreCliente");
const deudaInicial = document.getElementById("deudaInicial");
const monedaInicial = document.getElementById("monedaInicial");

const tasaUsdCup = document.getElementById("tasaUsdCup");
const tasaCupTrf = document.getElementById("tasaCupTrf");
const guardarConfig = document.getElementById("guardarConfig");
const resetAppBtn = document.getElementById("resetApp");

const vistaGlobal = document.getElementById("vistaGlobal");
const busqueda = document.getElementById("busqueda");
const resumenClientes = document.getElementById("resumenClientes");

/* =========================
   Utilidades
   ========================= */
const MONEDAS = {
  USD: { label: "USD", symbol: "$" },
  CUP: { label: "CUP", symbol: "₱" },          // usando símbolo genérico para distinguir
  CUP_TRF: { label: "CUP TRF", symbol: "⇄" },  // visual
};

function nowISO(){ return new Date().toISOString(); }

function formatNumber(n){
  if (typeof n !== "number" || isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function formatMoney(n, moneda){
  const sym = MONEDAS[moneda]?.symbol ?? "";
  return `${sym}${formatNumber(n)} ${MONEDAS[moneda]?.label ?? moneda}`;
}

/**
 * Conversión con CUP efectivo como pivote.
 * - tasaUsdCup: 1 USD = X CUP (efectivo)
 * - tasaCupTrf: 1 CUP_TRF = Y CUP (efectivo)
 */
function convertir(monto, origen, destino, cfgInd){
  if (origen === destino) return monto;

  const tUSD = cfgInd?.tasaUsdCup ?? configGeneral.tasaUsdCup;
  const tTRF = cfgInd?.tasaCupTrf ?? configGeneral.tasaCupTrf;

  // A CUP efectivo (pivot)
  let enCUP;
  switch(origen){
    case "USD": enCUP = monto * tUSD; break;
    case "CUP_TRF": enCUP = monto * tTRF; break;
    case "CUP": default: enCUP = monto; break;
  }

  // De CUP efectivo a destino
  switch(destino){
    case "USD": return enCUP / tUSD;
    case "CUP_TRF": return enCUP / tTRF;
    case "CUP": default: return enCUP;
  }
}

/* =========================
   Render
   ========================= */
function render(){
  // Config inputs
  tasaUsdCup.value = configGeneral.tasaUsdCup;
  tasaCupTrf.value = configGeneral.tasaCupTrf;

  // Lista
  const q = (busqueda.value || "").toLowerCase().trim();
  const filtrados = q
    ? clientes.filter(c => c.nombre.toLowerCase().includes(q))
    : clientes.slice();

  clientesContainer.innerHTML = "";
  filtrados.forEach((c, idxLocal) => {
    // índice real en el arreglo original
    const i = clientes.findIndex(x => x.id === c.id);
    clientesContainer.appendChild(renderClienteCard(clientes[i], i));
  });

  // resumen
  resumenClientes.textContent = `${filtrados.length} cliente(s) mostrados de ${clientes.length}`;
}

function renderClienteCard(c, i){
  const card = document.createElement("div");
  card.className = "col-12 col-lg-6";
  const vista = (vistaGlobal.value === "AUTO") ? (c.viewMoneda || c.moneda) : vistaGlobal.value;
  const deudaVista = convertir(c.deuda, c.moneda, vista, c.config);

  card.innerHTML = `
    <div class="card cliente-card shadow-sm h-100">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="card-section-title">Cliente</div>
            <h5 class="mb-1 d-flex align-items-center gap-2">
              <span class="text-truncate" title="${escapeHTML(c.nombre)}">${escapeHTML(c.nombre)}</span>
              <span class="badge text-bg-light border badge-mono">ID ${c.id}</span>
            </h5>
            <div class="small text-muted">Moneda base: <b>${c.moneda}</b></div>
          </div>
          <div class="text-end">
            <div class="card-section-title">Deuda</div>
            <div class="deuda-grande" id="deudaMostrar-${c.id}" data-moneda="${vista}">
              ${formatMoney(deudaVista, vista)}
            </div>
            <div class="d-flex justify-content-end mt-1">
              <select class="form-select form-select-sm w-auto" id="monedaVer-${c.id}">
                ${["USD","CUP","CUP_TRF"].map(m => `
                  <option value="${m}" ${vista===m?"selected":""}>${m}</option>
                `).join("")}
              </select>
            </div>
          </div>
        </div>

        <hr/>

        <div class="row g-2 align-items-end">
          <div class="col-12 col-md-5">
            <label class="form-label mb-1">Monto</label>
            <input type="number" class="form-control" id="opCantidad-${c.id}" placeholder="Ej: 100.00" step="0.01">
          </div>
          <div class="col-12 col-md-5">
            <label class="form-label mb-1">Nota (opcional)</label>
            <input type="text" class="form-control" id="opNota-${c.id}" placeholder="Entrega parcial, abono, compra X...">
          </div>
          <div class="col-12 col-md-2 d-flex gap-2">
            <button class="btn btn-success w-100" data-action="sumar" data-id="${c.id}">
              <i class="bi bi-plus-lg"></i>
            </button>
            <button class="btn btn-danger w-100" data-action="restar" data-id="${c.id}">
              <i class="bi bi-dash-lg"></i>
            </button>
          </div>
        </div>

        <div class="row g-2 mt-3">
          <div class="col-md-6">
            <div class="card-section-title">Config Individual</div>
            <div class="row g-2">
              <div class="col-6">
                <div class="form-text mb-1">USD ↔ CUP</div>
                <input type="number" step="0.0001" class="form-control" id="tasaUsdCup-${c.id}" placeholder="USD↔CUP" value="${c.config?.tasaUsdCup ?? ''}">
              </div>
              <div class="col-6">
                <div class="form-text mb-1">CUP↔TRF</div>
                <input type="number" step="0.0001" class="form-control" id="tasaCupTrf-${c.id}" placeholder="CUP↔TRF" value="${c.config?.tasaCupTrf ?? ''}">
              </div>
              <div class="col-12 d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" data-action="guardar-config" data-id="${c.id}">
                  <i class="bi bi-save"></i> Guardar
                </button>
                <button class="btn btn-outline-secondary btn-sm" data-action="limpiar-config" data-id="${c.id}">
                  <i class="bi bi-eraser"></i> Limpiar
                </button>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card-section-title">Acciones</div>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-outline-dark btn-sm" data-action="renombrar" data-id="${c.id}">
                <i class="bi bi-pencil-square"></i> Renombrar
              </button>
              <button class="btn btn-outline-danger btn-sm" data-action="eliminar" data-id="${c.id}">
                <i class="bi bi-trash"></i> Eliminar
              </button>
              <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#hist-${c.id}">
                <i class="bi bi-clock-history"></i> Historial
              </button>
            </div>
          </div>
        </div>

        <div class="collapse mt-3" id="hist-${c.id}">
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto (${c.moneda})</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody id="histBody-${c.id}">
                ${renderHistorial(c)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // listeners específicos
  const selVista = card.querySelector(`#monedaVer-${c.id}`);
  selVista.addEventListener("change", () => {
    c.viewMoneda = selVista.value; // persistimos vista por cliente
    writeLS(STORAGE_KEYS.CLIENTES, clientes);
    actualizarMontoMostrado(c.id);
  });

  card.querySelectorAll("button[data-action]").forEach(btn => {
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (action === "sumar" || action === "restar"){
      btn.addEventListener("click", () => operarCliente(id, action));
    }
    if (action === "guardar-config"){
      btn.addEventListener("click", () => guardarConfigIndividual(id));
    }
    if (action === "limpiar-config"){
      btn.addEventListener("click", () => limpiarConfigIndividual(id));
    }
    if (action === "renombrar"){
      btn.addEventListener("click", () => renombrarCliente(id));
    }
    if (action === "eliminar"){
      btn.addEventListener("click", () => eliminarCliente(id));
    }
  });

  return card;
}

function renderHistorial(c){
  if (!c.historial || !c.historial.length) {
    return `<tr><td colspan="4" class="text-muted">Sin movimientos aún.</td></tr>`;
  }
  return c.historial.slice().reverse().map(op => `
    <tr>
      <td><span class="badge text-bg-light">${formatFecha(op.fecha)}</span></td>
      <td>
        <span class="badge ${op.tipo==='sumar'?'text-bg-success':'text-bg-danger'}">${op.tipo==='sumar'? '➕ Suma':'➖ Resta'}</span>
      </td>
      <td class="badge-mono">${formatNumber(op.monto)} ${c.moneda}</td>
      <td class="op-note">${escapeHTML(op.nota || '')}</td>
    </tr>
  `).join("");
}

function formatFecha(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString();
  }catch{ return iso; }
}

function actualizarMontoMostrado(id){
  const c = clientes.find(x => x.id == id);
  if (!c) return;
  const vista = (vistaGlobal.value === "AUTO") ? (c.viewMoneda || c.moneda) : vistaGlobal.value;
  const convertido = convertir(c.deuda, c.moneda, vista, c.config);
  const nodo = document.getElementById(`deudaMostrar-${c.id}`);
  if (nodo){
    nodo.dataset.moneda = vista;
    nodo.textContent = formatMoney(convertido, vista);
  }
  // actualizar historial (no cambia montos históricos, solo si recargamos no hace falta)
  const contHist = document.getElementById(`histBody-${c.id}`);
  if (contHist) contHist.innerHTML = renderHistorial(c);
}

/* =========================
   Acciones
   ========================= */
formCliente.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = nombreCliente.value.trim();
  const deuda = parseFloat(deudaInicial.value);
  const moneda = monedaInicial.value;

  if (!nombre) return alert("El nombre es obligatorio.");
  if (isNaN(deuda)) return alert("La deuda inicial es inválida.");

  const nuevo = {
    id: generarId(),
    nombre,
    deuda,
    moneda,             // moneda base de la deuda
    viewMoneda: moneda, // vista por defecto
    config: {},         // tasas individuales opcionales
    historial: [],      // {fecha, tipo, monto, nota}
  };
  clientes.push(nuevo);
  writeLS(STORAGE_KEYS.CLIENTES, clientes);

  formCliente.reset();
  render();
});

function operarCliente(id, tipo){
  const c = clientes.find(x => x.id == id);
  if (!c) return;
  const inp = document.getElementById(`opCantidad-${id}`);
  const nota = document.getElementById(`opNota-${id}`);
  let cantidad = parseFloat(inp.value);

  if (isNaN(cantidad) || cantidad <= 0){
    alert("Monto inválido.");
    return;
  }

  if (tipo === "sumar") c.deuda += cantidad;
  if (tipo === "restar") c.deuda -= cantidad;

  c.historial = c.historial || [];
  c.historial.push({
    fecha: nowISO(),
    tipo,
    monto: cantidad,   // guardamos en moneda base del cliente
    nota: (nota.value || "").trim(),
  });

  writeLS(STORAGE_KEYS.CLIENTES, clientes);
  inp.value = "";
  nota.value = "";
  actualizarMontoMostrado(id);
}

function guardarConfigIndividual(id){
  const c = clientes.find(x => x.id == id);
  if (!c) return;

  const tUSD = parseFloat(document.getElementById(`tasaUsdCup-${id}`).value);
  const tTRF = parseFloat(document.getElementById(`tasaCupTrf-${id}`).value);

  c.config = c.config || {};
  if (!isNaN(tUSD) && tUSD > 0) c.config.tasaUsdCup = tUSD; else delete c.config.tasaUsdCup;
  if (!isNaN(tTRF) && tTRF > 0) c.config.tasaCupTrf = tTRF; else delete c.config.tasaCupTrf;

  writeLS(STORAGE_KEYS.CLIENTES, clientes);
  actualizarMontoMostrado(id);
}

function limpiarConfigIndividual(id){
  const c = clientes.find(x => x.id == id);
  if (!c) return;
  c.config = {};
  writeLS(STORAGE_KEYS.CLIENTES, clientes);
  actualizarMontoMostrado(id);
}

function renombrarCliente(id){
  const c = clientes.find(x => x.id == id);
  if (!c) return;
  const nuevo = prompt("Nuevo nombre para el cliente:", c.nombre);
  if (!nuevo) return;
  c.nombre = nuevo.trim();
  writeLS(STORAGE_KEYS.CLIENTES, clientes);
  render();
}

function eliminarCliente(id){
  if (!confirm("¿Eliminar este cliente y su historial?")) return;
  clientes = clientes.filter(x => x.id != id);
  writeLS(STORAGE_KEYS.CLIENTES, clientes);
  render();
}

function generarId(){
  // simple, legible
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/* =========================
   Config General + Vista Global
   ========================= */
guardarConfig.addEventListener("click", () => {
  const tUSD = parseFloat(tasaUsdCup.value);
  const tTRF = parseFloat(tasaCupTrf.value);
  if (!isNaN(tUSD) && tUSD > 0) configGeneral.tasaUsdCup = tUSD;
  if (!isNaN(tTRF) && tTRF > 0) configGeneral.tasaCupTrf = tTRF;

  writeLS(STORAGE_KEYS.CONFIG, configGeneral);
  // actualizar todas las tarjetas
  clientes.forEach(c => actualizarMontoMostrado(c.id));
  toast("Configuración general guardada.");
});

vistaGlobal.addEventListener("change", () => {
  // Solo cambia la visualización, no los datos ni la preferencia guardada del cliente
  clientes.forEach(c => actualizarMontoMostrado(c.id));
});

busqueda.addEventListener("input", render);

resetAppBtn.addEventListener("click", () => {
  if (!confirm("Esto borrará todos los clientes y configuración. ¿Continuar?")) return;
  localStorage.removeItem(STORAGE_KEYS.CLIENTES);
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  clientes = [];
  configGeneral = { tasaUsdCup: 250, tasaCupTrf: 1.10 };
  render();
  toast("App restablecida.");
});

/* =========================
   Helpers UI
   ========================= */
function toast(msg){
  // micro-toast simple
  const div = document.createElement("div");
  div.className = "position-fixed bottom-0 end-0 p-3";
  div.style.zIndex = 1080;
  div.innerHTML = `
    <div class="toast align-items-center text-bg-dark show border-0">
      <div class="d-flex">
        <div class="toast-body">
          ${escapeHTML(msg)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  const btn = div.querySelector(".btn-close");
  const remove = () => div.remove();
  btn.addEventListener("click", remove);
  setTimeout(remove, 2500);
}

function escapeHTML(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================
   Init
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  render();
});