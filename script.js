class DebtManager{constructor(){this.clients=JSON.parse(localStorage.getItem("debtClients")||"[]"),this.exchangeRates=JSON.parse(localStorage.getItem("exchangeRates")||"{}"),this.globalCurrency=localStorage.getItem("globalCurrency")||"USD",this.currentDeleteId=null,this.currentDeleteOperation=null,this.init()}init(){this.bindEvents(),this.renderClients(),this.updateGlobalCurrency(),this.updateRatesDisplay(),this.setDefaultRates(),this.updateCurrencyLabels()}setDefaultRates(){0===Object.keys(this.exchangeRates).length&&(this.exchangeRates={"USD-CUP_CASH":120,"USD-CUP_TRANSFER":115,"CUP_CASH-CUP_TRANSFER":.96},this.saveData())}bindEvents(){document.getElementById("addClientBtn").addEventListener("click",()=>this.openModal("addClientModal")),document.getElementById("configRatesBtn").addEventListener("click",()=>this.openModal("configRatesModal")),document.getElementById("showPaidClientsBtn").addEventListener("click",()=>this.togglePaidClients()),document.getElementById("addClientForm").addEventListener("submit",e=>this.handleAddClient(e)),document.getElementById("configRatesForm").addEventListener("submit",e=>this.handleConfigRates(e)),document.getElementById("globalCurrency").addEventListener("change",e=>this.changeGlobalCurrency(e.target.value)),document.getElementById("fromCurrency").addEventListener("change",()=>this.updateCurrencyLabels()),document.getElementById("toCurrency").addEventListener("change",()=>this.updateCurrencyLabels()),document.querySelectorAll(".modal-close").forEach(e=>{e.addEventListener("click",e=>{let t=e.target.closest(".modal");this.closeModal(t.id)})}),document.querySelectorAll(".modal").forEach(e=>{e.addEventListener("click",t=>{t.target===e&&this.closeModal(e.id)})}),document.getElementById("cancelDelete").addEventListener("click",()=>this.closeModal("deleteModal")),document.getElementById("confirmDelete").addEventListener("click",()=>this.confirmDelete()),document.getElementById("cancelDeleteOperation").addEventListener("click",()=>this.closeModal("deleteOperationModal")),document.getElementById("confirmDeleteOperation").addEventListener("click",()=>this.confirmDeleteOperation())}updateCurrencyLabels(){let e=document.getElementById("fromCurrency").value,t=document.getElementById("toCurrency").value;document.getElementById("fromLabel").textContent=this.getCurrencyLabel(e),document.getElementById("toLabel").textContent=this.getCurrencyLabel(t);let n=this.getExchangeRate(e,t);n&&1!==n?document.getElementById("conversionRate").value=n:document.getElementById("conversionRate").value=""}getExchangeRate(e,t){if(e===t)return 1;let n=`${e}-${t}`,i=`${t}-${e}`;return this.exchangeRates[n]?this.exchangeRates[n]:this.exchangeRates[i]?1/this.exchangeRates[i]:null}openModal(e){let t=document.getElementById(e);t.classList.add("show"),document.body.style.overflow="hidden",setTimeout(()=>{let e=t.querySelector("input, select");e&&e.focus()},100)}closeModal(e){let t=document.getElementById(e);t.classList.remove("show"),document.body.style.overflow="";let n=t.querySelector("form");n&&n.reset(),"configRatesModal"===e&&this.updateCurrencyLabels()}handleAddClient(e){e.preventDefault();let t=document.getElementById("clientName").value.trim(),n=parseFloat(document.getElementById("initialDebt").value),i=document.getElementById("clientCurrency").value,s=this.validateClientForm(t,n,i);if(s.length>0){alert(s.join("\n"));return}let a={id:Date.now(),name:t,currency:i,history:[{id:Date.now(),type:"initial",amount:n,date:new Date().toLocaleDateString("es-ES"),timestamp:Date.now(),description:"Deuda inicial"},]};this.clients.push(a),this.saveData(),this.renderClients(),this.closeModal("addClientModal"),setTimeout(()=>{let e=document.querySelector(`[data-client-id="${a.id}"]`);e&&e.scrollIntoView({behavior:"smooth",block:"center"})},100)}handleConfigRates(e){e.preventDefault();let t=document.getElementById("fromCurrency").value,n=document.getElementById("toCurrency").value,i=parseFloat(document.getElementById("conversionRate").value);if(t===n){alert("Selecciona monedas diferentes");return}if(isNaN(i)||i<=0){alert("Ingresa una tasa v\xe1lida");return}let s=`${t}-${n}`;this.exchangeRates[s]=i;let a=`${n}-${t}`;this.exchangeRates[a]&&delete this.exchangeRates[a],this.saveData(),this.renderClients(),this.updateRatesDisplay(),this.closeModal("configRatesModal")}changeGlobalCurrency(e){this.globalCurrency=e,localStorage.setItem("globalCurrency",e),this.renderClients()}updateGlobalCurrency(){document.getElementById("globalCurrency").value=this.globalCurrency}convertCurrency(e,t,n){if(t===n)return e;let i=this.getExchangeRate(t,n);if(i)return e*i;for(let s of["USD","CUP_CASH","CUP_TRANSFER"])if(s!==t&&s!==n){let a=this.getExchangeRate(t,s),r=this.getExchangeRate(s,n);if(a&&r)return e*a*r}return e}getCurrentDebt(e){return e.history.reduce((e,t)=>{switch(t.type){case"initial":case"increase":return e+t.amount;case"payment":return e-t.amount;default:return e}},0)}isPaidOff(e){let t=this.getCurrentDebt(e);return .01>Math.abs(t)}renderClients(){let e=document.getElementById("clientsContainer"),t=document.getElementById("paidClientsList"),n=document.getElementById("emptyState"),i=document.getElementById("showPaidClientsBtn"),s=this.clients.filter(e=>!this.isPaidOff(e)),a=this.clients.filter(e=>this.isPaidOff(e));if(a.length>0?i.classList.remove("hidden"):(i.classList.add("hidden"),document.getElementById("paidClientsContainer").classList.add("hidden")),0===this.clients.length){e.innerHTML="",t.innerHTML="",n.style.display="block";return}n.style.display="none",e.innerHTML=s.map(e=>this.renderClientCard(e)).join(""),t.innerHTML=a.map(e=>this.renderClientCard(e,!0)).join("")}renderClientCard(e,t=!1){let n=this.getCurrentDebt(e),i=this.convertCurrency(n,e.currency,this.globalCurrency),s=this.getCurrencySymbol(this.globalCurrency);return`
            <div class="client-card ${t?"paid":""} bg-white rounded-xl p-4 shadow-sm border hover-lift transition-all" data-client-id="${e.id}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="client-name font-semibold text-gray-800 text-lg">${e.name}</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="currency-indicator currency-${e.currency.toLowerCase().replace("_","-")} text-sm text-gray-600 pl-3">
                                ${this.getCurrencyLabel(e.currency)}
                            </span>
                        </div>
                    </div>
                    <button onclick="debtManager.deleteClient(${e.id})" 
                            class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors touch-friendly">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                       </svg>
                   </button>
               </div>
               
               <div class="mb-4">
                   <div class="debt-amount text-2xl font-bold ${i>=.01?"text-red-600":.01>Math.abs(i)?"text-green-600":"text-blue-600"}">
                       ${s}${Math.abs(i).toFixed(2)}
                   </div>
                   <div class="text-sm text-gray-500">
                       ${i>=.01?"Debe":.01>Math.abs(i)?"Pagado":"A favor"}
                   </div>
               </div>
               
               ${t?"":`
               <div class="flex gap-2 mb-3">
                   <div class="flex-1">
                       <input type="number" 
                              id="amount-${e.id}" 
                              placeholder="Monto" 
                              step="0.01" 
                              min="0.01"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                   </div>
                   <button onclick="debtManager.addPayment(${e.id})" 
                           class="btn-feedback btn-payment text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-friendly">
                       Pago
                   </button>
                   <button onclick="debtManager.addIncrease(${e.id})" 
                           class="btn-feedback btn-increase text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-friendly">
                       + Deuda
                   </button>
               </div>
               `}
               
               <button onclick="debtManager.toggleHistory(${e.id})" 
                       class="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-2 flex items-center justify-between transition-colors">
                   <span>Ver historial (${e.history.length})</span>
                   <svg class="w-4 h-4 transform transition-transform" id="arrow-${e.id}" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M7 10l5 5 5-5z"/>
                   </svg>
               </button>
               
               <div id="history-${e.id}" class="history-content">
                   <div class="history-scroll space-y-2">
                       ${e.history.slice().reverse().map(t=>`
                           <div class="history-entry flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                               <div class="flex-1">
                                   <span class="font-medium ${this.getEntryColor(t.type)}">${this.getEntryLabel(t.type)}</span>
                                   ${t.description?`<div class="text-gray-600">${t.description}</div>`:""}
                                   <div class="text-xs text-gray-500">${t.date}</div>
                               </div>
                               <div class="flex items-center gap-2">
                                   <span class="font-medium ${this.getEntryColor(t.type)}">
                                       ${this.getCurrencySymbol(e.currency)}${t.amount.toFixed(2)}
                                   </span>
                                   ${"initial"!==t.type?`
                                       <button onclick="debtManager.deleteOperation(${e.id}, ${t.id})" 
                                               class="delete-operation text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                           </svg>
                                       </button>
                                   `:""}
                               </div>
                           </div>
                       `).join("")}
                   </div>
               </div>
           </div>
       `}togglePaidClients(){let e=document.getElementById("paidClientsContainer"),t=document.getElementById("showPaidClientsBtn");e.classList.contains("hidden")?(e.classList.remove("hidden"),t.textContent="Ocultar Pagados"):(e.classList.add("hidden"),t.textContent="Ver Pagados")}addPayment(e){let t=document.getElementById(`amount-${e}`),n=parseFloat(t.value);if(isNaN(n)||n<=0){alert("Ingresa un monto v\xe1lido");return}this.addHistoryEntry(e,"payment",n,"Pago recibido"),t.value=""}addIncrease(e){let t=document.getElementById(`amount-${e}`),n=parseFloat(t.value);if(isNaN(n)||n<=0){alert("Ingresa un monto v\xe1lido");return}this.addHistoryEntry(e,"increase",n,"Aumento de deuda"),t.value=""}addHistoryEntry(e,t,n,i){let s=this.clients.find(t=>t.id===e);if(!s)return;s.history.push({id:Date.now()+Math.random(),type:t,amount:n,description:i,date:new Date().toLocaleDateString("es-ES"),timestamp:Date.now()}),this.saveData(),this.renderClients();let a=document.querySelector(`[data-client-id="${e}"]`);a&&(a.style.transform="scale(1.02)",setTimeout(()=>{a.style.transform=""},200))}deleteOperation(e,t){this.currentDeleteOperation={clientId:e,operationId:t},this.openModal("deleteOperationModal")}confirmDeleteOperation(){if(this.currentDeleteOperation){let{clientId:e,operationId:t}=this.currentDeleteOperation,n=this.clients.find(t=>t.id===e);n&&(n.history=n.history.filter(e=>e.id!==t),this.saveData(),this.renderClients()),this.currentDeleteOperation=null}this.closeModal("deleteOperationModal")}toggleHistory(e){let t=document.getElementById(`history-${e}`),n=document.getElementById(`arrow-${e}`);t.classList.contains("expanded")?(t.classList.remove("expanded"),n.style.transform=""):(t.classList.add("expanded"),n.style.transform="rotate(180deg)")}deleteClient(e){this.currentDeleteId=e,this.openModal("deleteModal")}confirmDelete(){if(this.currentDeleteId){let e=document.querySelector(`[data-client-id="${this.currentDeleteId}"]`);e&&(e.classList.add("removing"),setTimeout(()=>{this.clients=this.clients.filter(e=>e.id!==this.currentDeleteId),this.saveData(),this.renderClients()},300)),this.currentDeleteId=null}this.closeModal("deleteModal")}updateRatesDisplay(){let e=document.getElementById("currentRates"),t=this.exchangeRates;if(0===Object.keys(t).length){e.innerHTML='<p class="text-gray-500">No hay tasas configuradas</p>';return}let n={USD:"USD",CUP_CASH:"CUP Efectivo",CUP_TRANSFER:"CUP Transferencia"};e.innerHTML=Object.entries(t).map(([e,t])=>{let[i,s]=e.split("-");return`
                   <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                       <span>1 ${n[i]} = ${t.toFixed(4)} ${n[s]}</span>
                       <button onclick="debtManager.deleteRate('${e}')" 
                               class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                           </svg>
                       </button>
                   </div>
               `}).join("")}deleteRate(e){confirm("\xbfEst\xe1s seguro de que quieres eliminar esta tasa?")&&(delete this.exchangeRates[e],this.saveData(),this.updateRatesDisplay(),this.renderClients())}getCurrencySymbol(e){return({USD:"$",CUP_CASH:"$",CUP_TRANSFER:"$"})[e]||"$"}getCurrencyLabel(e){return({USD:"USD",CUP_CASH:"CUP Efectivo",CUP_TRANSFER:"CUP Transferencia"})[e]||e}getEntryColor(e){return({initial:"text-blue-600",payment:"text-green-600",increase:"text-red-600"})[e]||"text-gray-600"}getEntryLabel(e){return({initial:"Inicial",payment:"Pago",increase:"Aumento"})[e]||e}validateClientForm(e,t,n){let i=[];return e.trim()?e.trim().length<2&&i.push("El nombre debe tener al menos 2 caracteres"):i.push("El nombre es obligatorio"),(isNaN(t)||t<0)&&i.push("La deuda debe ser un n\xfamero positivo o cero"),["USD","CUP_CASH","CUP_TRANSFER"].includes(n)||i.push("Selecciona una moneda v\xe1lida"),this.clients.some(t=>t.name.toLowerCase().trim()===e.toLowerCase().trim())&&i.push("Ya existe un cliente con ese nombre"),i}saveData(){localStorage.setItem("debtClients",JSON.stringify(this.clients)),localStorage.setItem("exchangeRates",JSON.stringify(this.exchangeRates)),localStorage.setItem("globalCurrency",this.globalCurrency)}exportData(){let e={clients:this.clients,exchangeRates:this.exchangeRates,globalCurrency:this.globalCurrency,exportDate:new Date().toISOString()},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),n=URL.createObjectURL(t),i=document.createElement("a");i.href=n,i.download=`gestor-deudas-${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}getStatistics(){let e={totalClients:this.clients.length,activeClients:this.clients.filter(e=>!this.isPaidOff(e)).length,paidClients:this.clients.filter(e=>this.isPaidOff(e)).length,totalDebt:0,totalCredit:0};return this.clients.forEach(t=>{let n=this.getCurrentDebt(t),i=this.convertCurrency(n,t.currency,this.globalCurrency);i>0?e.totalDebt+=i:i<0&&(e.totalCredit+=Math.abs(i))}),e}}document.addEventListener("DOMContentLoaded",()=>{window.debtManager=new DebtManager,document.addEventListener("keydown",e=>{if("Escape"===e.key){let t=document.querySelector(".modal.show");t&&debtManager.closeModal(t.id)}}),/iPad|iPhone|iPod/.test(navigator.userAgent)&&document.addEventListener("touchstart",e=>{("INPUT"===e.target.tagName||"SELECT"===e.target.tagName)&&(e.target.style.fontSize="16px")}),document.addEventListener("focusin",e=>{e.target.matches("input, select, button")&&(e.target.style.outline="2px solid #3b82f6",e.target.style.outlineOffset="2px")}),document.addEventListener("focusout",e=>{e.target.matches("input, select, button")&&(e.target.style.outline="",e.target.style.outlineOffset="")})}),window.debtManagerUtils={exportData:()=>window.debtManager.exportData(),getStatistics:()=>window.debtManager.getStatistics(),clearAllData(){confirm("\xbfEst\xe1s seguro de que quieres eliminar todos los datos? Esta acci\xf3n no se puede deshacer.")&&(localStorage.clear(),location.reload())}};
