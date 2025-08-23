// Gestor de Deudas - JavaScript Principal
class DebtManager {
  constructor() {
    this.clients = JSON.parse(localStorage.getItem("debtClients") || "[]");
    this.exchangeRates = JSON.parse(
      localStorage.getItem("exchangeRates") || "{}"
    );
    this.globalCurrency = localStorage.getItem("globalCurrency") || "USD";
    this.currentDeleteId = null;
    this.currentDeleteOperation = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderClients();
    this.updateGlobalCurrency();
    this.updateRatesDisplay();
    this.setDefaultRates();
    this.updateCurrencyLabels();
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
    document
      .getElementById("showPaidClientsBtn")
      .addEventListener("click", () => this.togglePaidClients());

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

    // Selectores de moneda en configuración
    document
      .getElementById("fromCurrency")
      .addEventListener("change", () => this.updateCurrencyLabels());
    document
      .getElementById("toCurrency")
      .addEventListener("change", () => this.updateCurrencyLabels());

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

    // Modales de eliminación
    document
      .getElementById("cancelDelete")
      .addEventListener("click", () => this.closeModal("deleteModal"));
    document
      .getElementById("confirmDelete")
      .addEventListener("click", () => this.confirmDelete());
    document
      .getElementById("cancelDeleteOperation")
      .addEventListener("click", () => this.closeModal("deleteOperationModal"));
    document
      .getElementById("confirmDeleteOperation")
      .addEventListener("click", () => this.confirmDeleteOperation());
  }

  updateCurrencyLabels() {
    const fromCurrency = document.getElementById("fromCurrency").value;
    const toCurrency = document.getElementById("toCurrency").value;

    document.getElementById("fromLabel").textContent =
      this.getCurrencyLabel(fromCurrency);
    document.getElementById("toLabel").textContent =
      this.getCurrencyLabel(toCurrency);

    // Cargar tasa existente si existe
    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    if (rate && rate !== 1) {
      document.getElementById("conversionRate").value = rate;
    } else {
      document.getElementById("conversionRate").value = "";
    }
  }

  getExchangeRate(from, to) {
    if (from === to) return 1;

    const directKey = `${from}-${to}`;
    const inverseKey = `${to}-${from}`;

    if (this.exchangeRates[directKey]) {
      return this.exchangeRates[directKey];
    } else if (this.exchangeRates[inverseKey]) {
      return 1 / this.exchangeRates[inverseKey];
    }

    return null;
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

    if (modalId === "configRatesModal") {
      this.updateCurrencyLabels();
    }
  }

