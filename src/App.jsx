import React, { useEffect, useMemo, useState } from 'react';
import AdminOrders from './components/AdminOrders';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import Header from './components/Header';
import PaymentBanner from './components/PaymentBanner';
import ProductCatalog from './components/ProductCatalog';
import SiteFooter from './components/SiteFooter';
import Toolbar from './components/Toolbar';
import TopActions from './components/TopActions';
import { DEFAULT_PRODUCT_IMAGE } from './data/products';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const mercadoPagoPaymentLink = import.meta.env.VITE_MERCADO_PAGO_PAYMENT_LINK;

const mapDatabaseCategory = (category) => ({
  id: category.id,
  name: category.nombre,
  active: category.activo !== false
});

const mapDatabaseProduct = (product) => ({
  id: product.id,
  name: product.nombre,
  category: product.categorias?.nombre || product.categoria,
  categoryId: product.categoria_id || product.categorias?.id || null,
  price: Number(product.precio),
  stock: Number(product.stock || 0),
  image: product.imagen_url || DEFAULT_PRODUCT_IMAGE,
  imagePath: product.imagen_path || null,
  active: product.activo !== false
});

const mapProductToDatabase = (product) => ({
  nombre: product.name.trim(),
  categoria_id: product.categoryId,
  categoria: product.categoryName.trim(),
  precio: Number(product.price),
  stock: Number(product.stock || 0),
  imagen_url: product.imageUrl || null,
  imagen_path: product.imagePath || null,
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
    quantity: Number(item.cantidad || 0),
    unitPrice: Number(item.precio_unitario || 0),
    subtotal:
      item.subtotal === null || item.subtotal === undefined
        ? Number(item.cantidad || 0) * Number(item.precio_unitario || 0)
        : Number(item.subtotal || 0),
    product: {
      name: item.productos?.nombre || 'Producto eliminado',
      category:
        item.productos?.categorias?.nombre ||
        item.productos?.categoria ||
        'Sin categoria',
      image: item.productos?.imagen_url || DEFAULT_PRODUCT_IMAGE
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

function App() {
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [query, setQuery] = useState('');
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
  const [ordersStatus, setOrdersStatus] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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
            .eq('activo', true)
            .order('nombre', { ascending: true }),
          supabase
            .from('productos')
            .select('id, nombre, categoria, categoria_id, precio, stock, imagen_url, imagen_path, activo, categorias(id, nombre)')
            .eq('activo', true)
            .order('nombre', { ascending: true })
        ]);

      if (!categoriesError) {
        setCatalogCategories((categoriesData || []).map(mapDatabaseCategory));
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

  const activeProducts = useMemo(
    () => catalogProducts.filter((product) => product.active !== false && product.stock > 0),
    [catalogProducts]
  );

  const outOfStockProducts = useMemo(
    () => catalogProducts.filter((product) => product.active !== false && product.stock <= 0),
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

    return activeProducts.filter((product) => {
      const matchesCategory =
        activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, activeProducts, query]);

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
        'id, fecha, estado, medio_pago, pago_estado, total, usuarios(nombre, whatsapp, dni), pedido_items(id, cantidad, precio_unitario, subtotal, productos(nombre, categoria, imagen_url, categorias(nombre)))'
      )
      .order('fecha', { ascending: false });

    setIsLoadingOrders(false);

    if (error) {
      setOrdersStatus(`No se pudieron cargar los pedidos: ${error.message}`);
      return;
    }

    setAdminOrders((data || []).map(mapDatabaseOrder));
  };

  useEffect(() => {
    if (isAdmin && currentView === 'orders') {
      loadAdminOrders();
    }
  }, [currentView, isAdmin]);

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

    let uploadedImage;

    try {
      uploadedImage = await uploadProductImage(product.photoFile);
    } catch (error) {
      setAdminMessage(`No se pudo subir la imagen: ${error.message}`);
      return false;
    }

    const { data, error } = await supabase
      .from('productos')
      .insert(
        mapProductToDatabase({
          ...product,
          categoryName: selectedCategory.name,
          imageUrl: uploadedImage.imageUrl,
          imagePath: uploadedImage.imagePath
        })
      )
      .select('id, nombre, categoria, categoria_id, precio, stock, imagen_url, imagen_path, activo, categorias(id, nombre)')
      .single();

    if (error) {
      setAdminMessage(`No se pudo guardar el producto: ${error.message}`);
      return false;
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

    let uploadedImage = {
      imageUrl: product.currentImageUrl || null,
      imagePath: product.currentImagePath || null
    };

    if (product.photoFile) {
      try {
        uploadedImage = await uploadProductImage(product.photoFile);
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
      p_imagen_path: uploadedImage.imagePath
    });

    if (error) {
      setAdminMessage(`No se pudo modificar el producto: ${error.message}`);
      return false;
    }

    const updatedProduct = mapDatabaseProduct(data);

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
              image: updatedProduct.image
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

  const changeProductStock = (productId, delta) => {
    setCatalogProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + delta) }
          : product
      )
    );
  };

  const addToCart = (product) => {
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

    if (product.stock <= 0) {
      setCartMessage('No hay stock disponible para este producto.');
      setIsCartOpen(true);
      return;
    }

    changeProductStock(product.id, -1);
    setCartItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.id === product.id);

      if (currentItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        }
      ];
    });
    setIsCartOpen(true);
  };

  const increaseCartItem = (productId) => {
    const product = catalogProducts.find((currentProduct) => currentProduct.id === productId);

    if (!product || product.stock <= 0) {
      setCartMessage('No hay mas stock disponible para este producto.');
      return;
    }

    changeProductStock(productId, -1);
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseCartItem = (productId) => {
    setCartMessage('');
    changeProductStock(productId, 1);
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productId) => {
    const item = cartItems.find((currentItem) => currentItem.id === productId);
    if (!item) return;

    setCartMessage('');
    changeProductStock(productId, item.quantity);
    setCartItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== productId));
  };

  const clearCart = () => {
    cartItems.forEach((item) => changeProductStock(item.id, item.quantity));
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
        cantidad: item.quantity
      }))
    });

    setIsSubmittingOrder(false);

    if (error) {
      setCheckoutMessage(`No se pudo finalizar el pedido: ${error.message}`);
      return;
    }

    setCartItems([]);
    setCheckoutMessage(`Pedido #${data?.pedido_id || ''} finalizado correctamente.`);
    setCurrentView('catalog');
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

  return (
    <main className="page-shell">
      <TopActions
        cartCount={cartCount}
        displayName={displayName}
        isAdmin={isAdmin}
        currentView={currentView}
        onAdminViewChange={openAdminView}
        onCartOpen={() => setIsCartOpen(true)}
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
            onCategoryChange={setActiveCategory}
            onQueryChange={setQuery}
          />

          {productsStatus && <p className="catalog-status">{productsStatus}</p>}
        </>
      )}

      {currentView === 'catalog' && isAdmin && (
        <AdminPanel
          categories={catalogCategories}
          editingProduct={editingProduct}
          message={adminMessage}
          outOfStockProducts={outOfStockProducts}
          onCancelEdit={() => setEditingProduct(null)}
          onCreateProduct={createProduct}
          onDeleteProduct={deleteProduct}
          onEditProduct={setEditingProduct}
          onUpdateProduct={updateProduct}
        />
      )}

      {currentView === 'orders' && isAdmin ? (
        <AdminOrders
          isLoading={isLoadingOrders}
          message={ordersStatus}
          orders={adminOrders}
          onMarkDelivered={markOrderDelivered}
          onRefresh={loadAdminOrders}
        />
      ) : currentView === 'catalog' ? (
        <ProductCatalog
          activeCategory={activeCategory}
          canAddToCart={!isAdmin}
          canManageProducts={isAdmin}
          products={filteredProducts}
          onAddToCart={addToCart}
          onDeleteProduct={deleteProduct}
          onEditProduct={setEditingProduct}
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
    </main>
  );
}

export default App;
