/**
 * @typedef {Object} DebtOperation
 * @property {number} id - ID único de la operación
 * @property {string} type - Tipo de operación ('initial', 'payment', 'addition')
 * @property {number} amount - Monto de la operación
 * @property {string} description - Descripción de la operación
 * @property {string} date - Fecha formateada de la operación
 * @property {number} timestamp - Timestamp de la operación
 */

/**
 * @typedef {Object} Client
 * @property {number} id - ID único del cliente
 * @property {string} name - Nombre del cliente
 * @property {string} currency - Moneda del cliente ('USD', 'CUP_CASH', 'CUP_TRANSFER')
 * @property {DebtOperation[]} history - Historial de operaciones
 */

/**
 * Clase principal para la gestión de deudas de clientes
 * @class
 */
export class DebtManager {
  /**
   * Inicializa una nueva instancia de DebtManager
   * @constructor
   */
  constructor() {
    /** @type {Client[]} */
    this.clients = [];
    /** @type {Object.<string, number>} */
    this.exchangeRates = {};
    /** @type {string} */
    this.globalCurrency = 'USD';
    /** @type {number|null} */
    this.currentDeleteId = null;
    /** @type {string|null} */
    this.currentDeleteOperation = null;

    // Intentar cargar datos del localStorage con manejo de errores
    try {
      this.clients = JSON.parse(localStorage.getItem("debtClients") || "[]");
      this.exchangeRates = JSON.parse(localStorage.getItem("exchangeRates") || "{}");
      this.globalCurrency = localStorage.getItem("globalCurrency") || "USD";
    } catch (error) {
      console.error('Error al cargar datos:', error);
      // En caso de error, mantener los valores por defecto
    }

    // Validar la integridad de los datos al cargar
    this._validateData();

    // Registrar el manejador para limpiar modales al cerrar la ventana
    window.addEventListener('beforeunload', () => this.removeDynamicModal());
  }

  /**
   * Valida la integridad de los datos cargados
   * @private
   */
  _validateData() {
    // Validar y reparar clientes si es necesario
    this.clients = this.clients.filter(client => 
      client && 
      typeof client.id === 'number' && 
      typeof client.name === 'string' &&
      ['USD', 'CUP_CASH', 'CUP_TRANSFER'].includes(client.currency) &&
      Array.isArray(client.history)
    );

    // Validar y reparar tasas de cambio
    const validRates = {};
    for (const [key, value] of Object.entries(this.exchangeRates)) {
      if (typeof value === 'number' && value > 0 && key.includes('-')) {
        validRates[key] = value;
      }
    }
    this.exchangeRates = validRates;

    // Validar moneda global
    if (!['USD', 'CUP_CASH', 'CUP_TRANSFER'].includes(this.globalCurrency)) {
      this.globalCurrency = 'USD';
    }

    // Guardar datos validados
    this.saveData();
  }

  // Modal para agregar cliente
  openAddClientModal() {
    this.removeDynamicModal();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
    modal.id = 'dynamicAddClientModal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Agregar Cliente</h2>
          <button class="modal-close text-gray-500 hover:text-gray-700 text-2xl absolute right-4 top-4">&times;</button>
        </div>
        <form id="addClientForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente</label>
            <input type="text" id="clientName" required class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nombre completo">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Deuda Inicial</label>
            <input type="number" id="initialDebt" required step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            <select id="clientCurrency" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="USD">USD</option>
              <option value="CUP_CASH">CUP Efectivo</option>
              <option value="CUP_TRANSFER">CUP Transferencia</option>
            </select>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="modal-close flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">Agregar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => this.removeDynamicModal());
    modal.onclick = (e) => { if (e.target === modal) this.removeDynamicModal(); };
    modal.querySelector('#addClientForm').onsubmit = (e) => {
      e.preventDefault();
      const name = modal.querySelector('#clientName').value;
      const debt = parseFloat(modal.querySelector('#initialDebt').value);
      const currency = modal.querySelector('#clientCurrency').value;
      if (!name.trim() || isNaN(debt) || debt < 0) {
        alert('Datos inválidos');
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
      this.removeDynamicModal();
    };
  }

