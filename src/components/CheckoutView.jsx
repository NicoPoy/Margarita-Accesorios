import React, { useState } from 'react';
import { formatPrice } from '../utils/formatters';

const WHATSAPP_NUMBER = '+54 9 2226 60-6589';
const TRANSFER_ALIAS = 'alias.lourdes';

const paymentOptions = [
  {
    id: 'efectivo',
    title: 'Efectivo',
    description: `Comunicarse al WhatsApp ${WHATSAPP_NUMBER} para coordinar el pago y la entrega.`
  },
  {
    id: 'transferencia',
    title: 'Transferencia',
    description: `Alias: ${TRANSFER_ALIAS}`
  },
  {
    id: 'mercado_pago',
    title: 'Mercado Pago',
    description: 'Paga online desde un link seguro de Mercado Pago.'
  }
];

function CheckoutView({
  cartItems,
  checkoutMessage,
  isSubmitting,
  onBack,
  onFinishOrder
}) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="checkout-view">
      <div className="checkout-heading">
        <span>Pago</span>
        <h2>Elegir medio de pago</h2>
      </div>

      <div className="checkout-layout">
        <div className="payment-options">
          {paymentOptions.map((option) => (
            <button
              className={`payment-option ${selectedMethod === option.id ? 'is-selected' : ''}`}
              key={option.id}
              type="button"
              onClick={() => setSelectedMethod(option.id)}
            >
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </button>
          ))}

          <p className="payment-proof-note">
            En caso de transferencia o Mercado Pago, y para coordinar la entrega,
            enviar el comprobante al WhatsApp {WHATSAPP_NUMBER}.
          </p>

          {checkoutMessage && <p className="checkout-message">{checkoutMessage}</p>}

          <div className="checkout-actions">
            <button className="cart-clear" type="button" onClick={onBack}>
              Volver al catalogo
            </button>
            {selectedMethod && (
              <button
                className="cart-checkout"
                type="button"
                disabled={isSubmitting}
                onClick={() => onFinishOrder(selectedMethod)}
              >
                {isSubmitting ? 'Finalizando...' : 'Finalizar pedido'}
              </button>
            )}
          </div>
        </div>

        <aside className="checkout-summary">
          <span>Resumen</span>
          <div className="checkout-summary-items">
            {cartItems.map((item) => (
              <div key={item.variantKey}>
                <span>
                  {item.quantity} x {item.name}
                  {item.variety && ` (${item.variety})`}
                </span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutView;
