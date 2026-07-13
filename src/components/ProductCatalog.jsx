import React, { useEffect, useMemo, useState } from 'react';
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const hasVarieties = product.varieties?.length > 0;
  const selectedVariant = product.variants?.find(
    (variant) => variant.name === selectedVariety
  );
  const totalAvailableStock = product.availableStock ?? product.stock;
  const selectedStock = selectedVariant ? selectedVariant.stock : totalAvailableStock;
  const needsSelection = hasVarieties && !selectedVariety;
  const productImages = product.images?.length
    ? product.images
    : [product.image || DEFAULT_PRODUCT_IMAGE];
  const mainImage = productImages[activeImageIndex] || productImages[0];
  const hasMultipleImages = productImages.length > 1;

  const changeImage = (event, direction) => {
    event.stopPropagation();
    setActiveImageIndex((currentIndex) =>
      (currentIndex + direction + productImages.length) % productImages.length
    );
  };

  const selectImage = (event, imageIndex) => {
    event.stopPropagation();
    setActiveImageIndex(imageIndex);
  };

  const handleAddToCart = () => {
    if (needsSelection) return;

    onAddToCart(product, {
      variety: selectedVariety
    });
  };

  return (
    <article className="product-card">
      <span className="product-card-mark" aria-hidden="true">
        <img src="/favicon.png" alt="" />
      </span>
      <div className="product-image">
        <button type="button" onClick={() => onOpenDetail(product)}>
          <img src={mainImage} alt={product.name} />
        </button>
        {hasMultipleImages && (
          <>
            <button
              className="product-image-nav product-image-nav-left"
              type="button"
              onClick={(event) => changeImage(event, -1)}
              aria-label="Ver foto anterior"
            >
              &lt;
            </button>
            <button
              className="product-image-nav product-image-nav-right"
              type="button"
              onClick={(event) => changeImage(event, 1)}
              aria-label="Ver foto siguiente"
            >
              &gt;
            </button>
            <div className="product-image-dots">
              {productImages.map((image, imageIndex) => (
                <button
                  className={imageIndex === activeImageIndex ? 'is-active' : ''}
                  key={`${image}-${imageIndex}`}
                  type="button"
                  onClick={(event) => selectImage(event, imageIndex)}
                  aria-label={`Ver foto ${imageIndex + 1} de ${product.name}`}
                />
              ))}
            </div>
          </>
        )}
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
          aria-label={`Agregar ${product.name} al carrito`}
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

const getVisiblePageItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1
  ]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  const visiblePages = [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  return visiblePages.flatMap((pageNumber, index) => {
    const previousPage = visiblePages[index - 1];

    if (previousPage && pageNumber - previousPage > 1) {
      return [`ellipsis-${previousPage}-${pageNumber}`, pageNumber];
    }

    return [pageNumber];
  });
};

function ProductCatalog({
  activeCategory,
  canAddToCart = true,
  canManageProducts = false,
  itemsPerPage = 12,
  products,
  onAddToCart,
  onDeleteProduct,
  onEditProduct,
  resetKey
}) {
  const [detailProduct, setDetailProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = Number(itemsPerPage) || 12;
  const totalPages = Math.ceil(products.length / pageSize);
  const visibleProducts = useMemo(
    () =>
      products.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [currentPage, pageSize, products]
  );
  const hasPagedProducts = products.length > pageSize;
  const visiblePageItems = useMemo(
    () => getVisiblePageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (totalPages && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="catalog" aria-live="polite">
      <div className="catalog-heading">
        <h2>
          {products.length
            ? `Mostrando ${visibleProducts.length} de ${products.length} productos`
            : 'Sin resultados'}
        </h2>
        <span>{activeCategory === 'Todos' ? 'Todos' : activeCategory}</span>
      </div>

      {products.length ? (
        <>
          <div className="product-grid">
            {visibleProducts.map((product) => (
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

          {hasPagedProducts && (
            <nav className="catalog-pagination" aria-label="Paginacion del catalogo">
              <button
                className="catalog-page-control"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Anterior
              </button>

              <div className="catalog-page-list">
                {visiblePageItems.map((pageItem) => {
                  if (typeof pageItem === 'string') {
                    return (
                      <span className="catalog-page-ellipsis" key={pageItem}>
                        ...
                      </span>
                    );
                  }

                  const pageNumber = pageItem;

                  return (
                    <button
                      className={`catalog-page-number ${
                        pageNumber === currentPage ? 'is-active' : ''
                      }`}
                      type="button"
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                      aria-label={`Ir a pagina ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                className="catalog-page-control"
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="catalog-empty">
          <strong>No encontramos productos con esos filtros.</strong>
          <span>Proba buscar por otra palabra, categoria u orden.</span>
        </div>
      )}

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
  const [zoomImage, setZoomImage] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState('');
  const hasVarieties = product.varieties?.length > 0;
  const selectedVariant = product.variants?.find(
    (variant) => variant.name === selectedVariety
  );
  const needsSelection = hasVarieties && !selectedVariety;
  const totalAvailableStock = product.availableStock ?? product.stock;
  const selectedStock = selectedVariant ? selectedVariant.stock : totalAvailableStock;
  const handleClose = () => {
    setZoomImage(null);
    onClose();
  };

  return (
    <div className="product-detail-backdrop" role="presentation" onClick={handleClose}>
      <article
        className="product-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="product-detail-close"
          type="button"
          onClick={handleClose}
          aria-label="Cerrar detalle del producto"
        >
          x
        </button>
        <span className="product-detail-mark" aria-hidden="true">
          <img src="/favicon.png" alt="" />
        </span>
        <div className="product-detail-gallery">
          <button
            className="product-detail-main-image"
            type="button"
            onClick={() => setZoomImage(activeImage)}
            aria-label="Ampliar foto del producto"
          >
            <img src={activeImage} alt={product.name} />
            <span className="product-detail-image-mark" aria-hidden="true">
              <img src="/favicon.png" alt="" />
            </span>
          </button>
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
          <h3 id="product-detail-title">{product.name}</h3>
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
              aria-label={`Agregar ${product.name} al carrito`}
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

      {zoomImage && (
        <div
          className="product-zoom"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            e.stopPropagation();
            setZoomImage(null);
          }}
        >
          <button
            className="product-zoom-close"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomImage(null);
            }}
            aria-label="Cerrar imagen ampliada"
          >
            x
          </button>
          <img src={zoomImage} alt={product.name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