  handleAddClient(e) {
    e.preventDefault();

    const name = document.getElementById("clientName").value.trim();
    const initialDebt = parseFloat(
      document.getElementById("initialDebt").value
    );
    const currency = document.getElementById("clientCurrency").value;

    const errors = this.validateClientForm(name, initialDebt, currency);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const client = {
      id: Date.now(),
      name,
      currency,
      history: [
        {
          id: Date.now(),
          type: "initial",
          amount: initialDebt,
          date: new Date().toLocaleDateString("es-ES"),
          timestamp: Date.now(),
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

    const fromCurrency = document.getElementById("fromCurrency").value;
    const toCurrency = document.getElementById("toCurrency").value;
    const rate = parseFloat(document.getElementById("conversionRate").value);

    if (fromCurrency === toCurrency) {
      alert("Selecciona monedas diferentes");
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      alert("Ingresa una tasa válida");
      return;
    }

    // Guardar la tasa
    const key = `${fromCurrency}-${toCurrency}`;
    this.exchangeRates[key] = rate;

    // Eliminar la tasa inversa si existe para evitar inconsistencias
    const inverseKey = `${toCurrency}-${fromCurrency}`;
    if (this.exchangeRates[inverseKey]) {
      delete this.exchangeRates[inverseKey];
    }

    this.saveData();
    this.renderClients();
    this.updateRatesDisplay();
    this.closeModal("configRatesModal");
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

    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    if (rate) {
      return amount * rate;
    }

    // Conversión a través de otra moneda
    const currencies = ["USD", "CUP_CASH", "CUP_TRANSFER"];
    for (const intermediateCurrency of currencies) {
      if (
        intermediateCurrency !== fromCurrency &&
        intermediateCurrency !== toCurrency
      ) {
        const rate1 = this.getExchangeRate(fromCurrency, intermediateCurrency);
        const rate2 = this.getExchangeRate(intermediateCurrency, toCurrency);

        if (rate1 && rate2) {
          return amount * rate1 * rate2;
        }
      }
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

  isPaidOff(client) {
    const debt = this.getCurrentDebt(client);
    return Math.abs(debt) < 0.01; // Consideramos pagado si la deuda es menor a 1 centavo
  }

  renderClients() {
    const container = document.getElementById("clientsContainer");
    const paidContainer = document.getElementById("paidClientsList");
    const emptyState = document.getElementById("emptyState");
    const showPaidBtn = document.getElementById("showPaidClientsBtn");

    const activeClients = this.clients.filter(
      (client) => !this.isPaidOff(client)
    );
    const paidClients = this.clients.filter((client) => this.isPaidOff(client));

    // Mostrar/ocultar botón de clientes pagados
    if (paidClients.length > 0) {
      showPaidBtn.classList.remove("hidden");
    } else {
      showPaidBtn.classList.add("hidden");
      document.getElementById("paidClientsContainer").classList.add("hidden");
    }

    if (this.clients.length === 0) {
      container.innerHTML = "";
      paidContainer.innerHTML = "";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Renderizar clientes activos
    container.innerHTML = activeClients
      .map((client) => this.renderClientCard(client))
      .join("");

    // Renderizar clientes pagados
    paidContainer.innerHTML = paidClients
      .map((client) => this.renderClientCard(client, true))
      .join("");
  }

  renderClientCard(client, isPaid = false) {
    const currentDebt = this.getCurrentDebt(client);
    const convertedDebt = this.convertCurrency(
      currentDebt,
      client.currency,
      this.globalCurrency
    );
    const currencySymbol = this.getCurrencySymbol(this.globalCurrency);

    return `
            <div class="client-card ${
              isPaid ? "paid" : ""
            } bg-white rounded-xl p-4 shadow-sm border hover-lift transition-all" data-client-id="${
      client.id
    }">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="client-name font-semibold text-gray-800 text-lg">${
                          client.name
                        }</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="currency-indicator currency-${client.currency
                              .toLowerCase()
                              .replace("_", "-")} text-sm text-gray-600 pl-3">
                                ${this.getCurrencyLabel(client.currency)}
                            </span>
                        </div>
                    </div>
                    <button onclick="debtManager.deleteClient(${client.id})" 
                            class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors touch-friendly">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                       </svg>
                   </button>
               </div>
               
               <div class="mb-4">
                   <div class="debt-amount text-2xl font-bold ${
                     convertedDebt >= 0.01
                       ? "text-red-600"
                       : Math.abs(convertedDebt) < 0.01
                       ? "text-green-600"
                       : "text-blue-600"
                   }">
                       ${currencySymbol}${Math.abs(convertedDebt).toFixed(2)}
                   </div>
                   <div class="text-sm text-gray-500">
                       ${
                         convertedDebt >= 0.01
                           ? "Debe"
                           : Math.abs(convertedDebt) < 0.01
                           ? "Pagado"
                           : "A favor"
                       }
                   </div>
               </div>
               
               ${
                 !isPaid
                   ? `
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
                           class="btn-feedback btn-payment text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-friendly">
                       Pago
                   </button>
                   <button onclick="debtManager.addIncrease(${client.id})" 
                           class="btn-feedback btn-increase text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-friendly">
                       + Deuda
                   </button>
               </div>
               `
                   : ""
               }
               
               <button onclick="debtManager.toggleHistory(${client.id})" 
                       class="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2 flex items-center justify-between transition-colors">
                   <span>Ver historial (${client.history.length})</span>
                   <svg class="w-4 h-4 transform transition-transform" id="arrow-${
                     client.id
                   }" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M7 10l5 5 5-5z"/>
                   </svg>
               </button>
               
               <div id="history-${client.id}" class="history-content">
                   <div class="history-scroll space-y-2">
                       ${client.history
                         .slice()
                         .reverse()
                         .map(
                           (entry) => `
                           <div class="history-entry flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                               <div class="flex-1">
                                   <span class="font-medium ${this.getEntryColor(
                                     entry.type
                                   )}">${this.getEntryLabel(entry.type)}</span>
                                   ${
                                     entry.description
                                       ? `<div class="text-gray-600">${entry.description}</div>`
                                       : ""
                                   }
                                   <div class="text-xs text-gray-500">${
                                     entry.date
                                   }</div>
                               </div>
                               <div class="flex items-center gap-2">
                                   <span class="font-medium ${this.getEntryColor(
                                     entry.type
                                   )}">
                                       ${this.getCurrencySymbol(
                                         client.currency
                                       )}${entry.amount.toFixed(2)}
                                   </span>
                                   ${
                                     entry.type !== "initial"
                                       ? `
                                       <button onclick="debtManager.deleteOperation(${client.id}, ${entry.id})" 
                                               class="delete-operation text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                           </svg>
                                       </button>
                                   `
                                       : ""
                                   }
                               </div>
                           </div>
                       `
                         )
                         .join("")}
                   </div>
               </div>
           </div>
       `;
  }

  togglePaidClients() {
    const container = document.getElementById("paidClientsContainer");
    const btn = document.getElementById("showPaidClientsBtn");

    if (container.classList.contains("hidden")) {
      container.classList.remove("hidden");
      btn.textContent = "Ocultar Pagados";
    } else {
      container.classList.add("hidden");
      btn.textContent = "Ver Pagados";
    }
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
      id: Date.now() + Math.random(), // ID único para cada operación
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

  deleteOperation(clientId, operationId) {
    this.currentDeleteOperation = { clientId, operationId };
    this.openModal("deleteOperationModal");
  }

  confirmDeleteOperation() {
    if (this.currentDeleteOperation) {
      const { clientId, operationId } = this.currentDeleteOperation;
      const client = this.clients.find((c) => c.id === clientId);

      if (client) {
        client.history = client.history.filter(
          (entry) => entry.id !== operationId
        );
        this.saveData();
        this.renderClients();
      }

      this.currentDeleteOperation = null;
    }
    this.closeModal("deleteOperationModal");
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
    }
    this.closeModal("deleteModal");
  }

  updateRatesDisplay() {
    const container = document.getElementById("currentRates");
    const rates = this.exchangeRates;

    if (Object.keys(rates).length === 0) {
      container.innerHTML =
        '<p class="text-gray-500">No hay tasas configuradas</p>';
      return;
    }

    const rateLabels = {
      USD: "USD",
      CUP_CASH: "CUP Efectivo",
      CUP_TRANSFER: "CUP Transferencia",
    };

    container.innerHTML = Object.entries(rates)
      .map(([key, value]) => {
        const [from, to] = key.split("-");
        return `
                   <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                       <span>1 ${rateLabels[from]} = ${value.toFixed(4)} ${
          rateLabels[to]
        }</span>
                       <button onclick="debtManager.deleteRate('${key}')" 
                               class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                           </svg>
                       </button>
                   </div>
               `;
      })
      .join("");
  }

  deleteRate(rateKey) {
    if (confirm("¿Estás seguro de que quieres eliminar esta tasa?")) {
      delete this.exchangeRates[rateKey];
      this.saveData();
      this.updateRatesDisplay();
      this.renderClients();
    }
  }

  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      CUP_CASH: "$",
      CUP_TRANSFER: "$",
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
      initial: "Inicial",
      payment: "Pago",
      increase: "Aumento",
    };
    return labels[type] || type;
  }

