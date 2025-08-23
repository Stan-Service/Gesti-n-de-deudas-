// debtManager.js - Lógica de negocio y datos
export class DebtManager {
  constructor() {
    this.clients = JSON.parse(localStorage.getItem("debtClients") || "[]");
    this.exchangeRates = JSON.parse(localStorage.getItem("exchangeRates") || "{}" );
    this.globalCurrency = localStorage.getItem("globalCurrency") || "USD";
    this.currentDeleteId = null;
    this.currentDeleteOperation = null;
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
