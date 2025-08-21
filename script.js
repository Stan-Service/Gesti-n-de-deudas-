/* =========================
   Gestor Multitasa - app.js
   ========================= */

const STORAGE = {
  CLIENTES: "gestor_clientes_v1",
  GLOBAL_RATES: "gestor_global_rates_v1"
};

// Monedas disponibles
const MONEDAS = ["USD","CUP","CUP_TRF"];

// Estado
let clientes = readLS(STORAGE.CLIENTES, []);
let globalRates = readLS(STORAGE.GLOBAL_RATES, []); // array de {from,to,rate}

// DOM refs
const clientesContainer = document.getElementById("clientesContainer");
const formCliente = document.getElementById("formCliente");
const nombreCliente = document.getElementById("nombreCliente");
const deudaInicial = document.getElementById("deudaInicial");
const monedaInicial = document.getElementById("monedaInicial");

const pairFrom = document.getElementById("pairFrom");
const pairTo = document.getElementById("pairTo");
const pairRate = document.getElementById("pairRate");
const addRateBtn = document.getElementById("addRateBtn");
const tasasGlobalesContainer = document.getElementById("tasasGlobalesContainer");
const guardarRates = document.getElementById("guardarRates");
const resetAppBtn = document.getElementById("resetApp");

const vistaGlobal = document.getElementById("vistaGlobal");
const busqueda = document.getElementById("busqueda");
const resumenClientes = document.getElementById("resumenClientes");

// utils LS
function readLS(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v) : fallback; } catch { return fallback; } }
function writeLS(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

// small helpers
function genId(){ return Math.random().toString(36).slice(2,9).toUpperCase(); }
function nowISO(){ return new Date().toISOString(); }
function fmtNum(n){ return (typeof n === "number" && !isNaN(n)) ? n.toLocaleString(undefined, {maximumFractionDigits: 2}) : "0"; }
function escapeHTML(s){ return (s||"").toString().replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

// --- Rates graph utilities ---
// globalRates: [{from,to,rate}] means 1 FROM = rate TO
// We'll allow use of reverse edge as multiplicative inverse if needed.

function buildGraph(rates){
  // adjacency list: node -> array of {to,rate}
  const g = {};
  MONEDAS.forEach(m => g[m] = []);
  rates.forEach(r => {
    if (!g[r.from]) g[r.from] = [];
    g[r.from].push({ to: r.to, rate: Number(r.rate) });
    // note: do not add inverse explicitly here; BFS will consider inverse as 1/r if needed
  });
  return g;
}

// Encontrar ruta multiplicativa desde 'from' hasta 'to'.
// usar BFS (busca ruta más corta en número de saltos); acumula producto.
// Considera tanto aristas directas como la inversa 1/r.
function findConversionRate(rates, from, to){
  if (from === to) return 1;
  const g = buildGraph(rates);
  // BFS queue: [node, product]
  const q = [{ node: from, prod: 1 }];
  const visited = new Set([from]);
  // parent map no necesario, retornamos product when reach
  while (q.length){
    const cur = q.shift();
    const neighbors = g[cur.node] || [];
    // consider direct neighbors
    for (const nb of neighbors){
      if (visited.has