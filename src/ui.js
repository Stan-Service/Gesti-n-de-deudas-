// Módulo de UI y eventos
import { DebtManager } from './debtManager.js';

let debtManager;

function bindEvents() {
  document.getElementById("addClientBtn").addEventListener("click", () => debtManager.openModal("addClientModal"));
  document.getElementById("configRatesBtn").addEventListener("click", () => debtManager.openModal("configRatesModal"));
  document.getElementById("showPaidClientsBtn").addEventListener("click", () => debtManager.togglePaidClients());
  document.getElementById("addClientForm").addEventListener("submit", (e) => debtManager.handleAddClient(e));
  document.getElementById("configRatesForm").addEventListener("submit", (e) => debtManager.handleConfigRates(e));
  document.getElementById("globalCurrency").addEventListener("change", (e) => debtManager.changeGlobalCurrency(e.target.value));
  document.getElementById("fromCurrency").addEventListener("change", () => debtManager.updateCurrencyLabels());
  document.getElementById("toCurrency").addEventListener("change", () => debtManager.updateCurrencyLabels());
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      debtManager.closeModal(modal.id);
    });
  });
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        debtManager.closeModal(modal.id);
      }
    });
  });
  document.getElementById("cancelDelete").addEventListener("click", () => debtManager.closeModal("deleteModal"));
  document.getElementById("confirmDelete").addEventListener("click", () => debtManager.confirmDelete());
  document.getElementById("cancelDeleteOperation").addEventListener("click", () => debtManager.closeModal("deleteOperationModal"));
  document.getElementById("confirmDeleteOperation").addEventListener("click", () => debtManager.confirmDeleteOperation());
}

export function initUI() {
  debtManager = new DebtManager();
  bindEvents();
  debtManager.renderClients();
  debtManager.updateGlobalCurrency();
  debtManager.updateRatesDisplay();
  debtManager.setDefaultRates();
  debtManager.updateCurrencyLabels();
}

document.addEventListener("DOMContentLoaded", () => {
  initUI();
});
