// --- Utilidades ---
function getStorage(key, def) {
  return JSON.parse(localStorage.getItem(key)) || def;
}
function setStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// --- Variables ---
let tasas = getStorage("tasasGlobales", {});
let clientes = getStorage("clientes", []);

// --- Referencias DOM ---
const moneda1 = document.getElementById("moneda1");
const moneda2 = document.getElementById("moneda2");
const valorTasa = document.getElementById("valorTasa");
const addTasa = document.getElementById("addTasa");
const guardarTasas = document.getElementById("guardarTasas");
const listaTasas = document.getElementById("listaTasas");

const nombreCliente = document.getElementById("nombreCliente");
const deudaInicial = document.getElementById("deudaInicial");
const monedaDeuda = document.getElementById("monedaDeuda");
const addCliente = document.getElementById("addCliente");
const listaClientes = document.getElementById("listaClientes");
const buscarCliente = document.getElementById("buscarCliente");

// --- Funciones de tasas ---
function renderTasas() {
  listaTasas.innerHTML = "";
  const keys = Object.keys(tasas).slice(-3); // últimas 3
  keys.forEach(key => {
    const [m1, m2] = key.split("->");
    const li = document.createElement("li");
    li.textContent = `1 ${m1} = ${tasas[key]} ${m2}`;
    listaTasas.appendChild(li);
  });
}

addTasa.addEventListener("click", () => {
  if (moneda1.value === moneda2.value) {
    alert("Las monedas no pueden ser iguales.");
    return;
  }
  if (!valorTasa.value || valorTasa.value <= 0) {
    alert("Introduce un valor válido para la tasa.");
    return;
  }
  const key = `${moneda1.value}->${moneda2.value}`;
  tasas[key] = parseFloat(valorTasa.value);
  renderTasas();
});

guardarTasas.addEventListener("click", () => {
  setStorage("tasasGlobales", tasas);
  alert("✅ Tasas globales guardadas");
});

// --- Funciones de clientes ---
function renderClientes(filtro = "") {
  listaClientes.innerHTML = "";
  clientes
    .filter(c => c.nombre.toLowerCase().includes(filtro.toLowerCase()))
    .forEach((cliente, idx) => {
      const div = document.createElement("div");
      div.className = "border rounded p-3 flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p class="font-semibold">${cliente.nombre}</p>
          <p class="text-sm text-gray-600">${cliente.deuda} ${cliente.moneda}</p>
        </div>
        <button class="text-red-500 font-bold text-lg">❌</button>
      `;
      // evento eliminar
      div.querySelector("button").addEventListener("click", () => {
        if (confirm(`¿Seguro que deseas eliminar a ${cliente.nombre}?`)) {
          clientes.splice(idx, 1);
          setStorage("clientes", clientes);
          renderClientes(buscarCliente.value);
        }
      });
      listaClientes.appendChild(div);
    });
}

addCliente.addEventListener("click", () => {
  if (!nombreCliente.value.trim()) {
    alert("Introduce un nombre de cliente.");
    return;
  }
  if (!deudaInicial.value || deudaInicial.value < 0) {
    alert("Introduce una deuda válida.");
    return;
  }
  clientes.push({
    nombre: nombreCliente.value.trim(),
    deuda: parseFloat(deudaInicial.value),
    moneda: monedaDeuda.value
  });
  setStorage("clientes", clientes);
  renderClientes();
  nombreCliente.value = "";
  deudaInicial.value = "";
});

buscarCliente.addEventListener("input", (e) => {
  renderClientes(e.target.value);
});

// --- Inicialización ---
renderTasas();
renderClientes();