  validateClientForm(name, debt, currency) {
    const errors = [];

    if (!name.trim()) {
      errors.push("El nombre es obligatorio");
    } else if (name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (isNaN(debt) || debt < 0) {
      errors.push("La deuda debe ser un número positivo o cero");
    }

    if (!["USD", "CUP_CASH", "CUP_TRANSFER"].includes(currency)) {
      errors.push("Selecciona una moneda válida");
    }

    // Verificar si ya existe un cliente con el mismo nombre
    if (
      this.clients.some(
        (client) =>
          client.name.toLowerCase().trim() === name.toLowerCase().trim()
      )
    ) {
      errors.push("Ya existe un cliente con ese nombre");
    }

    return errors;
  }

  saveData() {
    localStorage.setItem("debtClients", JSON.stringify(this.clients));
    localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
    localStorage.setItem("globalCurrency", this.globalCurrency);
  }

  // Métodos de utilidad adicionales
  exportData() {
    const data = {
      clients: this.clients,
      exchangeRates: this.exchangeRates,
      globalCurrency: this.globalCurrency,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gestor-deudas-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getStatistics() {
    const stats = {
      totalClients: this.clients.length,
      activeClients: this.clients.filter((c) => !this.isPaidOff(c)).length,
      paidClients: this.clients.filter((c) => this.isPaidOff(c)).length,
      totalDebt: 0,
      totalCredit: 0,
    };

    this.clients.forEach((client) => {
      const debt = this.getCurrentDebt(client);
      const convertedDebt = this.convertCurrency(
        debt,
        client.currency,
        this.globalCurrency
      );

      if (convertedDebt > 0) {
        stats.totalDebt += convertedDebt;
      } else if (convertedDebt < 0) {
        stats.totalCredit += Math.abs(convertedDebt);
      }
    });

    return stats;
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.debtManager = new DebtManager();

  // Agregar soporte para teclado en modales
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModal = document.querySelector(".modal.show");
      if (openModal) {
        debtManager.closeModal(openModal.id);
      }
    }
  });

  // Prevenir zoom en inputs en iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.addEventListener("touchstart", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
        e.target.style.fontSize = "16px";
      }
    });
  }

  // Mejoras de accesibilidad
  document.addEventListener("focusin", (e) => {
    if (e.target.matches("input, select, button")) {
      e.target.style.outline = "2px solid #3b82f6";
      e.target.style.outlineOffset = "2px";
    }
  });

  document.addEventListener("focusout", (e) => {
    if (e.target.matches("input, select, button")) {
      e.target.style.outline = "";
      e.target.style.outlineOffset = "";
    }
  });
});

// Exponer métodos útiles globalmente
window.debtManagerUtils = {
  exportData: () => window.debtManager.exportData(),
  getStatistics: () => window.debtManager.getStatistics(),
  clearAllData: () => {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer."
      )
    ) {
      localStorage.clear();
      location.reload();
    }
  },
};
