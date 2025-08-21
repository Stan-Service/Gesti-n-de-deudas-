// ========================
// Persistencia y Estado
// ========================
const K = {
  CLIENTES: "clientes_v3",
  CONFIG: "configGeneral_v3",
};

let clientes = readLS(K.CLIENTES, []);
let configGeneral = readLS(K.CONFIG, { tasaUsdCup: 250, tasaCupTrf: 1.10 }); // 1 TRF = 1.10 CUP efectivo

function readLS(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw) : fallback; }
  catch{ return fallback; }
}
function writeLS(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

// ========================
// DOM
// ========================
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

// ========================
/* Utilidades */
// ========================
const MONEDAS = {
  USD: { label: "USD", symbol: "$" },
  CUP: { label: "CUP", symbol: "₱" },
  CUP_TRF: { label: "CUP TRF", symbol: "⇄" },
};

function nowISO(){ return new Date().toISOString(); }
function formatNumber(n){ return (typeof n === "number" && !isNaN(n)) ? n.toLocaleString(undefined,{ maximumFractionDigits: 2 }) : "0"; }
function formatMoney(n, m){ return `${MONEDAS[m]?.symbol ?? ""}${formatNumber(n)} ${MONEDAS[m]?.label ?? m}`; }
function escapeHTML(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function formatFecha(iso){ try{ return new Date(iso).toLocaleString(); }catch{ return iso; } }
function genId(){ return Math.random().toString(36).slice(2,7).toUpperCase(); }

/** Conversión con CUP efectivo pivote
 *  - tasaUsdCup: 1 USD = X CUP efectivo
 *  - tasaCupTrf: 1 TRF = Y CUP efectivo  (← lo que pediste)
 */
function convertir(monto, origen, destino, cfgInd){
  if (origen === destino) return monto;

  const tUSD = cfgInd?.tasaUsdCup ?? configGeneral.tasaUsdCup;
  const tTRF = cfgInd?.tasaCupTrf ?? configGeneral.tasaCupTrf;

  // a CUP efectivo
  let enCUP;
  switch(origen){
    case "USD": enCUP = monto * tUSD; break;
    case "CUP_TRF": enCUP = monto * tTRF; break; // 1 TRF = tTRF CUP
    case "CUP": default: enCUP = monto; break;
  }

  // de CUP efectivo a destino
  switch(destino){
    case "USD": return enCUP / tUSD;
    case "CUP_TRF": return enCUP / tTRF;
    case "CUP": default: return enCUP;
  }
}

// ========================
// Render
// ========================
function render(){
  // Config inputs
  tasaUsdCup.value = configGeneral.tasaUsdCup;
  tasaCupTrf.value = configGeneral.tasaCupTrf;

  const q = (busqueda.value || "").toLowerCase().trim();
  const lista = q ? clientes.filter(c => c.nombre.toLowerCase().includes(q)) : clientes.slice();

  clientesContainer.innerHTML = "";

  if (!lista.length){
    clientesContainer.innerHTML = `
      <div class="col-12">
        <div class="empty">
          <div class="mb-2"><i class="bi bi-people fs-3"></i></div>
          <div class="fw-semibold">Aún no hay clientes</div>
          <div class="small">Abre <b>Opciones</b> y crea tu primer cliente.</div>
        </div>
      </div>`;
  }else{
    lista.forEach(c => clientesContainer.appendChild(renderClienteCard(c)));
  }

  resumenClientes.textContent = `${lista.length} cliente(s) mostrados de ${clientes.length}`;
}

function renderClienteCard(c){
  const vista = (vistaGlobal.value === "AUTO") ? (c.viewMoneda || c.moneda) : vistaGlobal.value;
  const deudaVista = convertir(c.deuda, c.moneda, vista, c.config);

  const wrap = document.createElement("div");
  wrap.className = "col-12 col-lg-6";
  wrap.innerHTML = `
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
            <div class="deuda-grande" id="deuda-${c.id}" data-moneda="${vista}">
              ${formatMoney(deudaVista, vista)}
            </div>
            <div class="d-flex justify-content-end mt-1">
              <select class="form-select form-select-sm w-auto sel-moneda" data-id="${c.id}">
                ${["USD","CUP","CUP_TRF"].map(m => `<option value="${m}" ${vista===m?"selected":""}>${m}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <hr/>

        <div class="row g-2 align-items-end">
          <div class="col-12 col-md-5">
            <label class="form-label mb-1">Monto</label>
            <input type="number" step="0.01" class="form-control" id="monto-${c.id}" placeholder="Ej: 100.00">
          </div>
          <div class="col-12 col-md-5">
            <label class="form-label mb-1">Nota (opcional)</label>
            <input type="text" class="form-control" id="nota-${c.id}" placeholder="Abono, compra X...">
          </div>
          <div class="col-12 col-md-2 d-flex gap-2">
            <button type="button" class="btn btn-success w-100 act" data-action="sumar" data-id="${c.id}">
              <i class="bi bi-plus-lg"></i>
            </button>
            <button type="button" class="btn btn-danger w-100 act" data-action="restar" data-id="${c.id}">
              <i class="bi bi-dash-lg"></i>
            </button>
          </div>
        </div>

        <div class="row g-2 mt-3">
          <div class="col-md-6">
            <div class="card-section-title">Config Individual</div>
            <button class="btn btn-outline-secondary btn-sm mb-2" type="button"
                    data-bs-toggle="collapse" data-bs-target="#cfg-${c.id}">
              <i class="bi bi-gear"></i> Mostrar/ocultar
            </button>
            <div class="collapse" id="cfg-${c.id}">
              <div class="row g-2">
                <div class="col-6">
                  <div class="form-text mb-1">USD ↔ CUP</div>
                  <input type="number" step="0.0001" class="form-control" id="usd-${c.id}" placeholder="USD↔CUP" value="${c.config?.tasaUsdCup ?? ''}">
                </div>
                <div class="col-6">
                  <div class="form-text mb-1">TRF ↔ CUP</div>
                  <input type="number" step="0.0001" class="form-control" id="trf-${c.id}" placeholder="TRF↔CUP" value="${c.config?.tasaCupTrf ?? ''}">
                </div>
                <div class="col-12 d-flex gap-2">
                  <button type="button" class="btn btn-outline-primary btn-sm act" data-action="guardar-config" data-id="${c.id}">
                    <i class="bi bi-save"></i> Guardar
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm act" data-action="limpiar-config" data-id="${c.id}">
                    <i class="bi bi-eraser"></i> Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card-section-title">Acciones</div>
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-outline-dark btn-sm act" data-action="renombrar" data-id="${c.id}">
                <i class="bi bi-pencil-square"></i> Renombrar
              </button>
              <button type="button" class="btn btn-outline-danger btn-sm act" data-action="eliminar" data-id="${c.id}">
                <i class="bi bi-trash"></i> Eliminar
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#hist-${c.id}">
                <i class="bi bi-clock-history"></i> Historial
              </button>
            </div>
          </div>
        </div>

        <div class="collapse mt-3" id="hist-${c.id}">
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Monto (${c.moneda})</th><th>Nota</th></tr>
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
  return wrap;
}

function renderHistorial(c){
  if (!c.historial || !c.historial.length)
    return `<tr><td colspan="4" class="text-muted">Sin movimientos aún.</td></tr>`;
  return c.historial.slice().reverse().map(op => `
    <tr>
      <td><span class="badge text-bg-light">${formatFecha(op.fecha)}</span></td>
      <td><span class="badge ${op.tipo==='sumar'?'text-bg-success':'text-bg-danger'}">${op.tipo==='sumar'?'➕ Suma':'➖ Resta'}</span></td>
      <td class="badge-mono">${formatNumber(op.monto)} ${c.moneda}</td>
      <td class="op-note">${escapeHTML(op.nota || '')}</td>
    </tr>
  `).join("");
}

function actualizarDeudaMostrada(id){
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  const vista = (vistaGlobal.value === "AUTO") ? (c.viewMoneda || c.moneda) : vistaGlobal.value;
  const convertido = convertir(c.deuda, c.moneda, vista, c.config);
  const nodo = document.getElementById(`deuda-${c.id}`);
  if (nodo) nodo.innerHTML = formatMoney(convertido, vista);
  const hist = document.getElementById(`histBody-${c.id}`);
  if (hist) hist.innerHTML = renderHistorial(c);
}

// ========================
// Eventos globales
// ========================
formCliente?.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = (nombreCliente.value || "").trim();
  const deuda = parseFloat(deudaInicial.value);
  const moneda = monedaInicial.value;

  if (!nombre){ alert("El nombre es obligatorio."); return; }
  if (isNaN(deuda)){ alert("Deuda inicial inválida."); return; }

  const nuevo = {
    id: genId(),
    nombre, deuda, moneda,
    viewMoneda: moneda,
    config: {},
    historial: [],
  };
  clientes.push(nuevo);
  writeLS(K.CLIENTES, clientes);

  formCliente.reset();
  render();
});

