import React from 'react';
import { CartIcon } from './icons';
import { formatPrice } from '../utils/formatters';

function CartDrawer({
  cartItems,
  cartMessage,
  isClient,
  isOpen,
  onCheckout,
  onClose,
  onDecrease,
  onIncrease,
  onRemove,
  onClear
}) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="cart-backdrop" role="presentation">
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-header">
          <div>
            <span>Carrito</span>
            <h2 id="cart-title">Tu seleccion</h2>
          </div>
          <button className="cart-close" type="button" onClick={onClose} aria-label="Cerrar carrito">
            x
          </button>
        </div>

        {!isClient && (
          <p className="cart-notice">Solo las cuentas con rol cliente pueden agregar productos.</p>
        )}

        {cartMessage && <p className="cart-message">{cartMessage}</p>}

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <CartIcon />
            <strong>El carrito esta vacio</strong>
            <span>Agrega productos desde el catalogo para iniciar un pedido.</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img src={item.image} alt="" aria-hidden="true" />
                  <div>
                    <h3>{item.name}</h3>
                    <span>{formatPrice(item.price)}</span>
                    <div className="cart-quantity" aria-label={`Cantidad de ${item.name}`}>
                      <button type="button" onClick={() => onDecrease(item.id)}>-</button>
                      <strong>{item.quantity}</strong>
                      <button type="button" onClick={() => onIncrease(item.id)}>+</button>
                    </div>
                  </div>
                  <button className="cart-remove" type="button" onClick={() => onRemove(item.id)}>
                    Quitar
                  </button>
                </article>
              ))}
            </div>

            <div className="cart-summary">
              <div>
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <button type="button" className="cart-checkout" onClick={onCheckout}>
                Finalizar pedido
              </button>
              <button type="button" className="cart-clear" onClick={onClear}>
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
