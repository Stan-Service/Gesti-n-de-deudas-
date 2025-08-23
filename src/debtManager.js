// debtManager.js - Lógica de negocio y datos
export class DebtManager {
  constructor() {
    this.clients = JSON.parse(localStorage.getItem("debtClients") || "[]");
    this.exchangeRates = JSON.parse(localStorage.getItem("exchangeRates") || "{}" );
    this.globalCurrency = localStorage.getItem("globalCurrency") || "USD";
    this.currentDeleteId = null;
    this.currentDeleteOperation = null;
  }

  // --- UI & Render Methods ---
  renderClients() {
    const clientsContainer = document.getElementById("clientsContainer");
    const paidClientsContainer = document.getElementById("paidClientsContainer");
    const paidClientsList = document.getElementById("paidClientsList");
    const emptyState = document.getElementById("emptyState");
    clientsContainer.innerHTML = "";
    paidClientsList.innerHTML = "";
    let hasActive = false;
    let hasPaid = false;
    this.clients.forEach((client) => {
      const isPaid = this.isPaidOff(client);
      const card = this.createClientCard(client, isPaid);
      if (isPaid) {
        paidClientsList.appendChild(card);
        hasPaid = true;
      } else {
        clientsContainer.appendChild(card);
        hasActive = true;
      }
    });
    clientsContainer.style.display = hasActive ? "grid" : "none";
    paidClientsContainer.style.display = hasPaid ? "block" : "none";
    emptyState.style.display = hasActive ? "none" : "block";
  }

