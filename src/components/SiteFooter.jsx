import React from 'react';
import { InstagramIcon, WhatsAppIcon } from './icons';
import { buildWhatsAppUrl, WHATSAPP_NUMBER } from '../utils/contact';

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
          <a
            href={buildWhatsAppUrl('Hola, quiero consultar por productos de Accesorios Margarita.')}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon />
            <span>{WHATSAPP_NUMBER}</span>
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
