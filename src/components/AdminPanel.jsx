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

function AdminPanel({
  categories,
  editingProduct,
  message,
  outOfStockProducts,
  onCancelEdit,
  onCreateProduct,
  onDeleteProduct,
  onEditProduct,
  onUpdateProduct
}) {
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');
  const isEditing = Boolean(editingProduct);

  const categoryOptions = useMemo(
    () =>
      [...categories]
        .filter((category) => category.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PRODUCT_IMAGE);

  useEffect(() => {
    if (!editingProduct) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: editingProduct.name || '',
      categoryId: editingProduct.categoryId || '',
      price: String(editingProduct.price || ''),
      stock: String(editingProduct.stock ?? 0),
      photoFile: null
    });
    setPreviewUrl(editingProduct.image || DEFAULT_PRODUCT_IMAGE);
    setLocalError('');
  }, [editingProduct]);

  useEffect(() => {
    if (!form.photoFile) {
      setPreviewUrl(editingProduct?.image || DEFAULT_PRODUCT_IMAGE);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(form.photoFile);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [editingProduct, form.photoFile]);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!form.name.trim() || !form.categoryId) {
      setLocalError('Completa nombre y categoria para guardar el producto.');
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
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      stock: form.stock,
      photoFile: form.photoFile
    };

    const wasSaved = isEditing
      ? await onUpdateProduct({
          ...payload,
          id: editingProduct.id,
          currentImageUrl:
            editingProduct.image === DEFAULT_PRODUCT_IMAGE ? null : editingProduct.image,
          currentImagePath: editingProduct.imagePath
        })
      : await onCreateProduct(payload);

    setIsSaving(false);

    if (wasSaved) {
      setForm(initialForm);
    }
  };

  const handleCancelEdit = () => {
    setLocalError('');
    setForm(initialForm);
    onCancelEdit();
  };

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <span>{isEditing ? 'Edicion' : 'Gestion'}</span>
        <h2>{isEditing ? 'Modificar producto' : 'Administrar productos'}</h2>
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
                  {isEditing
                    ? 'Opcional. Si no cargas otra foto, se mantiene la actual.'
                    : 'Opcional. Si no cargas foto, se usa la imagen generica.'}
                </small>
              </div>
            </div>
          </label>

          {(localError || message) && (
            <p className={`admin-message ${localError ? 'error' : 'success'}`}>
              {localError || message}
            </p>
          )}

          <div className="admin-form-actions">
            <button className="admin-submit" type="submit" disabled={isSaving}>
              {isSaving
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Agregar producto'}
            </button>

            {isEditing && (
              <button
                className="admin-cancel-button"
                type="button"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
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
                  <button
                    className="edit-stock-product-button"
                    type="button"
                    onClick={() => onEditProduct(product)}
                  >
                    Modificar
                  </button>
                  <button
                    className="delete-stock-product-button"
                    type="button"
                    onClick={() => onDeleteProduct(product)}
                  >
                    Eliminar
                  </button>
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
