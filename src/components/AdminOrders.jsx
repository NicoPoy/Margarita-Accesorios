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

function AdminOrders({
  isLoading,
  message,
  orders,
  onMarkDelivered,
  onRefresh
}) {
  return (
    <section className="admin-orders">
      <div className="admin-orders-heading">
        <div>
          <span>Solo admin</span>
          <h2>Pedidos</h2>
        </div>
        <button className="admin-secondary-button" type="button" onClick={onRefresh}>
          Actualizar
        </button>
      </div>

      {message && <p className="admin-message error">{message}</p>}

      {isLoading ? (
        <p className="admin-empty">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">Todavia no hay pedidos cargados.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const isDelivered = order.status === 'entregado';

            return (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span>Pedido #{order.id}</span>
                    <h3>{order.customer.name}</h3>
                    <p>
                      {order.customer.whatsapp || 'Sin WhatsApp'} · DNI{' '}
                      {order.customer.dni || 'Sin DNI'}
                    </p>
                  </div>

                  <div className="order-status-box">
                    <strong>{formatPrice(order.total)}</strong>
                    <span className={isDelivered ? 'status-delivered' : 'status-pending'}>
                      {isDelivered ? 'Entregado' : 'Entrega pendiente'}
                    </span>
                  </div>
                </div>

                <div className="order-meta">
                  <span>{formatDate(order.date)}</span>
                  <span>{formatPaymentMethod(order.paymentMethod)}</span>
                  <span>Pago: {order.paymentStatus || 'pendiente'}</span>
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
                  {!isDelivered && (
                    <button
                      className="admin-submit"
                      type="button"
                      onClick={() => onMarkDelivered(order.id)}
                    >
                      Marcar como entregado
                    </button>
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
