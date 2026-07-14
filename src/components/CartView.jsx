import React from 'react';
import { CartIcon, WhatsAppIcon } from './icons';
import { formatPrice } from '../utils/formatters';
import { buildWhatsAppUrl } from '../utils/contact';

function CartView({
  cartItems,
  cartMessage,
  isClient,
  onCheckout,
  onDecrease,
  onIncrease,
  onRemove,
  onClear,
  onViewCatalog
}) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="cart-view">
      <div className="cart-view-heading">
        <span>Carrito</span>
        <h2>Tu seleccion</h2>
      </div>

      {!isClient && (
        <p className="cart-notice">Solo las cuentas con rol cliente pueden comprar productos.</p>
      )}

      {cartMessage && <p className="cart-message">{cartMessage}</p>}

      {cartItems.length === 0 ? (
        <div className="cart-empty cart-view-empty">
          <CartIcon />
          <strong>El carrito esta vacio</strong>
          <span>Agrega productos desde el catalogo para iniciar un pedido.</span>
          <button className="cart-checkout" type="button" onClick={onViewCatalog}>
            Ir al catalogo
          </button>
        </div>
      ) : (
        <div className="cart-view-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.variantKey}>
                <img src={item.image} alt="" aria-hidden="true" />
                <div>
                  <h3>{item.name}</h3>
                  {item.variety && <p className="cart-item-options">{item.variety}</p>}
                  <span>{formatPrice(item.price)}</span>
                  <div className="cart-quantity" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" onClick={() => onDecrease(item.variantKey)}>-</button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => onIncrease(item.variantKey)}>+</button>
                  </div>
                </div>
                <button className="cart-remove" type="button" onClick={() => onRemove(item.variantKey)}>
                  Quitar
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary cart-view-summary">
            <div>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button type="button" className="cart-checkout" onClick={onCheckout}>
              Ir a pagar
            </button>
            <a
              className="cart-whatsapp"
              href={buildWhatsAppUrl('Hola, quiero consultar por mi carrito en Accesorios Margarita.')}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon />
              Consultar por WhatsApp
            </a>
            <button type="button" className="cart-clear" onClick={onClear}>
              Vaciar carrito
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartView;
