// Gestor de Deudas - JavaScript Principal
class DebtManager {
  constructor() {
    this.clients = JSON.parse(localStorage.getItem("debtClients") || "[]");
    this.exchangeRates = JSON.parse(
      localStorage.getItem("exchangeRates") || "{}"
    );
    this.globalCurrency = localStorage.getItem("globalCurrency") || "USD";
    this.currentDeleteId = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderClients();
    this.updateGlobalCurrency();
    this.updateRatesDisplay();
    this.setDefaultRates();
  }

  setDefaultRates() {
    if (Object.keys(this.exchangeRates).length === 0) {
      this.exchangeRates = {
        "USD-CUP_CASH": 120,
        "USD-CUP_TRANSFER": 115,
        "CUP_CASH-CUP_TRANSFER": 0.96,
      };
      this.saveData();
    }
  }

  bindEvents() {
    // Botones principales
    document
      .getElementById("addClientBtn")
      .addEventListener("click", () => this.openModal("addClientModal"));
    document
      .getElementById("configRatesBtn")
      .addEventListener("click", () => this.openModal("configRatesModal"));

    // Formularios
    document
      .getElementById("addClientForm")
      .addEventListener("submit", (e) => this.handleAddClient(e));
    document
      .getElementById("configRatesForm")
      .addEventListener("submit", (e) => this.handleConfigRates(e));

    // Moneda global
    document
      .getElementById("globalCurrency")
      .addEventListener("change", (e) =>
        this.changeGlobalCurrency(e.target.value)
      );

    // Cerrar modales
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        this.closeModal(modal.id);
      });
    });

    // Cerrar modal al hacer click fuera
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Modal de eliminación
    document
      .getElementById("cancelDelete")
      .addEventListener("click", () => this.closeModal("deleteModal"));
    document
      .getElementById("confirmDelete")
      .addEventListener("click", () => this.confirmDelete());
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Focus en primer input
    setTimeout(() => {
      const firstInput = modal.querySelector("input, select");
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove("show");
    document.body.style.overflow = "";

    // Reset formularios
    const form = modal.querySelector("form");
    if (form) form.reset();
  }

  handleAddClient(e) {
    e.preventDefault();

    const name = document.getElementById("clientName").value.trim();
    const initialDebt = parseFloat(
      document.getElementById("initialDebt").value
    );
    const currency = document.getElementById("clientCurrency").value;

    if (!name || isNaN(initialDebt) || initialDebt < 0) {
      alert("Por favor completa todos los campos correctamente");
      return;
    }

    const client = {
      id: Date.now(),
      name,
      originalDebt: initialDebt,
      currency,
      history: [
        {
          type: "initial",
          amount: initialDebt,
          date: new Date().toLocaleDateString("es-ES"),
          description: "Deuda inicial",
        },
      ],
    };

    this.clients.push(client);
    this.saveData();
    this.renderClients();
    this.closeModal("addClientModal");

    // Scroll al nuevo cliente
    setTimeout(() => {
      const newCard = document.querySelector(`[data-client-id="${client.id}"]`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  handleConfigRates(e) {
    e.preventDefault();

    const pair = document.getElementById("currencyPair").value;
    const rate = parseFloat(document.getElementById("conversionRate").value);

    if (isNaN(rate) || rate <= 0) {
      alert("Ingresa una tasa válida");
      return;
    }

    this.exchangeRates[pair] = rate;
    this.calculateThirdRate();
    this.saveData();
    this.renderClients();
    this.updateRatesDisplay();
    this.closeModal("configRatesModal");
  }

  calculateThirdRate() {
    const rates = this.exchangeRates;

    // Si tenemos USD->CUP_CASH y USD->CUP_TRANSFER, calculamos CUP_CASH->CUP_TRANSFER
    if (rates["USD-CUP_CASH"] && rates["USD-CUP_TRANSFER"]) {
      rates["CUP_CASH-CUP_TRANSFER"] =
        rates["USD-CUP_TRANSFER"] / rates["USD-CUP_CASH"];
    }
    // Si tenemos USD->CUP_CASH y CUP_CASH->CUP_TRANSFER, calculamos USD->CUP_TRANSFER
    else if (rates["USD-CUP_CASH"] && rates["CUP_CASH-CUP_TRANSFER"]) {
      rates["USD-CUP_TRANSFER"] =
        rates["USD-CUP_CASH"] * rates["CUP_CASH-CUP_TRANSFER"];
    }
    // Si tenemos USD->CUP_TRANSFER y CUP_CASH->CUP_TRANSFER, calculamos USD->CUP_CASH
    else if (rates["USD-CUP_TRANSFER"] && rates["CUP_CASH-CUP_TRANSFER"]) {
      rates["USD-CUP_CASH"] =
        rates["USD-CUP_TRANSFER"] / rates["CUP_CASH-CUP_TRANSFER"];
    }
  }

  changeGlobalCurrency(currency) {
    this.globalCurrency = currency;
    localStorage.setItem("globalCurrency", currency);
    this.renderClients();
  }

  updateGlobalCurrency() {
    document.getElementById("globalCurrency").value = this.globalCurrency;
  }

  convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    const rates = this.exchangeRates;

    // Conversión directa
    const directKey = `${fromCurrency}-${toCurrency}`;
    if (rates[directKey]) {
      return amount * rates[directKey];
    }

    // Conversión inversa
    const inverseKey = `${toCurrency}-${fromCurrency}`;
    if (rates[inverseKey]) {
      return amount / rates[inverseKey];
    }

    // Conversión a través de USD
    if (fromCurrency !== "USD" && toCurrency !== "USD") {
      const toUSD = this.convertCurrency(amount, fromCurrency, "USD");
      return this.convertCurrency(toUSD, "USD", toCurrency);
    }

    return amount; // Fallback
  }

  getCurrentDebt(client) {
    return client.history.reduce((total, entry) => {
      switch (entry.type) {
        case "initial":
        case "increase":
          return total + entry.amount;
        case "payment":
          return total - entry.amount;
        default:
          return total;
      }
    }, 0);
  }

  renderClients() {
    const container = document.getElementById("clientsContainer");
    const emptyState = document.getElementById("emptyState");

    if (this.clients.length === 0) {
      container.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    container.innerHTML = this.clients
      .map((client) => {
        const currentDebt = this.getCurrentDebt(client);
        const convertedDebt = this.convertCurrency(
          currentDebt,
          client.currency,
          this.globalCurrency
        );
        const currencySymbol = this.getCurrencySymbol(this.globalCurrency);

        return `
                <div class="client-card bg-white rounded-xl p-4 shadow-sm border hover-lift transition-all" data-client-id="${
                  client.id
                }">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800 text-lg">${
                              client.name
                            }</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="currency-indicator currency-${client.currency
                                  .toLowerCase()
                                  .replace(
                                    "_",
                                    "-"
                                  )} text-sm text-gray-600 pl-3">
                                    ${this.getCurrencyLabel(client.currency)}
                                </span>
                            </div>
                        </div>
                        <button onclick="debtManager.deleteClient(${
                          client.id
                        })" 
                                class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors touch-friendly">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <div class="debt-amount text-2xl font-bold ${
                          convertedDebt >= 0 ? "text-red-600" : "text-green-600"
                        }">
                            ${currencySymbol}${Math.abs(convertedDebt).toFixed(
          2
        )}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${convertedDebt >= 0 ? "Debe" : "A favor"}
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mb-3">
                        <div class="flex-1">
                            <input type="number" 
                                   id="amount-${client.id}" 
                                   placeholder="Monto" 
                                   step="0.01" 
                                   min="0.01"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button onclick="debtManager.addPayment(${client.id})" 
                                class="btn-feedback bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors touch-friendly">
                            Pago
                        </button>
                        <button onclick="debtManager.addIncrease(${client.id})" 
                                class="btn-feedback bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors touch-friendly">
                            + Deuda
                        </button>
                    </div>
                    
                    <button onclick="debtManager.toggleHistory(${client.id})" 
                            class="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2 flex items-center justify-between transition-colors">
                        <span>Ver historial (${client.history.length})</span>
                        <svg class="w-4 h-4 transform transition-transform" id="arrow-${
                          client.id
                        }">
                            <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    
                    <div id="history-${client.id}" class="history-content">
                        <div class="history-scroll space-y-2">
                            ${client.history
                              .slice()
                              .reverse()
                              .map(
                                (entry) => `
                                <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                                    <div>
                                        <span class="font-medium ${this.getEntryColor(
                                          entry.type
                                        )}">${this.getEntryLabel(
                                  entry.type
                                )}</span>
                                        <div class="text-gray-600">${
                                          entry.description || ""
                                        }</div>
                                        <div class="text-xs text-gray-500">${
                                          entry.date
                                        }</div>
                                    </div>
                                    <span class="font-medium ${this.getEntryColor(
                                      entry.type
                                    )}">
                                        ${this.getCurrencySymbol(
                                          client.currency
                                        )}${entry.amount.toFixed(2)}
                                    </span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  addPayment(clientId) {
    const input = document.getElementById(`amount-${clientId}`);
    const amount = parseFloat(input.value);

    if (isNaN(amount) || amount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    this.addHistoryEntry(clientId, "payment", amount, `Pago recibido`);
    input.value = "";
  }

  addIncrease(clientId) {
    const input = document.getElementById(`amount-${clientId}`);
    const amount = parseFloat(input.value);

    if (isNaN(amount) || amount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }

    this.addHistoryEntry(clientId, "increase", amount, `Aumento de deuda`);
    input.value = "";
  }

  addHistoryEntry(clientId, type, amount, description) {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client) return;

    client.history.push({
      type,
      amount,
      description,
      date: new Date().toLocaleDateString("es-ES"),
      timestamp: Date.now(),
    });

    this.saveData();
    this.renderClients();

    // Feedback visual
    const card = document.querySelector(`[data-client-id="${clientId}"]`);
    if (card) {
      card.style.transform = "scale(1.02)";
      setTimeout(() => {
        card.style.transform = "";
      }, 200);
    }
  }

  toggleHistory(clientId) {
    const historyDiv = document.getElementById(`history-${clientId}`);
    const arrow = document.getElementById(`arrow-${clientId}`);

    if (historyDiv.classList.contains("expanded")) {
      historyDiv.classList.remove("expanded");
      arrow.style.transform = "";
    } else {
      historyDiv.classList.add("expanded");
      arrow.style.transform = "rotate(180deg)";
    }
  }

  deleteClient(clientId) {
    this.currentDeleteId = clientId;
    this.openModal("deleteModal");
  }

  confirmDelete() {
    if (this.currentDeleteId) {
      const card = document.querySelector(
        `[data-client-id="${this.currentDeleteId}"]`
      );
      if (card) {
        card.classList.add("removing");
        setTimeout(() => {
          this.clients = this.clients.filter(
            (c) => c.id !== this.currentDeleteId
          );
          this.saveData();
          this.renderClients();
        }, 300);
      }
      this.currentDeleteId = null;
      this.closeModal("deleteModal");
    }
  }

  updateRatesDisplay() {
    const container = document.getElementById("currentRates");
    const rates = this.exchangeRates;

    const rateLabels = {
      "USD-CUP_CASH": "USD → CUP Efectivo",
      "USD-CUP_TRANSFER": "USD → CUP Transferencia",
      "CUP_CASH-CUP_TRANSFER": "CUP Efectivo → CUP Transferencia",
    };

    container.innerHTML =
      Object.entries(rates)
        .map(
          ([key, rate]) => `
                <div class="flex justify-between items-center py-1">
                    <span>${rateLabels[key] || key}</span>
                    <span class="font-medium">${rate.toFixed(4)}</span>
                </div>
            `
        )
        .join("") ||
      '<div class="text-gray-400">No hay tasas configuradas</div>';
  }

  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      CUP_CASH: "₱",
      CUP_TRANSFER: "₱",
    };
    return symbols[currency] || "$";
  }

  getCurrencyLabel(currency) {
    const labels = {
      USD: "USD",
      CUP_CASH: "CUP Efectivo",
      CUP_TRANSFER: "CUP Transferencia",
    };
    return labels[currency] || currency;
  }

  getEntryColor(type) {
    const colors = {
      initial: "text-blue-600",
      payment: "text-green-600",
      increase: "text-red-600",
    };
    return colors[type] || "text-gray-600";
  }

  getEntryLabel(type) {
    const labels = {
      initial: "Deuda inicial",
      payment: "Pago",
      increase: "Aumento",
    };
    return labels[type] || type;
  }

  saveData() {
    localStorage.setItem("debtClients", JSON.stringify(this.clients));
    localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
  }
}

