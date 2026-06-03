import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminCategories from './components/AdminCategories';
import AdminOrders from './components/AdminOrders';
import AdminOutOfStock from './components/AdminOutOfStock';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import ConfirmDialog from './components/ConfirmDialog';
import Header from './components/Header';
import PaymentBanner from './components/PaymentBanner';
import ProductCatalog from './components/ProductCatalog';
import SiteFooter from './components/SiteFooter';
import Toolbar from './components/Toolbar';
import TopActions from './components/TopActions';
import { DEFAULT_PRODUCT_IMAGE } from './data/products';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { downloadCsv } from './utils/csv';

const mercadoPagoPaymentLink = import.meta.env.VITE_MERCADO_PAGO_PAYMENT_LINK;
const productSelect =
  'id, nombre, categoria, categoria_id, precio, stock, imagen_url, imagenes_url, imagen_path, variedades, activo, categorias(id, nombre), producto_variantes(id, nombre, color, modelo, stock, activo)';

const defaultCategoryNames = [
  'Accesorios',
  'Anillos',
  'Aros',
  'Belleza',
  'Collares',
  'Hebillas',
  'Pulseras'
];

const mapDatabaseCategory = (category) => ({
  id: category.id,
  name: category.nombre,
  active: category.activo !== false
});

const mapDatabaseVariant = (variant) => ({
  id: variant.id,
  name: variant.nombre || [variant.color, variant.modelo].filter(Boolean).join(' ') || '',
  stock: Number(variant.stock || 0),
  active: variant.activo !== false
});

const mapDatabaseProduct = (product) => {
  const variants = (product.producto_variantes || [])
    .map(mapDatabaseVariant)
    .filter((variant) => variant.active);
  const variantStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const generalStock = Number(product.stock || 0);
  const varietiesFromVariants = [
    ...new Set(variants.map((variant) => variant.name).filter(Boolean))
  ];

  return {
    id: product.id,
    name: product.nombre,
    category: product.categorias?.nombre || product.categoria,
    categoryId: product.categoria_id || product.categorias?.id || null,
    price: Number(product.precio),
    stock: generalStock,
    availableStock: variants.length ? variantStock : generalStock,
    image: product.imagen_url || DEFAULT_PRODUCT_IMAGE,
    images: product.imagenes_url?.length
      ? product.imagenes_url
      : [product.imagen_url || DEFAULT_PRODUCT_IMAGE],
    imagePath: product.imagen_path || null,
    varieties: varietiesFromVariants.length ? varietiesFromVariants : product.variedades || [],
    variants,
    active: product.activo !== false
  };
};

const mapProductToDatabase = (product) => ({
  nombre: product.name.trim(),
  categoria_id: product.categoryId,
  categoria: product.categoryName.trim(),
  precio: Number(product.price),
  stock: Number(product.stock || 0),
  imagen_url: product.imageUrl || null,
  imagenes_url: product.imageUrls?.length ? product.imageUrls : null,
  imagen_path: product.imagePath || null,
  variedades: product.varieties || [],
  activo: true
});

const mapDatabaseOrder = (order) => ({
  id: order.id,
  date: order.fecha,
  status: order.estado,
  paymentMethod: order.medio_pago,
  paymentStatus: order.pago_estado,
  total: Number(order.total || 0),
  customer: {
    name: order.usuarios?.nombre || 'Cliente sin nombre',
    whatsapp: order.usuarios?.whatsapp || '',
    dni: order.usuarios?.dni || ''
  },
  items: (order.pedido_items || []).map((item) => ({
    id: item.id,
    productId: item.producto_id,
    variantId: item.variante_id,
    quantity: Number(item.cantidad || 0),
    unitPrice: Number(item.precio_unitario || 0),
    subtotal:
      item.subtotal === null || item.subtotal === undefined
        ? Number(item.cantidad || 0) * Number(item.precio_unitario || 0)
        : Number(item.subtotal || 0),
    variety: item.variedad || item.modelo || item.color || '',
    product: {
      name: item.producto_nombre || item.productos?.nombre || 'Producto eliminado',
      category:
        item.producto_categoria ||
        item.productos?.categorias?.nombre ||
        item.productos?.categoria ||
        'Sin categoria',
      image: item.producto_imagen_url || item.productos?.imagen_url || DEFAULT_PRODUCT_IMAGE
    }
  }))
});

