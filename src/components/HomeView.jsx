import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { InstagramIcon, WhatsAppIcon } from './icons';
import { buildWhatsAppUrl, WHATSAPP_NUMBER } from '../utils/contact';
import { formatPrice } from '../utils/formatters';

const chunkItems = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const getProductOrderValue = (product) => {
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;

  if (Number.isFinite(createdAt) && createdAt > 0) return createdAt;

  return Number(product.id) || 0;
};

function HomeView({ categories, products, onCategoryOpen, onLoginOpen, onViewCatalog, session }) {
  const [noveltiesPage, setNoveltiesPage] = useState(0);
  const visibleCategories = categories.filter((category) => category !== 'Todos').slice(0, 7);
  const latestProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => getProductOrderValue(b) - getProductOrderValue(a))
        .slice(0, 12),
    [products]
  );
  const noveltySlides = useMemo(() => chunkItems(latestProducts, 6), [latestProducts]);
  const activeNoveltySlide = noveltySlides[noveltiesPage] || noveltySlides[0] || [];
  const hasNoveltyControls = noveltySlides.length > 1;
  const heroCategories = visibleCategories.slice(0, 4);

  useEffect(() => {
    if (noveltiesPage >= noveltySlides.length) {
      setNoveltiesPage(0);
    }
  }, [noveltiesPage, noveltySlides.length]);

  const goToPreviousNovelties = () => {
    setNoveltiesPage((currentPage) =>
      currentPage === 0 ? noveltySlides.length - 1 : currentPage - 1
    );
  };

  const goToNextNovelties = () => {
    setNoveltiesPage((currentPage) =>
      currentPage + 1 >= noveltySlides.length ? 0 : currentPage + 1
    );
  };

  return (
    <section className="home-view" aria-label="Inicio Margarita Accesorios">
      <div className="home-cinematic-hero">
        <div className="home-hero-content">
          <span className="home-hero-kicker">Bienvenida a Margarita Accesorios</span>
          <h1>Tu detalle ideal, tu propio brillo.</h1>
          <p>
            Descubri accesorios delicados para regalar, combinar y sumar a tu estilo con una
            experiencia simple, linda y cercana.
          </p>
          {!!heroCategories.length && (
            <div className="home-hero-chips" aria-label="Categorias destacadas">
              {heroCategories.map((category) => (
                <button key={category} type="button" onClick={() => onCategoryOpen(category)}>
                  {category}
                </button>
              ))}
            </div>
          )}
          <div className="home-hero-actions">
            <button className="home-catalog-cta" type="button" onClick={onViewCatalog}>
              <span>Explorar catalogo</span>
              <small>{products.length} productos disponibles</small>
            </button>
            {!session && (
              <button type="button" onClick={onLoginOpen}>Ingresar</button>
            )}
          </div>
        </div>
        <div className="home-hero-logo-card" aria-label="Margarita Accesorios">
          <div className="home-hero-logo-frame">
            <img src="/logo-margarita.png" alt="Margarita Accesorios" />
          </div>
          <strong>Margarita Accesorios</strong>
          <span>Aritos - Collares - Anillos - Scrunchies</span>
        </div>
        <span className="home-hero-scroll" aria-hidden="true">v</span>
      </div>

      <div className="home-benefits">
        <div className="home-benefits-heading">
          <h2>Por que elegir Margarita?</h2>
          <p>Una compra cuidada, personal y pensada para que cada detalle llegue como corresponde.</p>
        </div>
        <div className="home-benefit-grid">
          <article>
            <span>01</span>
            <strong>Entregas coordinadas</strong>
            <p>Organizamos la entrega por WhatsApp para que recibas tu pedido con claridad.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Accesorios seleccionados</strong>
            <p>Piezas delicadas, faciles de combinar y pensadas para uso diario o regalo.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Compra simple</strong>
            <p>Catalogo, carrito y seguimiento de pedidos en vistas separadas y faciles de usar.</p>
          </article>
          <article>
            <span>04</span>
            <strong>Atencion cercana</strong>
            <p>Consultas rapidas para elegir variedad, color o coordinar cualquier detalle.</p>
          </article>
        </div>
      </div>

      {!!visibleCategories.length && (
        <div className="home-style-showcase">
          <div className="home-section-heading">
            <div>
              <span>Explora por estilo</span>
              <h2>Elegir por categoria tambien puede sentirse lindo.</h2>
            </div>
            <button type="button" onClick={onViewCatalog}>Ver todas</button>
          </div>
          <div className="home-style-layout">
            <div className="home-style-visual">
              <img src="/header-margarita-actual.png" alt="" />
            </div>
            <div className="home-style-pills">
              {visibleCategories.map((category) => (
                <button key={category} type="button" onClick={() => onCategoryOpen(category)}>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="home-novelties">
        <div className="home-section-heading">
          <div>
            <span>Ultimos ingresos</span>
            <h2>Novedades</h2>
          </div>
          <div className="home-novelties-actions">
            {hasNoveltyControls && (
              <>
                <button type="button" onClick={goToPreviousNovelties} aria-label="Ver novedades anteriores">
                  {'<'}
                </button>
                <button type="button" onClick={goToNextNovelties} aria-label="Ver mas novedades">
                  {'>'}
                </button>
              </>
            )}
            <button type="button" onClick={onViewCatalog}>Ir al catalogo</button>
          </div>
        </div>
        {activeNoveltySlide.length ? (
          <>
            <div className="home-novelties-grid">
              {activeNoveltySlide.map((product) => (
                <button
                  className="home-novelty-card"
                  key={product.id}
                  type="button"
                  onClick={() => onCategoryOpen(product.category)}
                >
                  <span className="home-novelty-image">
                    <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} />
                  </span>
                  <span className="home-novelty-category">{product.category}</span>
                  <strong>{product.name}</strong>
                  <em>{formatPrice(product.price)}</em>
                </button>
              ))}
            </div>
            {hasNoveltyControls && (
              <div className="home-novelties-dots" aria-label="Paginas de novedades">
                {noveltySlides.map((slide, index) => (
                  <button
                    aria-label={`Ver tanda ${index + 1} de novedades`}
                    className={index === noveltiesPage ? 'is-active' : ''}
                    key={slide.map((product) => product.id).join('-')}
                    type="button"
                    onClick={() => setNoveltiesPage(index)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="home-empty">
            <img src="/logo-margarita.png" alt="" />
            <strong>Estamos preparando el catalogo</strong>
            <span>Cuando haya productos disponibles van a aparecer aca.</span>
          </div>
        )}
      </div>

      <div className="home-contact-panel">
        <div>
          <span>Contacto</span>
          <h2>Te ayudamos a elegir tu proximo accesorio.</h2>
          <p>Consultas por stock, colores, variedades y entregas coordinadas.</p>
        </div>
        <div className="home-contact-actions">
          <a href={buildWhatsAppUrl('Hola, quiero consultar por productos de Margarita Accesorios.')} target="_blank" rel="noreferrer">
            <WhatsAppIcon />
            {WHATSAPP_NUMBER}
          </a>
          <a href="https://www.instagram.com/accesorios.margarita.2026" target="_blank" rel="noreferrer">
            <InstagramIcon />
            @accesorios.margarita.2026
          </a>
        </div>
      </div>
    </section>
  );
}

export default HomeView;
