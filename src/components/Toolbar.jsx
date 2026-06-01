import React from 'react';

function Toolbar({ activeCategory, categories, query, onCategoryChange, onQueryChange }) {
  return (
    <section className="toolbar" aria-label="Filtros del catalogo">
      <label className="search-field">
        <span>Buscar</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Aros, anillos, hebillas..."
        />
      </label>

      <label className="select-field">
        <span>Categoria</span>
        <select
          value={activeCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export default Toolbar;
