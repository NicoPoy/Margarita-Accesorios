import React from 'react';

function Header() {
  return (
    <header className="brand-header">
      <div className="brand-lockup">
        <img src="/logo-margarita.png" alt="Margarita Accesorios" />
        <div className="brand-copy">
          <span className="eyebrow">Nueva coleccion</span>
          <h1>Margarita Accesorios</h1>
          <p>Aros, anillos, collares y detalles delicados para todos los dias.</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