  // Modal para configurar tasas
  openConfigRatesModal() {
    this.removeDynamicModal();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
    modal.id = 'dynamicConfigRatesModal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Configurar Tasas de Conversión</h2>
          <button class="modal-close text-gray-500 hover:text-gray-700 text-2xl absolute right-4 top-4">&times;</button>
        </div>
        <form id="configRatesForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <select id="fromCurrency" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="USD">USD</option>
                <option value="CUP_CASH">CUP Efectivo</option>
                <option value="CUP_TRANSFER">CUP Transferencia</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Hacia</label>
              <select id="toCurrency" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="CUP_CASH">CUP Efectivo</option>
                <option value="CUP_TRANSFER">CUP Transferencia</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tasa de Conversión</label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">1 <span id="fromLabel">USD</span> =</span>
              <input type="number" id="conversionRate" required step="0.0001" min="0.0001" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="1.0000">
              <span class="text-sm text-gray-600" id="toLabel">CUP Efectivo</span>
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="modal-close flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">Guardar</button>
          </div>
        </form>
        <div class="mt-6 pt-6 border-t">
          <h3 class="font-medium text-gray-700 mb-3">Tasas Actuales</h3>
          <div id="currentRates" class="text-sm text-gray-600 space-y-1"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => this.removeDynamicModal());
    modal.onclick = (e) => { if (e.target === modal) this.removeDynamicModal(); };
    const fromCurrency = modal.querySelector('#fromCurrency');
    const toCurrency = modal.querySelector('#toCurrency');
    const fromLabel = modal.querySelector('#fromLabel');
    const toLabel = modal.querySelector('#toLabel');
    fromCurrency.onchange = toCurrency.onchange = () => {
      fromLabel.textContent = fromCurrency.value === 'CUP_CASH' ? 'CUP Efectivo' : fromCurrency.value === 'CUP_TRANSFER' ? 'CUP Transferencia' : fromCurrency.value;
      toLabel.textContent = toCurrency.value === 'CUP_CASH' ? 'CUP Efectivo' : toCurrency.value === 'CUP_TRANSFER' ? 'CUP Transferencia' : toCurrency.value;
    };
    modal.querySelector('#configRatesForm').onsubmit = (e) => {
      e.preventDefault();
      const from = fromCurrency.value;
      const to = toCurrency.value;
      const rate = parseFloat(modal.querySelector('#conversionRate').value);
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
      this.removeDynamicModal();
    };
    this.updateRatesDisplay();
  }

  // Métodos utilitarios mínimos
  removeDynamicModal() {
    const modal = document.getElementById('dynamicAddClientModal') || document.getElementById('dynamicConfigRatesModal');
    if (modal) modal.remove();
  }
  saveData() {
    localStorage.setItem("debtClients", JSON.stringify(this.clients));
    localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
    localStorage.setItem("globalCurrency", this.globalCurrency);
  }
  /**
   * Renderiza la lista de clientes en el DOM
   * @public
   */
  renderClients() {
    const clientsList = document.getElementById('clientsList');
    if (!clientsList) return;

    // Limpiar event listeners previos
    const oldList = clientsList.cloneNode(false);
    clientsList.parentNode.replaceChild(oldList, clientsList);

    if (this.clients.length === 0) {
      oldList.innerHTML = '<div class="text-gray-500 text-center py-8">No hay clientes registrados</div>';
      return;
    }

    oldList.innerHTML = this.clients.map(client => {
      const totalDebt = this._calculateTotalDebt(client);
      const debtClass = totalDebt > 0 ? 'red' : 'green';
      
      return `
        <div class="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-lg font-semibold">${this._escapeHtml(client.name)}</h3>
            <span class="px-2 py-1 bg-${debtClass}-100 text-${debtClass}-800 rounded text-sm">
              ${this._formatCurrency(totalDebt, client.currency)}
            </span>
          </div>
          <div class="space-y-2">
            ${client.history.map(op => `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">${op.date} - ${this._escapeHtml(op.description)}</span>
                <span class="font-medium ${op.type === 'payment' ? 'text-green-600' : 'text-red-600'}">
                  ${op.type === 'payment' ? '-' : '+'} ${this._formatCurrency(op.amount, client.currency)}
                </span>
              </div>
            `).join('')}
          </div>
          <div class="mt-4 flex gap-2">
            <button data-action="add-operation" data-client-id="${client.id}"
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Agregar Operación
            </button>
            <button data-action="delete-client" data-client-id="${client.id}"
              class="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm">
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Agregar event listeners usando delegación de eventos
    oldList.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const clientId = parseInt(button.dataset.clientId, 10);
      if (isNaN(clientId)) return;

      switch (button.dataset.action) {
        case 'add-operation':
          this.openAddOperationModal(clientId);
          break;
        case 'delete-client':
          this.deleteClient(clientId);
          break;
      }
    });
  }

  /**
   * Actualiza la visualización de las tasas de cambio
   * @public
   */
  updateRatesDisplay() {
    const ratesDiv = document.getElementById('currentRates');
    if (!ratesDiv) return;

    const rateEntries = Object.entries(this.exchangeRates)
      .map(([key, rate]) => {
        const [from, to] = key.split('-');
        const fromLabel = this._getCurrencyLabel(from);
        const toLabel = this._getCurrencyLabel(to);
        return `
          <div class="flex justify-between items-center">
            <span>1 ${fromLabel} = ${rate.toFixed(4)} ${toLabel}</span>
            <button onclick="debtManager.deleteRate('${key}')"
              class="text-red-500 hover:text-red-700 text-sm ml-2">&times;</button>
          </div>
        `;
      });

    ratesDiv.innerHTML = rateEntries.length 
      ? rateEntries.join('')
      : '<div class="text-gray-500">No hay tasas configuradas</div>';
  }

  /**
   * Obtiene la etiqueta legible de una moneda
   * @private
   * @param {string} currency - Código de la moneda
   * @returns {string} Etiqueta legible de la moneda
   */
  _getCurrencyLabel(currency) {
    switch (currency) {
      case 'CUP_CASH': return 'CUP Efectivo';
      case 'CUP_TRANSFER': return 'CUP Transferencia';
      default: return currency;
    }
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   * @private
   * @param {string} str - Cadena a escapar
   * @returns {string} Cadena escapada
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Formatea un valor monetario
   * @private
   * @param {number} amount - Cantidad a formatear
   * @param {string} currency - Código de la moneda
   * @returns {string} Cantidad formateada
   */
  /**
   * Calcula la deuda total de un cliente
   * @private
   * @param {Client} client - Cliente a calcular
   * @returns {number} Deuda total
   */
  _calculateTotalDebt(client) {
    if (!client?.history) return 0;
    return client.history.reduce((sum, op) => 
      sum + (op.type === 'initial' || op.type === 'addition' ? op.amount : -op.amount), 0
    );
  }

  /**
   * Formatea un valor monetario
   * @private
   * @param {number} amount - Cantidad a formatear
   * @param {string} currency - Código de la moneda
   * @returns {string} Cantidad formateada
   */
  _formatCurrency(amount, currency) {
    try {
      const formatter = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `${formatter.format(Math.abs(amount))} ${this._getCurrencyLabel(currency)}`;
    } catch (error) {
      console.error('Error al formatear moneda:', error);
      return `${Math.abs(amount).toFixed(2)} ${this._getCurrencyLabel(currency)}`;
    }
  }

  /**
   * Convierte un monto entre monedas
   * @private
   * @param {number} amount - Cantidad a convertir
   * @param {string} fromCurrency - Moneda origen
   * @param {string} toCurrency - Moneda destino
   * @returns {number|null} Cantidad convertida o null si no hay tasa disponible
   */
  _convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = this.exchangeRates[`${fromCurrency}-${toCurrency}`];
    if (!rate) return null;

    return amount * rate;
  }

  /**
   * Valida un monto numérico
   * @private
   * @param {any} amount - Valor a validar
   * @returns {boolean} true si es válido
   */
  _isValidAmount(amount) {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           isFinite(amount) && 
           amount > 0;
  }

  /**
   * Elimina un cliente
   * @public
   * @param {number} clientId - ID del cliente a eliminar
   */
  deleteClient(clientId) {
    if (!confirm('¿Está seguro de que desea eliminar este cliente y todo su historial?')) {
      return;
    }

    this.clients = this.clients.filter(client => client.id !== clientId);
    this.saveData();
    this.renderClients();
  }

  /**
   * Elimina una tasa de cambio
   * @public
   * @param {string} rateKey - Clave de la tasa a eliminar
   */
  deleteRate(rateKey) {
    if (!confirm('¿Está seguro de que desea eliminar esta tasa de cambio?')) {
      return;
    }

    delete this.exchangeRates[rateKey];
    this.saveData();
    this.updateRatesDisplay();
  }

  /**
   * Abre el modal para agregar una operación a un cliente
   * @public
   * @param {number} clientId - ID del cliente
   */
  openAddOperationModal(clientId) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    this.removeDynamicModal();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
    modal.id = 'dynamicAddOperationModal';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Nueva Operación para ${this._escapeHtml(client.name)}</h2>
          <button class="modal-close text-gray-500 hover:text-gray-700 text-2xl absolute right-4 top-4">&times;</button>
        </div>
        <form id="addOperationForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación</label>
            <select id="operationType" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="addition">Agregar Deuda</option>
              <option value="payment">Registrar Pago</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Monto</label>
            <input type="number" id="operationAmount" required step="0.01" min="0.01" 
              class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="0.00">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
            <input type="text" id="operationDescription" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Descripción de la operación">
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" class="modal-close flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg">Cancelar</button>
            <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg">Guardar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => this.removeDynamicModal());
    modal.onclick = (e) => { if (e.target === modal) this.removeDynamicModal(); };

    modal.querySelector('#addOperationForm').onsubmit = (e) => {
      e.preventDefault();
      const type = modal.querySelector('#operationType').value;
      const amount = parseFloat(modal.querySelector('#operationAmount').value);
      const description = modal.querySelector('#operationDescription').value.trim();

      if (isNaN(amount) || amount <= 0 || !description) {
        alert('Por favor complete todos los campos correctamente');
        return;
      }

      client.history.push({
        id: Date.now() + Math.random(),
        type,
        amount,
        description,
        date: new Date().toLocaleDateString('es-ES'),
        timestamp: Date.now()
      });

      this.saveData();
      this.renderClients();
      this.removeDynamicModal();
    };
  }
}