// Inicializar la aplicación
let debtManager;

document.addEventListener("DOMContentLoaded", () => {
  debtManager = new DebtManager();
});

// Eventos táctiles mejorados
document.addEventListener("touchstart", (e) => {
  if (e.target.classList.contains("btn-feedback")) {
    e.target.style.transform = "scale(0.98)";
  }
});

document.addEventListener("touchend", (e) => {
  if (e.target.classList.contains("btn-feedback")) {
    setTimeout(() => {
      e.target.style.transform = "";
    }, 100);
  }
});

// Prevenir zoom en inputs en iOS
document.addEventListener("touchstart", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
    e.target.style.fontSize = "16px";
  }
});

// Manejar orientación de dispositivo
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    // Reajustar modales si están abiertos
    const openModal = document.querySelector(".modal.show");
    if (openModal) {
      openModal.scrollTop = 0;
    }
  }, 100);
});

// Service Worker para mejor rendimiento (opcional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Registrar service worker si existe
    // navigator.serviceWorker.register('/sw.js');
  });
}

// Utilidades adicionales
class Utils {
  static formatCurrency(amount, currency) {
    const symbols = {
      USD: "$",
      CUP_CASH: "₱",
      CUP_TRANSFER: "₱",
    };

    return `${symbols[currency] || "$"}${Math.abs(amount).toFixed(2)}`;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static vibrate(pattern = [50]) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  static showToast(message, type = "info") {
    // Crear toast notification
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 left-4 right-4 mx-auto max-w-sm bg-white border rounded-lg shadow-lg p-4 z-50 transform translate-y-full transition-transform`;

    const colors = {
      success: "border-green-500 text-green-800",
      error: "border-red-500 text-red-800",
      info: "border-blue-500 text-blue-800",
    };

    toast.className += ` ${colors[type] || colors.info}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = "translateY(0)";
    }, 100);

    setTimeout(() => {
      toast.style.transform = "translateY(100%)";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Exportar utilidades globalmente
window.Utils = Utils;

// Manejar errores globales
window.addEventListener("error", (e) => {
  console.error("Error global:", e.error);
  Utils.showToast("Ocurrió un error inesperado", "error");
});

// Manejar promesas rechazadas
window.addEventListener("unhandledrejection", (e) => {
  console.error("Promesa rechazada:", e.reason);
  Utils.showToast("Error de conexión", "error");
});

// Optimizaciones de rendimiento
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in");
      }
    });
  },
  { threshold: 0.1 }
);

// Observar nuevos elementos cuando se agreguen
const observeNewElements = () => {
  document.querySelectorAll(".client-card:not(.observed)").forEach((card) => {
    observer.observe(card);
    card.classList.add("observed");
  });
};

// Llamar después de renderizar
document.addEventListener("clientsRendered", observeNewElements);
