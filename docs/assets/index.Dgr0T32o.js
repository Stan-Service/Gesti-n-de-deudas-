(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&t(n)}).observe(document,{childList:!0,subtree:!0});function a(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function t(r){if(r.ep)return;r.ep=!0;const o=a(r);fetch(r.href,o)}})();class u{constructor(){this.clients=[],this.exchangeRates={},this.globalCurrency="USD",this.currentDeleteId=null,this.currentDeleteOperation=null;try{this.clients=JSON.parse(localStorage.getItem("debtClients")||"[]"),this.exchangeRates=JSON.parse(localStorage.getItem("exchangeRates")||"{}"),this.globalCurrency=localStorage.getItem("globalCurrency")||"USD"}catch(e){console.error("Error al cargar datos:",e)}this._validateData(),window.addEventListener("beforeunload",()=>this.removeDynamicModal())}_validateData(){this.clients=this.clients.filter(a=>a&&typeof a.id=="number"&&typeof a.name=="string"&&["USD","CUP_CASH","CUP_TRANSFER"].includes(a.currency)&&Array.isArray(a.history));const e={};for(const[a,t]of Object.entries(this.exchangeRates))typeof t=="number"&&t>0&&a.includes("-")&&(e[a]=t);this.exchangeRates=e,["USD","CUP_CASH","CUP_TRANSFER"].includes(this.globalCurrency)||(this.globalCurrency="USD"),this.saveData()}openAddClientModal(){this.removeDynamicModal();const e=document.createElement("div");e.className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60",e.id="dynamicAddClientModal",e.innerHTML=`
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
    `,document.body.appendChild(e),e.querySelectorAll(".modal-close").forEach(a=>a.onclick=()=>this.removeDynamicModal()),e.onclick=a=>{a.target===e&&this.removeDynamicModal()},e.querySelector("#addClientForm").onsubmit=a=>{a.preventDefault();const t=e.querySelector("#clientName").value,r=parseFloat(e.querySelector("#initialDebt").value),o=e.querySelector("#clientCurrency").value;if(!t.trim()||isNaN(r)||r<0){alert("Datos inválidos");return}const n={id:Date.now()+Math.random(),name:t,currency:o,history:[{id:Date.now()+Math.random(),type:"initial",amount:r,description:"Deuda inicial",date:new Date().toLocaleDateString("es-ES"),timestamp:Date.now()}]};this.clients.push(n),this.saveData(),this.renderClients(),this.removeDynamicModal()}}openConfigRatesModal(){this.removeDynamicModal();const e=document.createElement("div");e.className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60",e.id="dynamicConfigRatesModal",e.innerHTML=`
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
    `,document.body.appendChild(e),e.querySelectorAll(".modal-close").forEach(n=>n.onclick=()=>this.removeDynamicModal()),e.onclick=n=>{n.target===e&&this.removeDynamicModal()};const a=e.querySelector("#fromCurrency"),t=e.querySelector("#toCurrency"),r=e.querySelector("#fromLabel"),o=e.querySelector("#toLabel");a.onchange=t.onchange=()=>{r.textContent=a.value==="CUP_CASH"?"CUP Efectivo":a.value==="CUP_TRANSFER"?"CUP Transferencia":a.value,o.textContent=t.value==="CUP_CASH"?"CUP Efectivo":t.value==="CUP_TRANSFER"?"CUP Transferencia":t.value},e.querySelector("#configRatesForm").onsubmit=n=>{n.preventDefault();const s=a.value,c=t.value,d=parseFloat(e.querySelector("#conversionRate").value);if(s===c){alert("No puedes convertir una moneda a sí misma.");return}if(isNaN(d)||d<=0){alert("La tasa debe ser un número positivo.");return}this.exchangeRates[`${s}-${c}`]=d,this.saveData(),this.updateRatesDisplay(),this.removeDynamicModal()},this.updateRatesDisplay()}removeDynamicModal(){const e=document.getElementById("dynamicAddClientModal")||document.getElementById("dynamicConfigRatesModal");e&&e.remove()}saveData(){localStorage.setItem("debtClients",JSON.stringify(this.clients)),localStorage.setItem("exchangeRates",JSON.stringify(this.exchangeRates)),localStorage.setItem("globalCurrency",this.globalCurrency)}renderClients(){const e=document.getElementById("clientsList");if(!e)return;const a=e.cloneNode(!1);if(e.parentNode.replaceChild(a,e),this.clients.length===0){a.innerHTML='<div class="text-gray-500 text-center py-8">No hay clientes registrados</div>';return}a.innerHTML=this.clients.map(t=>{const r=this._calculateTotalDebt(t),o=r>0?"red":"green";return`
        <div class="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-lg font-semibold">${this._escapeHtml(t.name)}</h3>
            <span class="px-2 py-1 bg-${o}-100 text-${o}-800 rounded text-sm">
              ${this._formatCurrency(r,t.currency)}
            </span>
          </div>
          <div class="space-y-2">
            ${t.history.map(n=>`
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">${n.date} - ${this._escapeHtml(n.description)}</span>
                <span class="font-medium ${n.type==="payment"?"text-green-600":"text-red-600"}">
                  ${n.type==="payment"?"-":"+"} ${this._formatCurrency(n.amount,t.currency)}
                </span>
              </div>
            `).join("")}
          </div>
          <div class="mt-4 flex gap-2">
            <button data-action="add-operation" data-client-id="${t.id}"
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Agregar Operación
            </button>
            <button data-action="delete-client" data-client-id="${t.id}"
              class="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm">
              Eliminar
            </button>
          </div>
        </div>
      `}).join(""),a.addEventListener("click",t=>{const r=t.target.closest("button[data-action]");if(!r)return;const o=parseInt(r.dataset.clientId,10);if(!isNaN(o))switch(r.dataset.action){case"add-operation":this.openAddOperationModal(o);break;case"delete-client":this.deleteClient(o);break}})}updateRatesDisplay(){const e=document.getElementById("currentRates");if(!e)return;const a=Object.entries(this.exchangeRates).map(([t,r])=>{const[o,n]=t.split("-"),s=this._getCurrencyLabel(o),c=this._getCurrencyLabel(n);return`
          <div class="flex justify-between items-center">
            <span>1 ${s} = ${r.toFixed(4)} ${c}</span>
            <button onclick="debtManager.deleteRate('${t}')"
              class="text-red-500 hover:text-red-700 text-sm ml-2">&times;</button>
          </div>
        `});e.innerHTML=a.length?a.join(""):'<div class="text-gray-500">No hay tasas configuradas</div>'}_getCurrencyLabel(e){switch(e){case"CUP_CASH":return"CUP Efectivo";case"CUP_TRANSFER":return"CUP Transferencia";default:return e}}_escapeHtml(e){const a=document.createElement("div");return a.textContent=e,a.innerHTML}_calculateTotalDebt(e){return e?.history?e.history.reduce((a,t)=>a+(t.type==="initial"||t.type==="addition"?t.amount:-t.amount),0):0}_formatCurrency(e,a){try{return`${new Intl.NumberFormat("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(e))} ${this._getCurrencyLabel(a)}`}catch(t){return console.error("Error al formatear moneda:",t),`${Math.abs(e).toFixed(2)} ${this._getCurrencyLabel(a)}`}}_convertCurrency(e,a,t){if(a===t)return e;const r=this.exchangeRates[`${a}-${t}`];return r?e*r:null}_isValidAmount(e){return typeof e=="number"&&!isNaN(e)&&isFinite(e)&&e>0}deleteClient(e){confirm("¿Está seguro de que desea eliminar este cliente y todo su historial?")&&(this.clients=this.clients.filter(a=>a.id!==e),this.saveData(),this.renderClients())}deleteRate(e){confirm("¿Está seguro de que desea eliminar esta tasa de cambio?")&&(delete this.exchangeRates[e],this.saveData(),this.updateRatesDisplay())}openAddOperationModal(e){const a=this.clients.find(r=>r.id===e);if(!a)return;this.removeDynamicModal();const t=document.createElement("div");t.className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60",t.id="dynamicAddOperationModal",t.innerHTML=`
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Nueva Operación para ${this._escapeHtml(a.name)}</h2>
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
    `,document.body.appendChild(t),t.querySelectorAll(".modal-close").forEach(r=>r.onclick=()=>this.removeDynamicModal()),t.onclick=r=>{r.target===t&&this.removeDynamicModal()},t.querySelector("#addOperationForm").onsubmit=r=>{r.preventDefault();const o=t.querySelector("#operationType").value,n=parseFloat(t.querySelector("#operationAmount").value),s=t.querySelector("#operationDescription").value.trim();if(isNaN(n)||n<=0||!s){alert("Por favor complete todos los campos correctamente");return}a.history.push({id:Date.now()+Math.random(),type:o,amount:n,description:s,date:new Date().toLocaleDateString("es-ES"),timestamp:Date.now()}),this.saveData(),this.renderClients(),this.removeDynamicModal()}}}let i;function m(){document.getElementById("addClientBtn").onclick=()=>i.openAddClientModal(),document.getElementById("configRatesBtn").onclick=()=>i.openConfigRatesModal();const l=document.getElementById("showPaidClientsBtn");l&&(l.onclick=()=>i.togglePaidClients()),document.getElementById("globalCurrency").onchange=o=>i.changeGlobalCurrency(o.target.value);const e=document.getElementById("fromCurrency");e&&(e.onchange=()=>i.updateCurrencyLabels());const a=document.getElementById("toCurrency");a&&(a.onchange=()=>i.updateCurrencyLabels()),document.querySelectorAll(".modal-close").forEach(o=>{o.onclick=n=>{const s=n.target.closest(".modal");s&&i.closeModal(s.id)}}),document.querySelectorAll(".modal").forEach(o=>{o.onclick=n=>{n.target===o&&i.closeModal(o.id)}});const t=document.getElementById("cancelDeleteOperation");t&&(t.onclick=()=>i.closeModal("deleteOperationModal"));const r=document.getElementById("confirmDeleteOperation");r&&(r.onclick=()=>i.confirmDeleteOperation())}function p(){i=new u,m(),i.renderClients(),i.updateGlobalCurrency(),i.updateRatesDisplay(),i.setDefaultRates(),i.updateCurrencyLabels()}document.addEventListener("DOMContentLoaded",()=>{p()});
