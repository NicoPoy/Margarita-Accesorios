import React from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

const formatDate = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));

const formatPaymentMethod = (value) => {
  const labels = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    mercado_pago: 'Mercado Pago'
  };

  return labels[value] || value || 'Sin definir';
};

const formatPaymentStatus = (value) => {
  const labels = {
    aprobado: 'Pago aprobado',
    comprobante_recibido: 'Comprobante recibido',
    comprobante_pendiente: 'Comprobante pendiente',
    pendiente: 'Pago pendiente'
  };

  return labels[value] || `Pago: ${value || 'pendiente'}`;
};

function AdminOrders({
  badge = 'Solo admin',
  emptyText = 'Todavia no hay pedidos cargados.',
  isLoading,
  message,
  orders,
  showCustomer = true,
  title = 'Pedidos',
  onMarkDelivered,
  onPaymentReceived,
  onRefresh
}) {
  return (
    <section className="admin-orders">
      <div className="admin-orders-heading">
        <div>
          <span>{badge}</span>
          <h2>{title}</h2>
        </div>
        <button className="admin-secondary-button" type="button" onClick={onRefresh}>
          Actualizar
        </button>
      </div>

      {message && <p className="admin-message error">{message}</p>}

      {isLoading ? (
        <p className="admin-empty">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">{emptyText}</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const isDelivered = order.status === 'entregado';
            const needsTransferReceipt =
              order.paymentMethod === 'transferencia' &&
              order.paymentStatus !== 'comprobante_recibido' &&
              order.paymentStatus !== 'aprobado';
            const canDeliver = !needsTransferReceipt;

            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span>Pedido #{order.id}</span>
                    <h3>
                      {showCustomer
                        ? order.customer.name
                        : `Pedido del ${formatDate(order.date)}`}
                    </h3>
                    {showCustomer && (
                      <p>
                        {order.customer.whatsapp || 'Sin WhatsApp'} - DNI{' '}
                        {order.customer.dni || 'Sin DNI'}
                      </p>
                    )}
                  </div>

                  <div className="order-status-box">
                    <strong>{formatPrice(order.total)}</strong>
                    <span className={isDelivered ? 'status-delivered' : 'status-pending'}>
                      {isDelivered ? 'Entregado' : 'Entrega pendiente'}
                    </span>
                  </div>
                </div>

                <div className="order-meta">
                  <span className="order-chip-date">{formatDate(order.date)}</span>
                  <span className="order-chip-method">
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                  <span className="order-chip-payment">
                    {formatPaymentStatus(order.paymentStatus)}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={item.id}>
                      <img
                        src={item.product.image || DEFAULT_PRODUCT_IMAGE}
                        alt=""
                        aria-hidden="true"
                      />
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.product.category}</span>
                        {item.variety && <small>{item.variety}</small>}
                      </div>
                      <span>{item.quantity} u.</span>
                      <span>{formatPrice(item.unitPrice)}</span>
                      <b>{formatPrice(item.subtotal)}</b>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <span>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} productos
                  </span>
                  {onMarkDelivered && !isDelivered && (
                    <div className="order-actions">
                      {needsTransferReceipt && onPaymentReceived && (
                        <button
                          className="admin-secondary-button"
                          type="button"
                          onClick={() => onPaymentReceived(order.id)}
                        >
                          Confirmar comprobante recibido
                        </button>
                      )}
                      <button
                        className="admin-submit"
                        type="button"
                        disabled={!canDeliver}
                        onClick={() => onMarkDelivered(order.id)}
                      >
                        Marcar como entregado
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminOrders;
