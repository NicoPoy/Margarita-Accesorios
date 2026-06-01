import React, { useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

function ProductCard({
  canAddToCart,
  canManageProducts,
  onOpenDetail,
  product,
  onAddToCart,
  onDeleteProduct,
  onEditProduct
}) {
  const [selectedVariety, setSelectedVariety] = useState('');
  const hasVarieties = product.varieties?.length > 0;
  const selectedVariant = product.variants?.find(
    (variant) => variant.name === selectedVariety
  );
  const totalAvailableStock = product.availableStock ?? product.stock;
  const selectedStock = selectedVariant ? selectedVariant.stock : totalAvailableStock;
  const needsSelection = hasVarieties && !selectedVariety;
  const mainImage = product.images?.[0] || product.image || DEFAULT_PRODUCT_IMAGE;

  const handleAddToCart = () => {
    if (needsSelection) return;

    onAddToCart(product, {
      variety: selectedVariety
    });
  };

  return (
    <article className="product-card">
      <div className="product-image">
        <button type="button" onClick={() => onOpenDetail(product)}>
          <img src={mainImage} alt={product.name} />
        </button>
      </div>
      <div className="product-info">
        <p>{product.category}</p>
        <h3>{product.name}</h3>
      </div>

      {hasVarieties && (
        <div className="product-options">
          <label>
            <span>Variedad</span>
            <select
              value={selectedVariety}
              onChange={(event) => setSelectedVariety(event.target.value)}
            >
              <option value="">Elegir variedad</option>
              {product.varieties.map((variety) => (
                <option key={variety} value={variety}>
                  {variety}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {!hasVarieties && <div className="product-options product-options-placeholder" aria-hidden="true" />}

      <div className="product-price">
        <strong>{formatPrice(product.price)}</strong>
        <span>Stock {needsSelection ? totalAvailableStock : selectedStock}</span>
      </div>
      {canAddToCart && (
        <button
          className="add-cart-button"
          type="button"
          disabled={selectedStock === 0 || needsSelection}
          onClick={handleAddToCart}
        >
          {selectedStock === 0
            ? 'Sin stock'
            : needsSelection
              ? 'Elegir opcion'
              : 'Agregar al carrito'}
        </button>
      )}
      {canManageProducts && (
        <div className="product-manage-actions">
          <button
            className="edit-product-button"
            type="button"
            onClick={() => onEditProduct(product)}
          >
            Modificar
          </button>
          <button
            className="delete-product-button"
            type="button"
            onClick={() => onDeleteProduct(product)}
          >
            Eliminar
          </button>
        </div>
      )}
    </article>
  );
}

function ProductCatalog({
  activeCategory,
  canAddToCart = true,
  canManageProducts = false,
  products,
  onAddToCart,
  onDeleteProduct,
  onEditProduct
}) {
  const [detailProduct, setDetailProduct] = useState(null);

  return (
    <section className="catalog" aria-live="polite">
      <div className="catalog-heading">
        <h2>{activeCategory === 'Todos' ? 'Todos los productos' : activeCategory}</h2>
        <span>{products.length} resultados</span>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            canAddToCart={canAddToCart}
            canManageProducts={canManageProducts}
            key={product.id}
            onOpenDetail={setDetailProduct}
            product={product}
            onAddToCart={onAddToCart}
            onDeleteProduct={onDeleteProduct}
            onEditProduct={onEditProduct}
          />
        ))}
      </div>

      {detailProduct && (
        <ProductDetail
          canAddToCart={canAddToCart}
          product={detailProduct}
          onAddToCart={onAddToCart}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </section>
  );
}

function ProductDetail({ canAddToCart, product, onAddToCart, onClose }) {
  const images = product.images?.length ? product.images : [product.image || DEFAULT_PRODUCT_IMAGE];
  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedVariety, setSelectedVariety] = useState('');
  const hasVarieties = product.varieties?.length > 0;
  const selectedVariant = product.variants?.find(
    (variant) => variant.name === selectedVariety
  );
  const needsSelection = hasVarieties && !selectedVariety;
  const totalAvailableStock = product.availableStock ?? product.stock;
  const selectedStock = selectedVariant ? selectedVariant.stock : totalAvailableStock;

  return (
    <div className="product-detail-backdrop" role="presentation">
      <article className="product-detail" role="dialog" aria-modal="true">
        <button className="product-detail-close" type="button" onClick={onClose}>
          x
        </button>
        <div className="product-detail-gallery">
          <img src={activeImage} alt={product.name} />
          {images.length > 1 && (
            <div>
              {images.map((image) => (
                <button
                  className={image === activeImage ? 'is-active' : ''}
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt="" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <span>{product.category}</span>
          <h3>{product.name}</h3>
          <strong>{formatPrice(product.price)}</strong>
          <p>Stock disponible: {needsSelection ? totalAvailableStock : selectedStock}</p>

          {hasVarieties && (
            <div className="product-options">
              <label>
                <span>Variedad</span>
                <select
                  value={selectedVariety}
                  onChange={(event) => setSelectedVariety(event.target.value)}
                >
                  <option value="">Elegir variedad</option>
                  {product.varieties.map((variety) => (
                    <option key={variety} value={variety}>
                      {variety}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {canAddToCart && (
            <button
              className="add-cart-button"
              type="button"
              disabled={selectedStock === 0 || needsSelection}
              onClick={() =>
                onAddToCart(product, {
                  variety: selectedVariety
                })
              }
            >
              {selectedStock === 0
                ? 'Sin stock'
                : needsSelection
                  ? 'Elegir opcion'
                  : 'Agregar al carrito'}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

export default ProductCatalog;
