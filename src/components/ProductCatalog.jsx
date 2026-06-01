import React from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

function ProductCatalog({ activeCategory, canAddToCart = true, products, onAddToCart }) {
  return (
    <section className="catalog" aria-live="polite">
      <div className="catalog-heading">
        <h2>{activeCategory === 'Todos' ? 'Todos los productos' : activeCategory}</h2>
        <span>{products.length} resultados</span>
      </div>

      <div className="product-grid">
        {products.map((product) => (
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
            {canAddToCart && (
              <button
                className="add-cart-button"
                type="button"
                disabled={product.stock === 0}
                onClick={() => onAddToCart(product)}
              >
                {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductCatalog;
