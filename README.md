# Gestor de Deudas Stan Service

Aplicación web para la gestión de deudas de clientes, con soporte para múltiples monedas, historial de operaciones, tasas de cambio configurables y una interfaz moderna y responsiva.

## Características principales

- **Gestión de clientes**: Agrega, elimina y visualiza clientes con sus deudas.
- **Pagos y aumentos**: Registra pagos y aumentos de deuda para cada cliente.
- **Historial detallado**: Cada cliente tiene un historial de operaciones, donde puedes eliminar operaciones individuales.
- **Conversión de monedas**: Visualiza todas las deudas y pagos en la moneda global que elijas (USD, CUP Efectivo, CUP Transferencia).
- **Tasas de cambio configurables**: Puedes definir y eliminar tasas de cambio entre monedas.
- **Clientes pagados**: Visualiza clientes con deuda saldada, mostrando los valores en la moneda global seleccionada.
- **Animaciones e iconos**: Los botones incluyen iconos y animaciones modernas para mejor experiencia de usuario.
- **Accesibilidad**: Navegación por teclado, enfoque visible y diseño responsivo.

## Uso

1. **Agregar cliente**: Haz clic en "+ Agregar Cliente", completa los datos y guarda.
2. **Registrar pago o aumento**: Usa los botones con iconos de check (pago) o suma (aumento) en cada tarjeta de cliente.
3. **Ver historial**: Haz clic en el botón "Ver historial" (con icono de reloj) para desplegar el historial de operaciones. Puedes eliminar operaciones individuales.
4. **Eliminar cliente**: Usa el botón de papelera en la tarjeta del cliente. Se pedirá confirmación.
5. **Cambiar moneda global**: Selecciona la moneda en la parte superior para ver todos los valores convertidos, incluyendo clientes pagados.
6. **Configurar tasas**: Haz clic en "Configurar Tasas" para agregar, modificar o eliminar tasas de cambio.
7. **Clientes pagados**: Usa el botón "Ver Pagados" para mostrar/ocultar los clientes con deuda saldada.

## Notas técnicas

- Los datos se guardan en el almacenamiento local del navegador (localStorage).
- Al cambiar la moneda global o las tasas, todos los valores y pagos se recalculan automáticamente.
- El historial de cada cliente es editable (puedes eliminar operaciones, excepto la inicial).
- El diseño utiliza TailwindCSS y estilos personalizados en `style.css`.

## Mejoras recientes

- Botones con iconos SVG y animaciones.
- Corrección de la eliminación de clientes y operaciones.
- Visualización de valores en moneda global en clientes pagados.
- Recalculo automático de pagos y deudas al cambiar tasas o moneda global.

## Instalación y ejecución

1. Descarga o clona este repositorio.
2. Abre el archivo `index.html` en tu navegador.
3. ¡Listo para usar!

---
Desarrollado por Stan Service. Agosto 2025.