const sanitizeFileName = (fileName) =>
  fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const normalizeOptions = (value) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildVariantPayload = ({ varieties, stock, variants = [] }) => {
  if (variants.length) {
    return variants.map((variant) => ({
      nombre: variant.name || variant.nombre || null,
      stock: Math.max(0, Number(variant.stock || 0))
    }));
  }

  if (!varieties.length) return [];

  const defaultStock = Math.max(0, Number(stock || 0));

  return varieties.map((variety) => ({
    nombre: variety,
    stock: 0
  }));
};

const getVariantStockTotal = (variants) =>
  variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock || 0)), 0);

const getSelectedVariant = (product, variety) => {
  if (!product.variants?.length) return null;

  return product.variants.find((variant) => variant.name === variety);
};

function App() {
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [authMode, setAuthMode] = useState('login');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [currentView, setCurrentView] = useState('catalog');
  const [productsStatus, setProductsStatus] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolver = useRef(null);

  const requestConfirm = ({ confirmLabel, isDanger = false, message, title }) =>
    new Promise((resolve) => {
      confirmResolver.current = resolve;
      setConfirmDialog({
        confirmLabel,
        isDanger,
        message,
        title
      });
    });

  const closeConfirmDialog = (result) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setConfirmDialog(null);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isClient = userRoles.includes('cliente');
  const isAdmin = userRoles.includes('admin');
  const displayName =
    profile?.nombre || session?.user?.user_metadata?.nombre || 'usuario';

  useEffect(() => {
    if (!hasSupabaseConfig) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!hasSupabaseConfig || !session?.user?.id) {
        setProfile(null);
        setUserRoles([]);
        return;
      }

      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre, whatsapp, dni, activo')
        .eq('id', session.user.id)
        .maybeSingle();

      setProfile(data);

      const { data: rolesData } = await supabase
        .from('usuario_roles')
        .select('roles(nombre)')
        .eq('usuario_id', session.user.id)
        .eq('activo', true);

      setUserRoles(
        rolesData?.map((item) => item.roles?.nombre).filter(Boolean) || []
      );
    };

    loadProfile();
  }, [session]);

  useEffect(() => {
    const loadCatalogData = async () => {
      if (!hasSupabaseConfig) {
        setProductsStatus('Falta configurar Supabase para cargar productos.');
        return;
      }

      const [{ data: categoriesData, error: categoriesError }, { data, error }] =
        await Promise.all([
          supabase
            .from('categorias')
            .select('id, nombre, activo')
            .order('nombre', { ascending: true }),
          supabase
            .from('productos')
            .select(productSelect)
            .eq('activo', true)
            .order('nombre', { ascending: true })
        ]);

      if (!categoriesError) {
        setCatalogCategories((categoriesData || []).map(mapDatabaseCategory));
      } else {
        setProductsStatus(
          `No se pudieron cargar las categorias desde Supabase: ${categoriesError.message}`
        );
      }

      if (error) {
        setProductsStatus(
          'No se pudieron cargar los productos desde Supabase.'
        );
        return;
      }

      setCatalogProducts((data || []).map(mapDatabaseProduct));
      setProductsStatus('');
    };

    loadCatalogData();
  }, []);

  useEffect(() => {
    const seedDefaultCategories = async () => {
      if (!hasSupabaseConfig || !isAdmin || catalogCategories.length > 0) return;

      const { data: existingCategories, error: readError } = await supabase
        .from('categorias')
        .select('id')
        .limit(1);

      if (readError || existingCategories?.length) return;

      const { data, error } = await supabase
        .from('categorias')
        .upsert(
          defaultCategoryNames.map((name) => ({ nombre: name, activo: true })),
          { onConflict: 'nombre' }
        )
        .select('id, nombre, activo')
        .order('nombre', { ascending: true });

      if (error) {
        setProductsStatus(
          `No se pudieron crear las categorias base: ${error.message}`
        );
        return;
      }

      setCatalogCategories((data || []).map(mapDatabaseCategory));
      setProductsStatus('');
    };

    seedDefaultCategories();
  }, [catalogCategories.length, isAdmin]);

  const activeProducts = useMemo(
    () =>
      catalogProducts.filter(
        (product) => product.active !== false && (product.availableStock ?? product.stock) > 0
      ),
    [catalogProducts]
  );

  const outOfStockProducts = useMemo(
    () =>
      catalogProducts.filter(
        (product) => product.active !== false && (product.availableStock ?? product.stock) <= 0
      ),
    [catalogProducts]
  );

  const categories = useMemo(
    () => [
      'Todos',
      ...catalogCategories
        .filter((category) => category.active !== false)
        .map((category) => category.name)
        .sort((a, b) => a.localeCompare(b))
    ],
    [catalogCategories]
  );

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    const products = activeProducts.filter((product) => {
      const matchesCategory =
        activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });

    return [...products].sort((a, b) => {
      if (sortOrder === 'price-asc') return a.price - b.price;
      if (sortOrder === 'price-desc') return b.price - a.price;
      if (sortOrder === 'stock-desc') {
        return (b.availableStock ?? b.stock) - (a.availableStock ?? a.stock);
      }

      return a.name.localeCompare(b.name);
    });
  }, [activeCategory, activeProducts, query, sortOrder]);

  const loadAdminOrders = async () => {
    setOrdersStatus('');

    if (!hasSupabaseConfig) {
      setOrdersStatus('Falta configurar Supabase para cargar pedidos.');
      return;
    }

    setIsLoadingOrders(true);

    const { data, error } = await supabase
      .from('pedidos')
      .select(
        'id, fecha, estado, medio_pago, pago_estado, total, usuarios(nombre, whatsapp, dni), pedido_items(id, producto_id, variante_id, cantidad, precio_unitario, subtotal, variedad, color, modelo, producto_nombre, producto_categoria, producto_imagen_url, productos(nombre, categoria, imagen_url, categorias(nombre)))'
      )
      .order('fecha', { ascending: false });

    setIsLoadingOrders(false);

    if (error) {
      setOrdersStatus(`No se pudieron cargar los pedidos: ${error.message}`);
      return;
    }

    setAdminOrders((data || []).map(mapDatabaseOrder));
  };

  const loadUserOrders = async () => {
    setOrdersStatus('');

    if (!hasSupabaseConfig || !session?.user?.id) {
      setOrdersStatus('Tenes que iniciar sesion para ver tus pedidos.');
      return;
    }

    setIsLoadingOrders(true);

    const { data, error } = await supabase
      .from('pedidos')
      .select(
        'id, fecha, estado, medio_pago, pago_estado, total, usuarios(nombre, whatsapp, dni), pedido_items(id, producto_id, variante_id, cantidad, precio_unitario, subtotal, variedad, color, modelo, producto_nombre, producto_categoria, producto_imagen_url, productos(nombre, categoria, imagen_url, categorias(nombre)))'
      )
      .eq('usuario_id', session.user.id)
      .order('fecha', { ascending: false });

    setIsLoadingOrders(false);

    if (error) {
      setOrdersStatus(`No se pudieron cargar tus pedidos: ${error.message}`);
      return;
    }

    setUserOrders((data || []).map(mapDatabaseOrder));
  };

  useEffect(() => {
    if (isAdmin && currentView === 'orders') {
      loadAdminOrders();
    }
  }, [currentView, isAdmin]);

  useEffect(() => {
    if (!isAdmin && isClient && currentView === 'my-orders') {
      loadUserOrders();
    }
  }, [currentView, isAdmin, isClient, session?.user?.id]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setProfile(null);
    setUserRoles([]);
    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('catalog');
  };

  const openAdminView = (view) => {
    setCurrentView(view);
    setEditingProduct(null);
    setCheckoutMessage('');
    setOrdersStatus('');
    setAdminMessage('');
  };

  const openClientView = (view) => {
    setCurrentView(view);
    setCheckoutMessage('');
    setOrdersStatus('');
  };

  const uploadProductImage = async (file) => {
    if (!file) {
      return { imageUrl: null, imagePath: null };
    }

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'producto';
    const imagePath = `productos/${crypto.randomUUID()}-${safeName}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(imagePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagePath);

    return {
      imageUrl: data.publicUrl,
      imagePath
    };
  };

  const uploadProductImages = async (files) => {
    const fileList = Array.from(files || []).filter(Boolean);

    if (fileList.length === 0) {
      return { imageUrl: null, imageUrls: [], imagePath: null };
    }

    const uploadedImages = [];

    for (const file of fileList) {
      uploadedImages.push(await uploadProductImage(file));
    }

    return {
      imageUrl: uploadedImages[0]?.imageUrl || null,
      imageUrls: uploadedImages.map((image) => image.imageUrl).filter(Boolean),
      imagePath: uploadedImages[0]?.imagePath || null
    };
  };

  const createProduct = async (product) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para guardar productos.');
      return false;
    }

    const selectedCategory = catalogCategories.find(
      (category) => String(category.id) === String(product.categoryId)
    );

    if (!selectedCategory) {
      setAdminMessage('Selecciona una categoria valida desde la base de datos.');
      return false;
    }

    const varieties = normalizeOptions(product.varietiesText || '');
    const variants = buildVariantPayload({
      varieties,
      stock: product.stock,
      variants: product.variants
    });
    const variantStockTotal = getVariantStockTotal(variants);

    if (variantStockTotal > Number(product.stock || 0)) {
      setAdminMessage('La suma del stock de las variedades no puede superar el stock general.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Cargar producto',
      message: `Se va a cargar "${product.name}" en el catalogo.`,
      title: 'Confirmar producto'
    });

    if (!confirmed) {
      return false;
    }

    let uploadedImage;

    try {
      uploadedImage = await uploadProductImages(product.photoFiles);
    } catch (error) {
      setAdminMessage(`No se pudo subir la imagen: ${error.message}`);
      return false;
    }

    const { data: insertedProduct, error } = await supabase
      .from('productos')
      .insert(
        mapProductToDatabase({
          ...product,
          categoryName: selectedCategory.name,
          imageUrl: uploadedImage.imageUrl,
          imageUrls: uploadedImage.imageUrls,
          imagePath: uploadedImage.imagePath,
          varieties,
          stock: product.stock
        })
      )
      .select(productSelect)
      .single();

    if (error) {
      setAdminMessage(`No se pudo guardar el producto: ${error.message}`);
      return false;
    }

    let data = insertedProduct;

    if (variants.length) {
      const { error: variantsError } = await supabase
        .from('producto_variantes')
        .insert(
          variants.map((variant) => ({
            producto_id: insertedProduct.id,
            nombre: variant.nombre,
            stock: variant.stock,
            activo: true
          }))
        );

      if (variantsError) {
        await supabase.rpc('eliminar_producto_admin', {
          p_producto_id: insertedProduct.id
        });
        setAdminMessage(`No se pudo guardar el producto: ${variantsError.message}`);
        return false;
      }

      const { data: productWithVariants } = await supabase
        .from('productos')
        .select(productSelect)
        .eq('id', insertedProduct.id)
        .single();

      data = productWithVariants || insertedProduct;
    }

    setCatalogProducts((currentProducts) =>
      [...currentProducts, mapDatabaseProduct(data)].sort((a, b) =>
        `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`)
      )
    );
    setAdminMessage('Producto guardado en Supabase.');
    return true;
  };

  const updateProduct = async (product) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para modificar productos.');
      return false;
    }

    const selectedCategory = catalogCategories.find(
      (category) => String(category.id) === String(product.categoryId)
    );

    if (!selectedCategory) {
      setAdminMessage('Selecciona una categoria valida desde la base de datos.');
      return false;
    }

    const varieties = normalizeOptions(product.varietiesText || '');
    const variants = buildVariantPayload({
      varieties,
      stock: product.stock,
      variants: product.variants
    });
    const variantStockTotal = getVariantStockTotal(variants);

    if (variantStockTotal > Number(product.stock || 0)) {
      setAdminMessage('La suma del stock de las variedades no puede superar el stock general.');
      return false;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Guardar cambios',
      message: `Se van a guardar los cambios de "${product.name}".`,
      title: 'Confirmar edicion'
    });

    if (!confirmed) {
      return false;
    }

    let uploadedImage = {
      imageUrl: product.currentImageUrl || null,
      imageUrls: product.currentImageUrls || [],
      imagePath: product.currentImageUrl ? product.currentImagePath || null : null
    };

    if (product.photoFiles?.length) {
      try {
        const newUploadedImages = await uploadProductImages(product.photoFiles);
        const imageUrls = [
          ...(product.currentImageUrls || []),
          ...newUploadedImages.imageUrls
        ].filter(Boolean);

        uploadedImage = {
          imageUrl: imageUrls[0] || newUploadedImages.imageUrl,
          imageUrls,
          imagePath: product.currentImageUrl
            ? product.currentImagePath || null
            : newUploadedImages.imagePath
        };
      } catch (error) {
        setAdminMessage(`No se pudo subir la imagen: ${error.message}`);
        return false;
      }
    }

    const { data, error } = await supabase.rpc('actualizar_producto_admin', {
      p_producto_id: product.id,
      p_nombre: product.name.trim(),
      p_categoria_id: Number(product.categoryId),
      p_categoria: selectedCategory.name,
      p_precio: Number(product.price),
      p_stock: Number(product.stock || 0),
      p_imagen_url: uploadedImage.imageUrl,
      p_imagenes_url: uploadedImage.imageUrls,
      p_imagen_path: uploadedImage.imagePath,
      p_variedades: varieties,
      p_variantes: variants
    });

    if (error) {
      setAdminMessage(`No se pudo modificar el producto: ${error.message}`);
      return false;
    }

    const { data: refreshedProduct } = await supabase
      .from('productos')
      .select(productSelect)
      .eq('id', data.id)
      .single();

    const updatedProduct = mapDatabaseProduct(refreshedProduct || data);

    setCatalogProducts((currentProducts) =>
      currentProducts
        .map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct
        )
        .sort((a, b) =>
          `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`)
        )
    );
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === updatedProduct.id
          ? {
              ...item,
              name: updatedProduct.name,
              price: updatedProduct.price,
              image: updatedProduct.image,
              images: updatedProduct.images
            }
          : item
      )
    );
    setEditingProduct(null);
    setAdminMessage('Producto modificado en Supabase.');
    return true;
  };

  const deleteProduct = async (product) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para eliminar productos.');
      return;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Eliminar producto',
      isDanger: true,
      message: `"${product.name}" se va a quitar del catalogo. Los pedidos existentes conservan su historial.`,
      title: 'Eliminar producto'
    });

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.rpc('eliminar_producto_admin', {
      p_producto_id: product.id
    });

    if (error) {
      setAdminMessage(`No se pudo eliminar el producto: ${error.message}`);
      return;
    }

    setCatalogProducts((currentProducts) =>
      currentProducts.filter((currentProduct) => currentProduct.id !== product.id)
    );
    setCartItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== product.id)
    );
    setEditingProduct((currentProduct) =>
      currentProduct?.id === product.id ? null : currentProduct
    );
    setAdminMessage('Producto eliminado del catalogo.');
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setCurrentView('catalog');
  };

  const productCountsByCategory = useMemo(
    () =>
      catalogProducts.reduce((counts, product) => {
        if (!product.categoryId) return counts;

        return {
          ...counts,
          [product.categoryId]: (counts[product.categoryId] || 0) + 1
        };
      }, {}),
    [catalogProducts]
  );

  const createCategory = async (name) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para guardar categorias.');
      return false;
    }

    const cleanName = name.trim();

    const confirmed = await requestConfirm({
      confirmLabel: 'Crear categoria',
      message: `Se va a crear la categoria "${cleanName}".`,
      title: 'Confirmar categoria'
    });

    if (!confirmed) {
      return false;
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre: cleanName, activo: true })
      .select('id, nombre, activo')
      .single();

    if (error) {
      setAdminMessage(`No se pudo crear la categoria: ${error.message}`);
      return false;
    }

    setCatalogCategories((currentCategories) =>
      [...currentCategories, mapDatabaseCategory(data)].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setAdminMessage('Categoria creada correctamente.');
    return true;
  };

  const renameCategory = async (category, name) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para modificar categorias.');
      return false;
    }

    const cleanName = name.trim();

    if (cleanName === category.name) {
      return true;
    }

    const confirmed = await requestConfirm({
      confirmLabel: 'Guardar nombre',
      message: `La categoria "${category.name}" va a pasar a llamarse "${cleanName}".`,
      title: 'Renombrar categoria'
    });

    if (!confirmed) {
      return false;
    }

    const { data, error } = await supabase
      .from('categorias')
      .update({ nombre: cleanName })
      .eq('id', category.id)
      .select('id, nombre, activo')
      .single();

    if (error) {
      setAdminMessage(`No se pudo modificar la categoria: ${error.message}`);
      return false;
    }

    await supabase
      .from('productos')
      .update({ categoria: cleanName })
      .eq('categoria_id', category.id);

    const updatedCategory = mapDatabaseCategory(data);

    setCatalogCategories((currentCategories) =>
      currentCategories
        .map((currentCategory) =>
          currentCategory.id === updatedCategory.id ? updatedCategory : currentCategory
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    setCatalogProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.categoryId === category.id ? { ...product, category: cleanName } : product
      )
    );

    if (activeCategory === category.name) {
      setActiveCategory(cleanName);
    }

    setAdminMessage('Categoria modificada correctamente.');
    return true;
  };

  const toggleCategory = async (category) => {
    setAdminMessage('');

    if (!hasSupabaseConfig) {
      setAdminMessage('Falta configurar Supabase para modificar categorias.');
      return;
    }

    const nextActive = !category.active;
    const actionLabel = nextActive ? 'activar' : 'desactivar';

    const confirmed = await requestConfirm({
      confirmLabel: nextActive ? 'Activar' : 'Desactivar',
      isDanger: !nextActive,
      message: `Se va a ${actionLabel} la categoria "${category.name}".`,
      title: `${nextActive ? 'Activar' : 'Desactivar'} categoria`
    });

    if (!confirmed) {
      return;
    }

    const { data, error } = await supabase
      .from('categorias')
      .update({ activo: nextActive })
      .eq('id', category.id)
      .select('id, nombre, activo')
      .single();

    if (error) {
      setAdminMessage(`No se pudo modificar la categoria: ${error.message}`);
      return;
    }

    const updatedCategory = mapDatabaseCategory(data);

    setCatalogCategories((currentCategories) =>
      currentCategories
        .map((currentCategory) =>
          currentCategory.id === updatedCategory.id ? updatedCategory : currentCategory
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    if (!nextActive && activeCategory === category.name) {
      setActiveCategory('Todos');
    }

    setAdminMessage(
      nextActive ? 'Categoria activada correctamente.' : 'Categoria desactivada correctamente.'
    );
  };

  const changeProductStock = (productId, delta, variantId = null) => {
    setCatalogProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              stock: Math.max(0, product.stock + delta),
              availableStock: Math.max(0, (product.availableStock ?? product.stock) + delta),
              variants: variantId
                ? product.variants.map((variant) =>
                    variant.id === variantId
                      ? { ...variant, stock: Math.max(0, variant.stock + delta) }
                      : variant
                  )
                : product.variants
            }
          : product
      )
    );
  };

  const addToCart = (product, options = {}) => {
    setCartMessage('');

    if (isAdmin) {
      return;
    }

    if (!session) {
      openAuth('login');
      return;
    }

    if (!isClient) {
      setCartMessage('Tu cuenta no tiene rol cliente para comprar.');
      setIsCartOpen(true);
      return;
    }

    const variety = options.variety || '';
    const selectedVariant = getSelectedVariant(product, variety);
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

    if (availableStock <= 0) {
      setCartMessage('No hay stock disponible para este producto.');
      setIsCartOpen(true);
      return;
    }

    changeProductStock(product.id, -1, selectedVariant?.id || null);
    const variantKey = `${product.id}-${selectedVariant?.id || variety || 'sin-variedad'}`;

    setCartItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.variantKey === variantKey);

      if (currentItem) {
        return currentItems.map((item) =>
          item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentItems,
        {
          id: product.id,
          variantId: selectedVariant?.id || null,
          variantKey,
          name: product.name,
          price: product.price,
          image: product.image,
          variety,
          quantity: 1
        }
      ];
    });
    setIsCartOpen(true);
  };

  const increaseCartItem = (variantKey) => {
    const item = cartItems.find((currentItem) => currentItem.variantKey === variantKey);
    const product = catalogProducts.find((currentProduct) => currentProduct.id === item?.id);
    const selectedVariant = item?.variantId
      ? product?.variants.find((variant) => variant.id === item.variantId)
      : null;
    const availableStock = selectedVariant ? selectedVariant.stock : product?.stock;

    if (!product || availableStock <= 0) {
      setCartMessage('No hay mas stock disponible para este producto.');
      return;
    }

    changeProductStock(product.id, -1, item.variantId);
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.variantKey === variantKey ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseCartItem = (variantKey) => {
    setCartMessage('');
    const itemToDecrease = cartItems.find((item) => item.variantKey === variantKey);
    if (itemToDecrease) {
      changeProductStock(itemToDecrease.id, 1, itemToDecrease.variantId);
    }
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.variantKey === variantKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (variantKey) => {
    const item = cartItems.find((currentItem) => currentItem.variantKey === variantKey);
    if (!item) return;

    setCartMessage('');
    changeProductStock(item.id, item.quantity, item.variantId);
    setCartItems((currentItems) => currentItems.filter((currentItem) => currentItem.variantKey !== variantKey));
  };

  const clearCart = () => {
    cartItems.forEach((item) => changeProductStock(item.id, item.quantity, item.variantId));
    setCartItems([]);
    setCartMessage('');
    setCheckoutMessage('');
  };

  const checkoutCart = () => {
    if (cartItems.length === 0) return;

    setIsCartOpen(false);
    setCheckoutMessage('');
    setCurrentView('checkout');
  };

  const finishOrder = async (paymentMethod) => {
    setCheckoutMessage('');

    if (paymentMethod === 'mercado_pago') {
      if (!mercadoPagoPaymentLink) {
        setCheckoutMessage(
          'Falta configurar el link de Mercado Pago. Agrega VITE_MERCADO_PAGO_PAYMENT_LINK en .env.local.'
        );
        return;
      }

      window.location.href = mercadoPagoPaymentLink;
      return;
    }

    if (!hasSupabaseConfig || !session?.user?.id) {
      setCheckoutMessage('Para finalizar el pedido tenes que iniciar sesion.');
      return;
    }

    setIsSubmittingOrder(true);

    const { data, error } = await supabase.rpc('crear_pedido_con_items', {
      p_medio_pago: paymentMethod,
      p_items: cartItems.map((item) => ({
        producto_id: item.id,
        variante_id: item.variantId,
        cantidad: item.quantity,
        variedad: item.variety || null
      }))
    });

    setIsSubmittingOrder(false);

    if (error) {
      setCheckoutMessage(`No se pudo finalizar el pedido: ${error.message}`);
      return;
    }

    setCartItems([]);
    setCheckoutMessage(`Pedido #${data?.pedido_id || ''} finalizado correctamente.`);
    setCurrentView('my-orders');
  };

  const markOrderDelivered = async (orderId) => {
    setOrdersStatus('');

    if (!hasSupabaseConfig) {
      setOrdersStatus('Falta configurar Supabase para actualizar pedidos.');
      return;
    }

    const { data, error } = await supabase.rpc('marcar_pedido_entregado_admin', {
      p_pedido_id: orderId
    });

    if (error) {
      setOrdersStatus(`No se pudo marcar como entregado: ${error.message}`);
      return;
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: data?.estado || 'entregado',
              paymentStatus: data?.pago_estado || order.paymentStatus
            }
          : order
      )
    );
  };

  const confirmOrderPaymentReceived = async (orderId) => {
    setOrdersStatus('');

    if (!hasSupabaseConfig) {
      setOrdersStatus('Falta configurar Supabase para actualizar pedidos.');
      return;
    }

    const { data, error } = await supabase.rpc('confirmar_comprobante_admin', {
      p_pedido_id: orderId
    });

    if (error) {
      setOrdersStatus(`No se pudo confirmar el comprobante: ${error.message}`);
      return;
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: data?.pago_estado || 'comprobante_recibido'
            }
          : order
      )
    );
  };

  const cancelOrder = async (orderId) => {
    setOrdersStatus('');

    if (!hasSupabaseConfig) {
      setOrdersStatus('Falta configurar Supabase para cancelar pedidos.');
      return;
    }

    const orderToCancel = adminOrders.find((order) => order.id === orderId);

    const confirmed = await requestConfirm({
      confirmLabel: 'Cancelar pedido',
      isDanger: true,
      message: `El pedido #${orderId} se va a cancelar y se devolvera el stock.`,
      title: 'Cancelar pedido'
    });

    if (!confirmed) {
      return;
    }

    const { data, error } = await supabase.rpc('cancelar_pedido_admin', {
      p_pedido_id: orderId
    });

    if (error) {
      setOrdersStatus(`No se pudo cancelar el pedido: ${error.message}`);
      return;
    }

    setAdminOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: data?.estado || 'cancelado',
              paymentStatus: data?.pago_estado || order.paymentStatus
            }
          : order
      )
    );

    if (orderToCancel) {
      setCatalogProducts((currentProducts) =>
        currentProducts.map((product) => {
          const restoredItems = orderToCancel.items.filter(
            (item) => item.productId === product.id
          );

          if (!restoredItems.length) return product;

          const restoredStock = restoredItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return {
            ...product,
            stock: product.stock + restoredStock,
            availableStock: (product.availableStock ?? product.stock) + restoredStock,
            variants: product.variants.map((variant) => {
              const restoredVariantStock = restoredItems
                .filter((item) => item.variantId === variant.id)
                .reduce((sum, item) => sum + item.quantity, 0);

              return restoredVariantStock
                ? { ...variant, stock: variant.stock + restoredVariantStock }
                : variant;
            })
          };
        })
      );
    }

    setOrdersStatus(`Pedido #${orderId} cancelado. Stock devuelto correctamente.`);
  };

  const exportProductsCsv = () => {
    if (!catalogProducts.length) {
      setAdminMessage('No hay productos para exportar.');
      return;
    }

    const rows = catalogProducts.map((product) => ({
      id: product.id,
      nombre: product.name,
      categoria: product.category,
      precio: product.price,
      stock_general: product.stock,
      stock_disponible: product.availableStock ?? product.stock,
      variedades: product.variants?.length
        ? product.variants.map((variant) => `${variant.name}: ${variant.stock}`).join(' | ')
        : '',
      fotos: product.images?.filter((image) => image !== DEFAULT_PRODUCT_IMAGE).join(' | ') || '',
      activo: product.active ? 'si' : 'no'
    }));

    downloadCsv(`productos-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setAdminMessage('Productos exportados en CSV.');
  };

  const exportOrdersCsv = () => {
    if (!adminOrders.length) {
      setOrdersStatus('No hay pedidos para exportar.');
      return;
    }

    const rows = adminOrders.flatMap((order) =>
      order.items.map((item) => ({
        pedido_id: order.id,
        fecha: order.date,
        estado: order.status,
        medio_pago: order.paymentMethod,
        pago_estado: order.paymentStatus,
        cliente: order.customer.name,
        whatsapp: order.customer.whatsapp,
        dni: order.customer.dni,
        producto: item.product.name,
        categoria: item.product.category,
        variedad: item.variety,
        cantidad: item.quantity,
        precio_unitario: item.unitPrice,
        subtotal: item.subtotal,
        total_pedido: order.total
      }))
    );

    downloadCsv(`pedidos-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setOrdersStatus('Pedidos exportados en CSV.');
  };

  return (
    <main className="page-shell">
      <TopActions
        cartCount={cartCount}
        displayName={displayName}
        isAdmin={isAdmin}
        isClient={isClient}
        currentView={currentView}
        onAdminViewChange={openAdminView}
        onCartOpen={() => setIsCartOpen(true)}
        onClientViewChange={openClientView}
        onLoginOpen={() => openAuth('login')}
        onLogout={handleLogout}
        session={session}
      />

      <Header />

      {currentView === 'catalog' && (
        <>
          <Toolbar
            activeCategory={activeCategory}
            categories={categories}
            query={query}
            sortOrder={sortOrder}
            onCategoryChange={setActiveCategory}
            onQueryChange={setQuery}
            onSortOrderChange={setSortOrder}
          />

          {productsStatus && <p className="catalog-status">{productsStatus}</p>}
        </>
      )}

      {currentView === 'catalog' && isAdmin && (
        <AdminPanel
          categories={catalogCategories}
          editingProduct={editingProduct}
          message={adminMessage}
          onCancelEdit={() => setEditingProduct(null)}
          onCreateProduct={createProduct}
          onExportProducts={exportProductsCsv}
          onUpdateProduct={updateProduct}
        />
      )}

      {currentView === 'out-of-stock' && isAdmin && (
        <AdminOutOfStock
          products={outOfStockProducts}
          onDeleteProduct={deleteProduct}
          onEditProduct={editProduct}
        />
      )}

      {currentView === 'categories' && isAdmin && (
        <AdminCategories
          categories={catalogCategories}
          message={adminMessage}
          productCounts={productCountsByCategory}
          onCreateCategory={createCategory}
          onRenameCategory={renameCategory}
          onToggleCategory={toggleCategory}
        />
      )}

      {currentView === 'orders' && isAdmin ? (
        <AdminOrders
          isLoading={isLoadingOrders}
          message={ordersStatus}
          orders={adminOrders}
          onCancelOrder={cancelOrder}
          onExportOrders={exportOrdersCsv}
          onMarkDelivered={markOrderDelivered}
          onPaymentReceived={confirmOrderPaymentReceived}
          onRefresh={loadAdminOrders}
        />
      ) : currentView === 'my-orders' && !isAdmin ? (
        <AdminOrders
          badge="Historial"
          emptyText="Todavia no realizaste pedidos."
          isLoading={isLoadingOrders}
          message={ordersStatus}
          orders={userOrders}
          showCustomer={false}
          title="Mis pedidos"
          onRefresh={loadUserOrders}
        />
      ) : currentView === 'catalog' ? (
        <ProductCatalog
          activeCategory={activeCategory}
          canAddToCart={!isAdmin}
          canManageProducts={isAdmin}
          products={filteredProducts}
          onAddToCart={addToCart}
          onDeleteProduct={deleteProduct}
          onEditProduct={editProduct}
        />
      ) : (
        <CheckoutView
          cartItems={cartItems}
          checkoutMessage={checkoutMessage}
          isSubmitting={isSubmittingOrder}
          onBack={() => setCurrentView('catalog')}
          onFinishOrder={finishOrder}
        />
      )}

      {!isAdmin && currentView === 'catalog' && <PaymentBanner />}

      <SiteFooter />

      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onModeChange={setAuthMode}
          onProfileChange={setProfile}
        />
      )}

      {!isAdmin && (
        <CartDrawer
          cartItems={cartItems}
          cartMessage={cartMessage}
          isClient={isClient}
          isOpen={isCartOpen}
          onCheckout={checkoutCart}
          onClose={() => setIsCartOpen(false)}
          onDecrease={decreaseCartItem}
          onIncrease={increaseCartItem}
          onRemove={removeCartItem}
          onClear={clearCart}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          confirmLabel={confirmDialog.confirmLabel}
          isDanger={confirmDialog.isDanger}
          message={confirmDialog.message}
          title={confirmDialog.title}
          onCancel={() => closeConfirmDialog(false)}
          onConfirm={() => closeConfirmDialog(true)}
        />
      )}
    </main>
  );
}

export default App;
