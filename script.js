document.addEventListener('DOMContentLoaded', () => {
    const clientForm = document.getElementById('client-form');
    const debtTableBody = document.querySelector('#debt-table tbody');
    const saveRatesBtn = document.getElementById('save-general-rates');
    const usdCupRateInput = document.getElementById('usd-cup-rate');
    const cupTransferRateInput = document.getElementById('cup-transfer-rate');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const operationForm = document.getElementById('operation-form');
    const operationHistoryList = document.getElementById('operation-history');
    const operationTypeSelect = document.getElementById('operation-type');
    const transferGroup = document.querySelector('.transfer-group');
    
    let clients = [];
    let rates = {
        usdToCup: 250,
        cupTransferToCupCash: 1.05
    };
    let currentClientName = null;

    // Cargar datos al iniciar
    loadData();

    // Evento para mostrar/ocultar el campo de tipo de CUP
    operationTypeSelect.addEventListener('change', () => {
        const currency = document.getElementById('operation-currency').value;
        if (operationTypeSelect.value === 'disminuir' && currency === 'CUP') {
            transferGroup.style.display = 'block';
        } else {
            transferGroup.style.display = 'none';
        }
    });

    // Evento para mostrar/ocultar el campo de tipo de CUP al cambiar moneda
    document.getElementById('operation-currency').addEventListener('change', (e) => {
        const currency = e.target.value;
        if (operationTypeSelect.value === 'disminuir' && currency === 'CUP') {
            transferGroup.style.display = 'block';
        } else {
            transferGroup.style.display = 'none';
        }
    });

    // Función para cargar los datos del localStorage
    function loadData() {
        const storedClients = localStorage.getItem('clients');
        const storedRates = localStorage.getItem('rates');

        if (storedClients) {
            clients = JSON.parse(storedClients);
        }
        if (storedRates) {
            rates = JSON.parse(storedRates);
            usdCupRateInput.value = rates.usdToCup;
            cupTransferRateInput.value = rates.cupTransferToCupCash;
        }

        renderClients();
    }

    // Función para guardar los datos en el localStorage
    function saveData() {
        localStorage.setItem('clients', JSON.stringify(clients));
        localStorage.setItem('rates', JSON.stringify(rates));
    }

    // Función para renderizar la tabla de clientes
    function renderClients() {
        debtTableBody.innerHTML = '';
        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.debt.toFixed(2)}</td>
                <td>${client.currency}</td>
                <td class="action-buttons">
                    <button class="btn btn-op" data-name="${client.name}">Operaciones</button>
                    <button class="btn btn-del" data-name="${client.name}">Eliminar</button>
                </td>
            `;
            debtTableBody.appendChild(row);
        });
    }

    // Evento para el formulario de añadir cliente
    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('client-name').value;
        const debt = parseFloat(document.getElementById('client-debt').value);
        const currency = document.getElementById('debt-currency').value;

        const newClient = {
            name,
            debt,
            currency,
            operations: []
        };
        clients.push(newClient);
        saveData();
        renderClients();
        clientForm.reset();
    });

    // Evento para guardar las tasas de cambio generales
    saveRatesBtn.addEventListener('click', () => {
        rates.usdToCup = parseFloat(usdCupRateInput.value);
        rates.cupTransferToCupCash = parseFloat(cupTransferRateInput.value);
        saveData();
        alert('Tasas de cambio generales guardadas.');
    });

    // Evento para los botones de la tabla (operaciones y eliminar)
    debtTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-op')) {
            currentClientName = e.target.dataset.name;
            const client = clients.find(c => c.name === currentClientName);
            
            modalTitle.innerHTML = `Operaciones para <span>${client.name}</span>`;
            
            // Renderizar historial de operaciones
            renderOperationHistory(client.operations);

            modal.style.display = 'block';

        } else if (e.target.classList.contains('btn-del')) {
            const nameToDelete = e.target.dataset.name;
            if (confirm(`¿Estás seguro de que quieres eliminar a ${nameToDelete}?`)) {
                clients = clients.filter(c => c.name !== nameToDelete);
                saveData();
                renderClients();
            }
        }
    });

    // Evento para cerrar el modal
    document.querySelector('.close-btn').addEventListener('click', () => {
        modal.style.display = 'none';
        operationForm.reset();
        transferGroup.style.display = 'none';
    });

    // Evento para el formulario de operaciones
    operationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = clients.find(c => c.name === currentClientName);
        if (!client) return;

        const type = document.getElementById('operation-type').value;
        const amount = parseFloat(document.getElementById('operation-amount').value);
        const currency = document.getElementById('operation-currency').value;
        const cupType = document.getElementById('operation-cup-type').value;

        // Convertir el monto a la moneda del cliente si es necesario
        let finalAmount = amount;
        if (currency !== client.currency) {
            if (currency === 'USD' && client.currency === 'CUP') {
                finalAmount = amount * rates.usdToCup;
            } else if (currency === 'CUP' && client.currency === 'USD') {
                // Opción para disminuir deuda en CUP, se convierte a USD
                finalAmount = amount / rates.usdToCup;
                if (cupType === 'transferencia') {
                    finalAmount = (amount / rates.cupTransferToCupCash) / rates.usdToCup;
                }
            }
        }
        
        // Aplicar la operación
        if (type === 'aumentar') {
            client.debt += finalAmount;
        } else {
            client.debt -= finalAmount;
        }

        // Guardar la operación en el historial
        const operationDescription = `${type === 'aumentar' ? '+' : '-'} ${amount.toFixed(2)} ${currency}`;
        client.operations.push(operationDescription);

        saveData();
        renderClients();
        renderOperationHistory(client.operations);
        operationForm.reset();
        transferGroup.style.display = 'none';
    });

    // Función para renderizar el historial de operaciones
    function renderOperationHistory(operations) {
        operationHistoryList.innerHTML = '';
        operations.forEach(op => {
            const li = document.createElement('li');
            li.textContent = op;
            operationHistoryList.appendChild(li);
        });
    }

});
