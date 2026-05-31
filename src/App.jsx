import React, { useMemo, useState } from 'react';

const DEFAULT_PRODUCT_IMAGE = '/product-placeholder.svg';

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.04 2C6.57 2 2.13 6.42 2.13 11.86C2.13 13.6 2.59 15.3 3.47 16.79L2 22L7.36 20.59C8.8 21.37 10.4 21.78 12.03 21.78C17.5 21.78 21.94 17.36 21.94 11.92C21.94 9.28 20.91 6.8 19.04 4.94C17.17 3.08 14.69 2.05 12.04 2ZM12.03 20.1C10.58 20.1 9.16 19.71 7.92 18.98L7.62 18.8L4.44 19.64L5.29 16.55L5.09 16.23C4.28 14.94 3.85 13.43 3.85 11.86C3.85 7.35 7.52 3.68 12.04 3.68C14.23 3.68 16.29 4.53 17.84 6.08C19.39 7.63 20.24 9.68 20.24 11.92C20.23 16.43 16.56 20.1 12.03 20.1ZM16.52 13.97C16.27 13.85 15.06 13.25 14.83 13.17C14.6 13.09 14.43 13.05 14.26 13.29C14.09 13.54 13.61 14.09 13.47 14.26C13.32 14.43 13.18 14.45 12.93 14.32C12.68 14.2 11.89 13.94 10.96 13.11C10.23 12.46 9.74 11.66 9.59 11.41C9.45 11.16 9.58 11.03 9.7 10.91C9.81 10.8 9.95 10.62 10.07 10.48C10.19 10.33 10.23 10.23 10.31 10.06C10.39 9.89 10.35 9.75 10.29 9.63C10.23 9.51 9.72 8.29 9.51 7.8C9.3 7.31 9.09 7.38 8.94 7.37H8.46C8.29 7.37 8.02 7.43 7.79 7.68C7.56 7.93 6.91 8.53 6.91 9.75C6.91 10.97 7.82 12.15 7.94 12.32C8.06 12.49 9.72 15.04 12.27 16.14C12.88 16.4 13.35 16.55 13.72 16.66C14.33 16.85 14.89 16.82 15.33 16.76C15.82 16.69 16.82 16.16 17.03 15.57C17.24 14.98 17.24 14.48 17.18 14.37C17.11 14.27 16.76 14.09 16.52 13.97Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2ZM7.6 4C5.61 4 4 5.61 4 7.6V16.4C4 18.39 5.61 20 7.6 20H16.4C18.39 20 20 18.39 20 16.4V7.6C20 5.61 18.39 4 16.4 4H7.6ZM17.25 5.5C17.94 5.5 18.5 6.06 18.5 6.75C18.5 7.44 17.94 8 17.25 8C16.56 8 16 7.44 16 6.75C16 6.06 16.56 5.5 17.25 5.5ZM12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" />
    </svg>
  );
}

const baseProducts = [
  { id: 1, name: 'Aros pelotita cocida chiquitos', category: 'Aros', price: 1500 },
  { id: 2, name: 'Aros especiales florecitas', category: 'Aros', price: 2500 },
  { id: 3, name: 'Pulsera dorada', category: 'Pulseras', price: 2000 },
  { id: 4, name: 'Hebillas japonesas', category: 'Hebillas', price: 4500 },
  { id: 5, name: 'Set de resaltadores x6', category: 'Accesorios', price: 3000 },
  { id: 6, name: 'Aro oso', category: 'Aros', price: 2000 },
  { id: 7, name: 'Aros motivo agujas', category: 'Aros', price: 2800 },
  { id: 8, name: 'Aros corongi', category: 'Aros', price: 2900 },
  { id: 9, name: 'Aros flor dorada', category: 'Aros', price: 2800 },
  { id: 10, name: 'Colitas de terciopelo', category: 'Accesorios', price: 800 },
  { id: 11, name: 'Pinzita de depilar', category: 'Belleza', price: 1000 },
  { id: 12, name: 'Colitas chicas x2', category: 'Accesorios', price: 800 },
  { id: 13, name: 'Bijou', category: 'Accesorios', price: 1800 },
  { id: 14, name: 'Hebillitas sapito', category: 'Hebillas', price: 1000 },
  { id: 15, name: 'Anillo corona', category: 'Anillos', price: 2500 },
  { id: 16, name: 'Anillo piedras', category: 'Anillos', price: 3000 },
  { id: 17, name: 'Anillo cruz rosa', category: 'Anillos', price: 1800 },
  { id: 18, name: 'Anillo rayado negro', category: 'Anillos', price: 2000 },
  { id: 19, name: 'Anillo cinta lisa', category: 'Anillos', price: 1800 },
  { id: 20, name: 'Anillo con brillos', category: 'Anillos', price: 2500 },
  { id: 21, name: 'Anillo dibujo chino', category: 'Anillos', price: 2200 },
  { id: 22, name: 'Aro colgante mariposa', category: 'Aros', price: 1800 },
  { id: 23, name: 'Aro colgante cuadrado', category: 'Aros', price: 2000 },
  { id: 24, name: 'Aro colgante corazon', category: 'Aros', price: 2000 },
  { id: 25, name: 'Aro colgante con bolitas chicas', category: 'Aros', price: 2200 },
  { id: 26, name: 'Aro colgante con bolitas grandes', category: 'Aros', price: 2800 },
  { id: 27, name: 'Aro colgante dorado', category: 'Aros', price: 2000 },
  { id: 28, name: 'Aros de perla chicos', category: 'Aros', price: 1000 },
  { id: 29, name: 'Aros de perla medianos', category: 'Aros', price: 1500 },
  { id: 30, name: 'Aros de perla grandes', category: 'Aros', price: 2000 }
];

const products = baseProducts.map((product) => ({
  ...product,
  image: product.image || DEFAULT_PRODUCT_IMAGE,
  stock: 1
}));

const categories = [
  'Todos',
  ...new Set(products.map((product) => product.category).sort((a, b) => a.localeCompare(b)))
];

const formatPrice = (price) => `$${price.toLocaleString('es-AR')}`;

function App() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  return (
    <main className="page-shell">
      <header className="brand-header">
        <div className="brand-lockup">
          <img src="/logo-margarita.svg" alt="Accesorios Margarita" />
          <div>
            <span className="eyebrow">Tienda online</span>
            <h1>Accesorios Margarita</h1>
            {/* <p>Accesorios, bijou y detalles seleccionados.</p> */}
          </div>
        </div>
        <button className="login-button" type="button">Iniciar sesion</button>
      </header>

      <section className="toolbar" aria-label="Filtros del catalogo">
        <label className="search-field">
          <span>Buscar</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Aros, anillos, hebillas..."
          />
        </label>

        <label className="select-field">
          <span>Categoria</span>
          <select
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="catalog" aria-live="polite">
        <div className="catalog-heading">
          <h2>{activeCategory === 'Todos' ? 'Todos los productos' : activeCategory}</h2>
          <span>{filteredProducts.length} resultados</span>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image || DEFAULT_PRODUCT_IMAGE} alt={product.name} />
              </div>
              <div className="product-info">
                <p>{product.category}</p>
                <h3>{product.name}</h3>
              </div>
              <div className="product-price">
                <strong>{formatPrice(product.price)}</strong>
                <span>Stock {product.stock}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-panel">
          <div className="footer-brand">
            <img src="/logo-margarita.svg" alt="" aria-hidden="true" />
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
    </main>
  );
}

export default App;