guardarConfig?.addEventListener("click", () => {
  const tUSD = parseFloat(tasaUsdCup.value);
  const tTRF = parseFloat(tasaCupTrf.value);
  if (!isNaN(tUSD) && tUSD > 0) configGeneral.tasaUsdCup = tUSD;
  if (!isNaN(tTRF) && tTRF > 0) configGeneral.tasaCupTrf = tTRF;
  writeLS(K.CONFIG, configGeneral);
  clientes.forEach(c => actualizarDeudaMostrada(c.id));
  miniToast("Configuración general guardada.");
});

vistaGlobal?.addEventListener("change", () => {
  clientes.forEach(c => actualizarDeudaMostrada(c.id));
});

busqueda?.addEventListener("input", render);

resetAppBtn?.addEventListener("click", () => {
  if (!confirm("Esto borrará todos los datos. ¿Continuar?")) return;
  localStorage.removeItem(K.CLIENTES);
  localStorage.removeItem(K.CONFIG);
  clientes = [];
  configGeneral = { tasaUsdCup: 250, tasaCupTrf: 1.10 };
  render();
  miniToast("App restablecida.");
});

// Delegación de eventos dentro del contenedor de clientes
clientesContainer.addEventListener("click", e => {
  const btn = e.target.closest(".act");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;

  if (action === "sumar" || action === "restar"){
    const monto = parseFloat(document.getElementById(`monto-${id}`).value);
    const nota = (document.getElementById(`nota-${id}`).value || "").trim();
    if (isNaN(monto) || monto <= 0){ alert("Monto inválido."); return; }
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    if (action === "sumar") c.deuda += monto; else c.deuda -= monto;
    c.historial.push({ fecha: nowISO(), tipo: action, monto, nota });
    writeLS(K.CLIENTES, clientes);
    document.getElementById(`monto-${id}`).value = "";
    document.getElementById(`nota-${id}`).value = "";
    actualizarDeudaMostrada(id);
    return;
  }

  if (action === "guardar-config"){
    const c = clientes.find(x => x.id === id);
    if (!c) return;
    const tUSD = parseFloat(document.getElementById(`usd-${