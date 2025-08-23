// Módulo de UI y eventos
import { DebtManager } from './debtManager.js';

let debtManager;

function bindEvents() {
  document.getElementById("addClientBtn").onclick = () => debtManager.openAddClientModal();
  document.getElementById("configRatesBtn").onclick = () => debtManager.openConfigRatesModal();
  const showPaidBtn = document.getElementById("showPaidClientsBtn");
  if (showPaidBtn) showPaidBtn.onclick = () => debtManager.togglePaidClients();
  // Los formularios ahora son modales dinámicos, no estáticos
  document.getElementById("globalCurrency").onchange = (e) => debtManager.changeGlobalCurrency(e.target.value);
  const fromCurrency = document.getElementById("fromCurrency");
  if (fromCurrency) fromCurrency.onchange = () => debtManager.updateCurrencyLabels();
  const toCurrency = document.getElementById("toCurrency");
  if (toCurrency) toCurrency.onchange = () => debtManager.updateCurrencyLabels();
  // Cerrar modales estáticos
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.onclick = (e) => {
      const modal = e.target.closest(".modal");
      if (modal) debtManager.closeModal(modal.id);
    };
  });
  // Cerrar modales al hacer click fuera del contenido
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.onclick = (e) => {
      if (e.target === modal) debtManager.closeModal(modal.id);
    };
  });
  // Eliminar operación del historial
  const cancelDeleteOp = document.getElementById("cancelDeleteOperation");
  if (cancelDeleteOp) cancelDeleteOp.onclick = () => debtManager.closeModal("deleteOperationModal");
  const confirmDeleteOp = document.getElementById("confirmDeleteOperation");
  if (confirmDeleteOp) confirmDeleteOp.onclick = () => debtManager.confirmDeleteOperation();
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
