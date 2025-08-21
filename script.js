// --- Variables globales ---
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let configGeneral = JSON.parse(localStorage.getItem("configGeneral")) || {
  tasaUsdCup: 250,
  tasaCupTrf: 1.1 // 1 CUP_TRF = 1.1 CUP efectivo
};

// --- Referencias DOM ---
const formCliente = document.getElementById("formCliente");
const clientesContainer = document.getElementById("clientesContainer");
const tasaUsdCup = document.getElementById("tasaUsdCup");
const tasaCupTrf = document.getElementById("tasaCupTrf");
const guardarConfig = document.getElementById("guardarConfig");
const seccionOpciones = document.getElementById("seccionOpciones");
const toggleOpciones = document.getElementById("toggleOpciones");

// --- Mostrar/Ocultar opciones ---
toggleOpciones.addEventListener("click", () => {
  seccionOpciones.classList.toggle("d-none");
});

// --- Función de conversión ---
function convertirMonto(monto, monedaOrigen, monedaDestino, configInd = {}) {
  const tasaUsdCup = configInd.tasaUsdCup || configGeneral.tasaUsdCup;
  const tasaCupTrf = configInd.tasaCupTrf || configGeneral.tasaCupTrf;

  let montoEnCup;

  // Paso todo a CUP efectivo
  if (monedaOrigen === "USD") montoEnCup = monto * tasaUsdCup;
  else if (monedaOrigen === "CUP_TRF") montoEnCup = monto * tasaCupTrf; // 1 TRF = tasaCupTrf CUP
  else montoEnCup = monto;

  // Paso a la moneda destino
  if (monedaDestino === "USD") return montoEnCup / tasaUsdCup;
  if (monedaDestino === "CUP_TRF") return montoEnCup / tasaCupTrf;
  return montoEnCup; // CUP efectivo
}

// --- Mostrar deuda según selector ---
function mostrarDeuda(i) {
  const cliente = clientes[i];
  const monedaSeleccionada = document.getElementById(`monedaVer-${i}`).value;
  const deudaConvertida = convertirMonto(cliente.deuda, cliente.moneda, monedaSeleccionada, cliente.config || {});
  document.getElementById(`deudaMostrar-${i}`).innerText = deudaConvertida.toFixed(2) + " " + monedaSeleccionada;
}

// --- Al cambiar moneda ---
function cambiarMonedaVista(i) {
  mostrarDeuda(i);
}

// --- Render clientes ---
function renderClientes() {
  clientesContainer.innerHTML = "";
  clientes.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "col-md-6";
    div.innerHTML = `
      <div class="card cliente-card shadow-sm">
        <div class="card-body">
          <h5>${c.nombre}</h5>
          <p><b>Deuda actual:</b> <span id="deudaMostrar-${i}"></span></p>

          <div class="mb-2">
            <label>Ver en:</label>
            <select class="form-select form-select-sm" id="monedaVer-${i}" onchange="cambiarMonedaVista(${i})">
              <option value="USD">USD</option>
              <option value="CUP">CUP</option>
              <option value="CUP_TRF">CUP Transferencia</option>
            </select>
          </div>

          <!-- Operaciones -->
          <div class="input-group mb-2">
            <input type="number" class="form-control" id="opCantidad-${i}" placeholder="Monto">
            <button class="btn btn-success" onclick="modificarDeuda(${i}, 'sumar')">➕</button>
            <button class="btn btn-danger" onclick="modificarDeuda(${i}, 'restar')">➖</button>
          </div>

          <!-- Config individual (oculta) -->
          <button class="btn btn-sm btn-outline-secondary mb-2" onclick="toggleConfigIndividual(${i})">⚙️ Config Cliente</button>
          <div class="config-individual" id="configInd-${i}">
            <input type="number" class="form-control mb-2" id="tasaUsdCup-${i}" placeholder="Tasa USD↔CUP" value="${c.config?.tasaUsdCup || ''}">
            <input type="number" class="form-control mb-2" id="tasaCupTrf-${i}" placeholder="Tasa TRF↔CUP" value="${c.config?.tasaCupTrf || ''}">
            <button class="btn btn-sm btn-outline-primary" onclick="guardarConfigIndividual(${i})">Guardar Config</button>
          </div>
        </div>
      </div>
    `;
    clientesContainer.appendChild(div);
    mostrarDeuda(i);
  });
}

// --- Toggle config individual ---
function toggleConfigIndividual(i) {
  document.getElementById(`configInd-${i}`).classList.toggle("config-individual");
}

// --- Agregar cliente ---
formCliente.addEventListener("submit", e => {
  e.preventDefault();
  const nombre = document.getElementById("nombreCliente").value.trim();
  const deuda = parseFloat(document.getElementById("deudaInicial").value);
  const moneda = document.getElementById("monedaInicial").value;

  clientes.push({ nombre, deuda, moneda, config: {} });
  localStorage.setItem("clientes", JSON.stringify(clientes));
  formCliente.reset();
  renderClientes();
});

// --- Modificar deuda ---
function modificarDeuda(i, tipo) {
  const input = document.getElementById(`opCantidad-${i}`);
  let cantidad = parseFloat(input.value);
  if (isNaN(cantidad) || cantidad <= 0) return alert("Monto inválido");

  if (tipo === "sumar") clientes[i].deuda += cantidad;
  else if (tipo === "restar") clientes[i].deuda -= cantidad;

  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderClientes();
}

// --- Guardar config general ---
guardarConfig.addEventListener("click", () => {
  configGeneral.tasaUsdCup = parseFloat(tasaUsdCup.value) || configGeneral.tasaUsdCup;
  configGeneral.tasaCupTrf = parseFloat(tasaCupTrf.value) || configGeneral.tasaCupTrf;
  localStorage.setItem("configGeneral", JSON.stringify(configGeneral));
  alert("Configuración general guardada ✅");
});

// --- Guardar config individual ---
function guardarConfigIndividual(i) {
  const tasa1 = parseFloat(document.getElementById(`tasaUsdCup-${i}`).value);
  const tasa2 = parseFloat(document.getElementById(`tasaCupTrf-${i}`).value);

  if (!clientes[i].config) clientes[i].config = {};
  if (tasa1) clientes[i].config.tasaUsdCup = tasa1;
  if (tasa2) clientes[i].config.tasaCupTrf = tasa2;

  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderClientes();
}

// --- Inicializar ---
tasaUsdCup.value = configGeneral.tasaUsdCup;
tasaCupTrf.value = configGeneral.tasaCupTrf;
renderClientes();