/* ===========================
   Gestor de Deudas (LocalStorage)
   =========================== */

/* ----- Constantes & utilidades ----- */
const CURRENCIES = {
  USD: { label: "USD", symbol: "$" },
  CUP_EFECTIVO: { label: "CUP efectivo", symbol: "CUP$" },
  CUP_TRANSFER: { label: "CUP transferencia", symbol: "CUP$" },
};

const LS_KEYS = {
  clients: "gd_clients",
  globalRates: "gd_global_rates", // { current: { "A->B": number }, history: [{pair, rate, ts}] }
  ui: "gd_ui",                    // { controlsVisible: boolean }
  viewCurrency: "gd_view_currency",
};

function fmtAmount(num) {
  if (!isFinite(num)) return "—";
  const abs = Math.abs(num);
  const decimals = abs < 1 ? 4 : abs < 100 ? 2 : 2;
  return num.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pairKey(from, to) {
  return `${from}->${to}`;
}

/** Convierte monto entre monedas usando:
 * 1) tasas individuales del cliente (si existen para ese par),
 * 2) tasas globales (directa),
 * 3) tasa inversa si existe (1/r),
 * En faltantes: intenta retorno 1 si from==to, si no, NaN.
 */
function convertAmount(amount, from, to, clientRateMap, globalRates) {
  if (from === to) return amount;

  const tryMaps = [];
  if (clientRateMap) tryMaps.push(clientRateMap);
  if (globalRates?.current) tryMaps.push(globalRates.current);

  for (const rates of tryMaps) {
    const direct = rates[pairKey(from, to)];
    if (typeof direct === "number" && direct > 0) return amount * direct;

    const inverse = rates[pairKey(to, from)];
    if (typeof inverse === "number" && inverse > 0) return amount / inverse;
  }
  return NaN;
}

/* ----- Estado persistente ----- */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let clients = loadJSON(LS_KEYS.clients,