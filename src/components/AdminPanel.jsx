import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PRODUCT_IMAGE } from '../data/products';
import { formatPrice } from '../utils/formatters';

const initialForm = {
  name: '',
  categoryId: '',
  price: '',
  stock: '1',
  photoFiles: [],
  varietyDraft: '',
  varieties: [],
  variantStocks: {}
};

const buildVariantStocks = (variants = []) =>
  variants.reduce(
    (stockMap, variant) => ({
      ...stockMap,
      [variant.name]: String(variant.stock ?? 0)
    }),
    {}
  );

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
  const variantRows = useMemo(
    () => form.varieties.map((name) => ({ key: name, name })),
    [form.varieties]
  );
  const generalStock = Math.max(0, Number(form.stock || 0));
  const varietiesStockTotal = useMemo(
    () =>
      variantRows.reduce(
        (sum, variant) =>
          sum + Math.max(0, Number(form.variantStocks[variant.key] || 0)),
        0
      ),
    [form.variantStocks, variantRows]
  );
  const hasStockOverflow = variantRows.length > 0 && varietiesStockTotal > generalStock;

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
      photoFiles: [],
      varietyDraft: '',
      varieties: editingProduct.varieties || [],
      variantStocks: buildVariantStocks(editingProduct.variants)
    });
    setPreviewUrl(editingProduct.image || DEFAULT_PRODUCT_IMAGE);
    setLocalError('');
  }, [editingProduct]);

  useEffect(() => {
    if (!form.photoFiles.length) {
      setPreviewUrl(editingProduct?.images?.[0] || editingProduct?.image || DEFAULT_PRODUCT_IMAGE);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(form.photoFiles[0]);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [editingProduct, form.photoFiles]);

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

    if (hasStockOverflow) {
      setLocalError('La suma del stock de las variedades no puede superar el stock general.');
      return;
    }

    setIsSaving(true);
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: form.price,
      stock: form.stock,
      photoFiles: form.photoFiles,
      varietiesText: form.varieties.join('\n'),
      variants: variantRows.map((variant) => ({
        name: variant.name,
        stock: Math.max(0, Number(form.variantStocks[variant.key] ?? 0))
      }))
    };

    const wasSaved = isEditing
      ? await onUpdateProduct({
          ...payload,
          id: editingProduct.id,
          currentImageUrl:
            editingProduct.image === DEFAULT_PRODUCT_IMAGE ? null : editingProduct.image,
          currentImageUrls: (editingProduct.images || []).filter(
            (image) => image !== DEFAULT_PRODUCT_IMAGE
          ),
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

  const updateVariantStock = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      variantStocks: {
        ...currentForm.variantStocks,
        [key]: value
      }
    }));
  };

  const addVariety = () => {
    const nextVariety = form.varietyDraft.trim();

    if (!nextVariety) return;

    if (
      form.varieties.some(
        (variety) => variety.toLowerCase() === nextVariety.toLowerCase()
      )
    ) {
      setLocalError('Esa variedad ya esta cargada.');
      return;
    }

    setLocalError('');
    setForm((currentForm) => ({
      ...currentForm,
      varietyDraft: '',
      varieties: [...currentForm.varieties, nextVariety],
      variantStocks: {
        ...currentForm.variantStocks,
        [nextVariety]: '0'
      }
    }));
  };

  const removeVariety = (name) => {
    setForm((currentForm) => {
      const nextVariantStocks = { ...currentForm.variantStocks };
      delete nextVariantStocks[name];

      return {
        ...currentForm,
        varieties: currentForm.varieties.filter((variety) => variety !== name),
        variantStocks: nextVariantStocks
      };
    });
  };

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <span>{isEditing ? 'Edicion' : 'Gestion'}</span>
        <h2>{isEditing ? 'Modificar producto' : 'Administrar productos'}</h2>
      </div>

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
            <span>Fotos del producto</span>
            <div className="admin-file-field">
              <img src={previewUrl} alt="" aria-hidden="true" />
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) =>
                    updateField('photoFiles', Array.from(event.target.files || []))
                  }
                />
                <small>
                  {isEditing
                    ? 'Opcional. Si no cargas fotos nuevas, se mantienen las actuales.'
                    : 'Opcional. Podes cargar una o varias fotos; si no cargas, se usa la imagen generica.'}
                </small>
              </div>
            </div>
          </label>

          <div className="variety-builder">
            <div className="variety-builder-header">
              <span>Variedades opcionales</span>
              <small>Agrega solo las opciones que correspondan a este producto.</small>
            </div>

            <div className="variety-add-row">
              <input
                type="text"
                value={form.varietyDraft}
                onChange={(event) => updateField('varietyDraft', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addVariety();
                  }
                }}
                placeholder="Ej: Dorado, Plateado, Rosa chico"
              />
              <button
                className="variety-add-button"
                type="button"
                onClick={addVariety}
                aria-label="Agregar variedad"
              >
                +
              </button>
            </div>
          </div>

          {variantRows.length > 0 && (
            <div className="variant-stock-editor">
              <div className="variant-stock-summary">
                <span>Stock asignado en variedades</span>
                <strong className={hasStockOverflow ? 'is-over' : ''}>
                  {varietiesStockTotal} / {generalStock}
                </strong>
              </div>
              <div>
                {variantRows.map((variant) => (
                  <label key={variant.key}>
                    <strong>
                      {variant.name}
                    </strong>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.variantStocks[variant.key] ?? form.stock}
                      onChange={(event) => updateVariantStock(variant.key, event.target.value)}
                    />
                    <button
                      className="variant-remove-button"
                      type="button"
                      onClick={() => removeVariety(variant.name)}
                      aria-label={`Quitar ${variant.name}`}
                    >
                      x
                    </button>
                  </label>
                ))}
              </div>
            </div>
          )}

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
    </section>
  );
}

export default AdminPanel;
