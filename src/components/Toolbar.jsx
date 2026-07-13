import React, { useEffect, useState } from 'react';

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

const priceFilterOptions = [
  { value: 'all', label: 'Todos los precios' },
  { value: 'under-5000', label: 'Hasta $5.000' },
  { value: '5000-15000', label: '$5.000 a $15.000' },
  { value: 'over-15000', label: 'Mas de $15.000' }
];

function Toolbar({
  activeCategory,
  adminStockFilter,
  categories,
  itemsPerPage,
  maxItemsPerPage = 1,
  isAdmin = false,
  priceFilter,
  sortOrder,
  onCategoryChange,
  onItemsPerPageChange,
  onPriceFilterChange,
  onSortOrderChange,
  onStockFilterChange
}) {
  const normalizedMaxItemsPerPage = Math.max(1, Number(maxItemsPerPage) || 1);
  const [itemsPerPageDraft, setItemsPerPageDraft] = useState(String(itemsPerPage));

  useEffect(() => {
    setItemsPerPageDraft(String(itemsPerPage));
  }, [itemsPerPage]);

  const applyItemsPerPage = () => {
    const numericValue = Number(itemsPerPageDraft);

    if (!Number.isFinite(numericValue) || itemsPerPageDraft.trim() === '') {
      setItemsPerPageDraft(String(itemsPerPage));
      return;
    }

    onItemsPerPageChange(
      Math.min(normalizedMaxItemsPerPage, Math.max(1, Math.floor(numericValue)))
    );
  };

  return (
    <section className="catalog-controls" aria-label="Filtros del catalogo">
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

        <label className="select-field">
          <span>Precio</span>
          <select
            value={priceFilter}
            onChange={(event) => onPriceFilterChange(event.target.value)}
          >
            {priceFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Elementos por pagina</span>
          <input
            className="items-per-page-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={itemsPerPageDraft}
            onBlur={() => setItemsPerPageDraft(String(itemsPerPage))}
            onChange={(event) => setItemsPerPageDraft(event.target.value.replace(/\D/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyItemsPerPage();
              }
            }}
            aria-label={`Elementos por pagina, maximo ${normalizedMaxItemsPerPage}`}
          />
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
