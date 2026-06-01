import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

const initialForm = {
  name: '',
  categoryId: '',
  price: '',
  stock: '1',
  photoFile: null
};

function AdminPanel({ categories, message, outOfStockProducts, onCreateProduct }) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const categoryOptions = useMemo(
    () =>
      [...categories]
        .filter((category) => category.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PRODUCT_IMAGE);

  useEffect(() => {
    if (!form.photoFile) {
      setPreviewUrl(DEFAULT_PRODUCT_IMAGE);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(form.photoFile);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [form.photoFile]);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!form.name.trim() || !form.categoryId) {
      setLocalError('Completa nombre y categoria para crear el producto.');
      return;
    }

    if (Number(form.price) <= 0) {
      setLocalError('El precio tiene que ser mayor a cero.');
      return;
    }

    if (Number(form.stock) < 0) {
      setLocalError('El stock no puede ser negativo.');
      return;
    }

    setIsSaving(true);
    const wasCreated = await onCreateProduct({
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      stock: form.stock,
      photoFile: form.photoFile
    });
    setIsSaving(false);

    if (wasCreated) {
      setForm(initialForm);
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <span>Gestion</span>
        <h2>Administrar productos</h2>
      </div>

      <div className="admin-layout">
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Nombre</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ej: Aros perlados"
            />
          </label>

          <label>
            <span>Categoria</span>
            <select
              value={form.categoryId}
              onChange={(event) => updateField('categoryId', event.target.value)}
            >
              <option value="">Seleccionar categoria</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-row">
            <label>
              <span>Precio</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                placeholder="2500"
              />
            </label>

            <label>
              <span>Stock</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Foto del producto</span>
            <div className="admin-file-field">
              <img src={previewUrl} alt="" aria-hidden="true" />
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    updateField('photoFile', event.target.files?.[0] || null)
                  }
                />
                <small>
                  Opcional. Si no cargas foto, se usa la imagen generica.
                </small>
              </div>
            </div>
          </label>

          {(localError || message) && (
            <p className={`admin-message ${localError ? 'error' : 'success'}`}>
              {localError || message}
            </p>
          )}

          <button className="admin-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Agregar producto'}
          </button>
        </form>

        <div className="admin-stock-section">
          <div>
            <span>Solo admin</span>
            <h3>Sin stock</h3>
          </div>

          {outOfStockProducts.length === 0 ? (
            <p className="admin-empty">Todavia no hay productos sin stock.</p>
          ) : (
            <div className="admin-stock-list">
              {outOfStockProducts.map((product) => (
                <article className="admin-stock-item" key={product.id}>
                  <img
                    src={product.image || DEFAULT_PRODUCT_IMAGE}
                    alt=""
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category}</span>
                  </div>
                  <b>{formatPrice(product.price)}</b>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
