import React, { useState } from 'react';

export default function MobileNav({
  currentView,
  setCurrentView,
  cartCount,
  isCartOpen,
  onCartOpen,
  onCartClose,
  categories,
  activeCategory,
  onCategoryChange,
  session,
  isAdmin,
  onLoginOpen,
  onLogout
}) {
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const handleTabClick = (view) => {
    setIsCategorySheetOpen(false);
    if (view === 'cart') {
      onCartOpen();
    } else if (view === 'session') {
      if (onCartClose) onCartClose();
      if (session) {
        onLogout();
      } else {
        onLoginOpen();
      }
    } else {
      if (onCartClose) onCartClose();
      setCurrentView('catalog');
    }
  };

  const handleCategorySelect = (catName) => {
    onCategoryChange(catName);
    setIsCategorySheetOpen(false);
    setCurrentView('catalog');
  };

  // Determine active states
  const isHomeActive = currentView === 'catalog' && !isCategorySheetOpen && !isCartOpen;
  const isOrdersActive = (currentView === 'orders' || currentView === 'my-orders') && !isCartOpen;

  return (
    <>
      <nav className="mobile-nav-bar">
        <button
          type="button"
          className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`}
          onClick={() => handleTabClick('catalog')}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Inicio</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${isCategorySheetOpen ? 'active' : ''}`}
          onClick={() => {
            setIsCategorySheetOpen(!isCategorySheetOpen);
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          <span>Categorías</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item mobile-nav-cart ${isCartOpen ? 'active' : ''}`}
          onClick={() => handleTabClick('cart')}
        >
          <div className="cart-icon-wrapper">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </div>
          <span>Carrito</span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => handleTabClick('session')}
        >
          {session ? (
            <>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Salir</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Ingresar</span>
            </>
          )}
        </button>
      </nav>

      {/* Modern Slide-up Category Sheet */}
      {isCategorySheetOpen && (
        <div className="mobile-sheet-backdrop" onClick={() => setIsCategorySheetOpen(false)}>
          <div className="mobile-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-drag-handle"></div>
              <h3>Seleccionar Categoría</h3>
              <button className="mobile-sheet-close" onClick={() => setIsCategorySheetOpen(false)}>&times;</button>
            </div>
            <div className="mobile-sheet-content">
              {categories.map((catName) => (
                <button
                  key={catName}
                  className={`mobile-category-option ${activeCategory === catName ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(catName)}
                >
                  {catName === 'Todos' ? 'Todas las categorías' : catName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
