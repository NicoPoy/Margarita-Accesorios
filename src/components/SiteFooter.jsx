import React from 'react';
import { InstagramIcon, WhatsAppIcon } from './icons';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-panel">
        <div className="footer-brand">
          <img src="/logo-margarita.png" alt="" aria-hidden="true" />
          <div>
            <span>Contacto</span>
            <strong>Accesorios Margarita</strong>
            <p>Consultas y pedidos por nuestros canales oficiales.</p>
          </div>
        </div>

        <nav className="contact-links" aria-label="Datos de contacto">
          <a href="https://wa.me/5492226606589" target="_blank" rel="noreferrer">
            <WhatsAppIcon />
            <span>+54 9 2226 60-6589</span>
          </a>
          <a
            href="https://www.instagram.com/accesorios.margarita.2026"
            target="_blank"
            rel="noreferrer"
          >
            <InstagramIcon />
            <span>@accesorios.margarita.2026</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;
