import React from 'react';
import { CartIcon } from './icons';

function TopActions({
  cartCount,
  displayName,
  isAdmin,
  onCartOpen,
  onLoginOpen,
  onLogout,
  session
}) {
  return (
    <div className="top-actions">
      {session ? (
        <div className="session-actions">
          <span>Hola, {displayName}</span>
          {!isAdmin && (
            <button className="cart-button" type="button" onClick={onCartOpen}>
              <CartIcon />
              <span>Carrito</span>
              {cartCount > 0 && <strong>{cartCount}</strong>}
            </button>
          )}
          <button className="login-button" type="button" onClick={onLogout}>
            Cerrar sesion
          </button>
        </div>
      ) : (
        <button className="login-button" type="button" onClick={onLoginOpen}>
          Iniciar sesion
        </button>
      )}
    </div>
  );
}

export default TopActions;
