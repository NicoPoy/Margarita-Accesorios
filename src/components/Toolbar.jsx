import React from 'react';

const sortOptions = [
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'stock-desc', label: 'Mas stock' }
];

const stockFilterOptions = [
  { value: 'with-stock', label: 'Con stock' },
  { value: 'without-stock', label: 'Sin stock' },
  { value: 'all', label: 'Todos' }
];

function Toolbar({
  activeCategory,
  adminStockFilter,
  categories,
  isAdmin = false,
  query,
  sortOrder,
  onCategoryChange,
  onQueryChange,
  onSortOrderChange,
  onStockFilterChange
}) {

  return (
    <section className="catalog-controls" aria-label="Filtros del catalogo">
      <div className="search-bar-wrapper">
        <div className="search-copy">
          <span>Buscar productos</span>
          <strong>Encontra tu accesorio ideal</strong>
          <p>Aros, anillos, collares y detalles para cada ocasion.</p>
        </div>
        <label className="search-field">
          <span>Buscar</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por nombre, categoria o estilo..."
          />
        </label>
        <div className="search-brand-mark" aria-hidden="true">
          <img src="/logo-margarita.png" alt="" />
        </div>
      </div>

      <aside className="sidebar-filters-wrapper">
        <h3>Filtros</h3>

        <label className="select-field">
          <span>Ordenar por</span>
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {isAdmin && (
          <label className="select-field">
            <span>Stock</span>
            <select
              value={adminStockFilter}
              onChange={(event) => onStockFilterChange(event.target.value)}
            >
              {stockFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="category-filter-group">
          <span>Categorias</span>
          <div className="category-filter-list">
            {categories.map((category) => (
              <button
                className={category === activeCategory ? 'is-active' : ''}
                key={category}
                type="button"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}

export default Toolbar;
