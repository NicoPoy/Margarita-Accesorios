import React, { useState } from 'react';
import { CartIcon } from './icons';

function TopActions({
  cartCount,
  currentView,
  displayName,
  isAdmin,
  isClient,
  onAdminViewChange,
  onCartOpen,
  onClientViewChange,
  onLoginOpen,
  onLogout,
  session
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = (action, view) => {
    setIsMenuOpen(false);
    if (action === 'admin') {
      onAdminViewChange(view);
    } else if (action === 'client') {
      onClientViewChange(view);
    }
  };

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    onLoginOpen();
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Desktop View */}
      <div className="top-actions desktop-only">
        {session ? (
          <div className="session-actions">
            <span>Hola, {displayName}</span>
            {isAdmin && (
              <div className="admin-top-nav" aria-label="Navegacion admin">
                <button
                  className={currentView === 'catalog' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onAdminViewChange('catalog')}
                >
                  Productos
                </button>
                <button
                  className={currentView === 'orders' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onAdminViewChange('orders')}
                >
                  Pedidos
                </button>
                <button
                  className={currentView === 'out-of-stock' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onAdminViewChange('out-of-stock')}
                >
                  Sin stock
                </button>
                <button
                  className={currentView === 'categories' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onAdminViewChange('categories')}
                >
                  Categorias
                </button>
                <button
                  className={currentView === 'raffles' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onAdminViewChange('raffles')}
                >
                  Sorteos
                </button>
              </div>
            )}
            {!isAdmin && isClient && (
              <div className="admin-top-nav" aria-label="Navegacion usuario">
                <button
                  className={currentView === 'catalog' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onClientViewChange('catalog')}
                >
                  Catalogo
                </button>
                <button
                  className={currentView === 'my-orders' ? 'is-active' : ''}
                  type="button"
                  onClick={() => onClientViewChange('my-orders')}
                >
                  Mis pedidos
                </button>
              </div>
            )}
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

      {/* Mobile Top Bar Header */}
      <div className="mobile-top-header mobile-only">
        <button
          className="mobile-hamburger-btn"
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="mobile-header-brand">
          <img src="/logo-margarita.png" alt="Margarita Logo" className="mobile-brand-logo" />
          <span className="mobile-brand-name">Margarita Accesorios</span>
        </div>

        <div className="mobile-header-right">
          {isAdmin ? (
            <span className="mobile-admin-tag">Admin</span>
          ) : (
            <div style={{ width: '36px' }} />
          )}
        </div>
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      {isMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <img src="/logo-margarita.png" alt="Margarita Logo" className="mobile-brand-logo" />
                <span className="mobile-brand-name">Margarita</span>
              </div>
              <button
                className="mobile-drawer-close"
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Cerrar menu"
              >
                &times;
              </button>
            </div>

            <div className="mobile-drawer-content">
              {session ? (
                <>
                  <div className="mobile-user-profile">
                    <div className="profile-avatar">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                      <span className="profile-greeting">Hola,</span>
                      <span className="profile-name">{displayName}</span>
                    </div>
                  </div>

                  <div className="drawer-nav-section">
                    <h4>Navegación</h4>
                    {isAdmin ? (
                      <div className="drawer-links-list">
                        <button
                          className={currentView === 'catalog' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('admin', 'catalog')}
                        >
                          Productos
                        </button>
                        <button
                          className={currentView === 'orders' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('admin', 'orders')}
                        >
                          Pedidos
                        </button>
                        <button
                          className={currentView === 'out-of-stock' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('admin', 'out-of-stock')}
                        >
                          Sin stock
                        </button>
                        <button
                          className={currentView === 'categories' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('admin', 'categories')}
                        >
                          Categorias
                        </button>
                        <button
                          className={currentView === 'raffles' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('admin', 'raffles')}
                        >
                          Sorteos
                        </button>
                      </div>
                    ) : (
                      <div className="drawer-links-list">
                        <button
                          className={currentView === 'catalog' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('client', 'catalog')}
                        >
                          Catálogo de Productos
                        </button>
                        <button
                          className={currentView === 'my-orders' ? 'active' : ''}
                          type="button"
                          onClick={() => handleMenuClick('client', 'my-orders')}
                        >
                          Mis Pedidos
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="drawer-footer">
                    <button className="drawer-logout-btn" type="button" onClick={handleLogoutClick}>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="drawer-logged-out">
                  <p>Inicia sesión para gestionar tus pedidos y acceder a tu perfil.</p>
                  <button className="drawer-login-btn" type="button" onClick={handleLoginClick}>
                    Iniciar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopActions;