  createClientCard(client, isPaid) {
    const card = document.createElement("div");
    card.className = `bg-white rounded-lg shadow-sm p-4 flex flex-col gap-2 border ${isPaid ? 'opacity-60' : ''}`;
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-bold">${client.name}</h3>
          <span class="text-sm text-gray-600">${this.getCurrencyLabel(client.currency || 'USD')}</span>
        </div>
        <div class="flex gap-2">
          <button class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700" title="Pago" ${isPaid ? 'disabled' : ''} data-action="pay" data-id="${client.id}">✔</button>
          <button class="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" title="Aumentar" ${isPaid ? 'disabled' : ''} data-action="increase" data-id="${client.id}">＋</button>
          <button class="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500" title="Ver historial" data-action="history" data-id="${client.id}">⏰</button>
          <button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" title="Eliminar" data-action="delete" data-id="${client.id}">🗑️</button>
        </div>
      </div>
      <div class="mt-2">
        <span class="font-bold text-xl">${this.getCurrencySymbol(this.globalCurrency)} ${this.formatAmount(this.convertCurrency(this.getCurrentDebt(client), client.currency || 'USD', this.globalCurrency))}</span>
      </div>
    `;
    // Eventos de los botones
    card.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (action === 'pay') this.openPayModal(id);
        if (action === 'increase') this.openIncreaseModal(id);
        if (action === 'history') this.openHistoryModal(id);
        if (action === 'delete') this.openDeleteModal(id);
      });
    });
    return card;
  }

  formatAmount(amount) {
    return Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- Modal Methods ---
  openModal(id) {
    document.getElementById(id).style.display = 'block';
  }
  closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  openPayModal(clientId) {
    this.injectOperationModal('payment', clientId);
  }
  openIncreaseModal(clientId) {
    this.injectOperationModal('increase', clientId);
  }
  openHistoryModal(clientId) {
    this.injectHistoryModal(clientId);
  }

  injectOperationModal(type, clientId) {
    this.removeDynamicModal();
    const client = this.clients.find(c => c.id == clientId);
    if (!client) return;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
    modal.id = 'dynamicOperationModal';
    const label = type === 'payment' ? 'Registrar Pago' : 'Aumentar Deuda';
    const btnLabel = type === 'payment' ? 'Registrar Pago' : 'Aumentar';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col animate-fadein">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">${label} - ${client.name}</h2>
          <button class="modal-close text-gray-500 hover:text-gray-700 text-2xl absolute right-4 top-4">&times;</button>
        </div>
        <form id="operationForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <input type="number" id="operationAmount" required step="0.01" min="0.01" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" placeholder="0.00">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <input type="text" id="operationDesc" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg" placeholder="Opcional">
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="modal-close flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors text-lg">Cancelar</button>
            <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg">${btnLabel}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => this.removeDynamicModal());
    modal.onclick = (e) => { if (e.target === modal) this.removeDynamicModal(); };
    modal.querySelector('#operationForm').onsubmit = (e) => {
      e.preventDefault();
      const amount = parseFloat(modal.querySelector('#operationAmount').value);
      const desc = modal.querySelector('#operationDesc').value || (type === 'payment' ? 'Pago' : 'Aumento');
      if (isNaN(amount) || amount <= 0) return alert('Cantidad inválida');
      this.addHistoryEntry(client.id, type, amount, desc);
      this.saveData();
      this.renderClients();
      this.removeDynamicModal();
    };
  }

  injectHistoryModal(clientId) {
    this.removeDynamicModal();
    const client = this.clients.find(c => c.id == clientId);
    if (!client) return;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
    modal.id = 'dynamicHistoryModal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col animate-fadein">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Historial - ${client.name}</h2>
          <button class="modal-close text-gray-500 hover:text-gray-700 text-2xl absolute right-4 top-4">&times;</button>
        </div>
        <div class="space-y-2" id="historyList">
          ${client.history.map(entry => `
            <div class="flex justify-between items-center border-b py-1">
              <div>
                <span class="${this.getEntryColor(entry.type)} font-bold">${this.getEntryLabel(entry.type)}</span>
                <span class="ml-2">${this.getCurrencySymbol(client.currency || 'USD')} ${this.formatAmount(entry.amount)}</span>
                <span class="ml-2 text-xs text-gray-400">${entry.date}</span>
                <span class="ml-2 text-xs text-gray-400">${entry.description || ''}</span>
              </div>
              ${entry.type !== 'initial' ? `<button class="text-red-600 hover:text-red-800 text-xl" data-opid="${entry.id}">🗑️</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => this.removeDynamicModal());
    modal.onclick = (e) => { if (e.target === modal) this.removeDynamicModal(); };
    // Eliminar operación
    modal.querySelectorAll('button[data-opid]').forEach(btn => {
      btn.onclick = () => {
        this.currentDeleteOperation = { clientId, operationId: btn.getAttribute('data-opid') };
        this.removeDynamicModal();
        this.openModal('deleteOperationModal');
      };
    });
  }

  removeDynamicModal() {
  document.querySelectorAll('#dynamicOperationModal, #dynamicHistoryModal').forEach(m => m.remove());
  }
  openDeleteModal(clientId) {
    this.currentDeleteId = clientId;
    this.openModal('deleteModal');
  }
  togglePaidClients() {
    const paid = document.getElementById('paidClientsContainer');
    paid.classList.toggle('hidden');
  }

  // --- Form Handlers ---
  handleAddClient(e) {
    e.preventDefault();
    const name = document.getElementById('clientName').value;
    const debt = parseFloat(document.getElementById('initialDebt').value);
    const currency = document.getElementById('clientCurrency').value;
    const errors = this.validateClientForm(name, debt, currency);
    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }
    const client = {
      id: Date.now() + Math.random(),
      name,
      currency,
      history: [
        { id: Date.now() + Math.random(), type: 'initial', amount: debt, description: 'Deuda inicial', date: new Date().toLocaleDateString('es-ES'), timestamp: Date.now() }
      ]
    };
    this.clients.push(client);
    this.saveData();
    this.renderClients();
    this.closeModal('addClientModal');
    document.getElementById('addClientForm').reset();
  }

  handleConfigRates(e) {
    e.preventDefault();
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    const rate = parseFloat(document.getElementById('conversionRate').value);
    if (from === to) {
      alert('No puedes convertir una moneda a sí misma.');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      alert('La tasa debe ser un número positivo.');
      return;
    }
    this.exchangeRates[`${from}-${to}`] = rate;
    this.saveData();
    this.updateRatesDisplay();
    this.closeModal('configRatesModal');
    document.getElementById('configRatesForm').reset();
  }

  changeGlobalCurrency(currency) {
    this.globalCurrency = currency;
    this.saveData();
    this.renderClients();
  }

  confirmDelete() {
    if (this.currentDeleteId) {
      this.deleteClient(this.currentDeleteId);
      this.renderClients();
      this.closeModal('deleteModal');
      this.currentDeleteId = null;
    }
  }

  confirmDeleteOperation() {
    if (this.currentDeleteOperation) {
      const { clientId, operationId } = this.currentDeleteOperation;
      this.deleteOperation(clientId, operationId);
      this.renderClients();
      this.closeModal('deleteOperationModal');
      this.currentDeleteOperation = null;
    }
  }

  // --- UI Helpers ---
  updateGlobalCurrency() {
    document.getElementById('globalCurrency').value = this.globalCurrency;
  }

  updateRatesDisplay() {
    const currentRates = document.getElementById('currentRates');
    if (!currentRates) return;
    currentRates.innerHTML = Object.entries(this.exchangeRates).map(([k, v]) => {
      const [from, to] = k.split('-');
      return `<div>${this.getCurrencyLabel(from)} → ${this.getCurrencyLabel(to)}: <span class="font-bold">${v}</span></div>`;
    }).join('') || '<div class="text-gray-400">No hay tasas configuradas</div>';
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
    this.updateRatesDisplay();
  }

  updateCurrencyLabels() {
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;
    document.getElementById('fromLabel').textContent = this.getCurrencyLabel(from);
    document.getElementById('toLabel').textContent = this.getCurrencyLabel(to);
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
    return Math.abs(debt) < 0.01;
  }

  addHistoryEntry(clientId, type, amount, description) {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client) return;
    let originalAmount = arguments[4];
    let originalCurrency = arguments[5];
    client.history.push({
      id: Date.now() + Math.random(),
      type,
      amount,
      description,
      date: new Date().toLocaleDateString("es-ES"),
      timestamp: Date.now(),
      originalAmount: originalAmount !== undefined ? originalAmount : amount,
      originalCurrency: originalCurrency !== undefined ? originalCurrency : "USD",
    });
    this.saveData();
  }

  deleteOperation(clientId, operationId) {
    const client = this.clients.find((c) => c.id === clientId);
    if (!client) return;
    client.history = client.history.filter((entry) => entry.id !== operationId);
    this.saveData();
  }

  deleteClient(clientId) {
    this.clients = this.clients.filter((c) => c.id !== clientId);
    this.saveData();
  }

  saveData() {
    localStorage.setItem("debtClients", JSON.stringify(this.clients));
    localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
    localStorage.setItem("globalCurrency", this.globalCurrency);
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
        "USD",
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
