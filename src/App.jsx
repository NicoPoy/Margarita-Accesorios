import React, { useEffect, useMemo, useState } from 'react';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import Header from './components/Header';
import ProductCatalog from './components/ProductCatalog';
import SiteFooter from './components/SiteFooter';
import Toolbar from './components/Toolbar';
import TopActions from './components/TopActions';
import { initialProducts } from './data/products';
import { hasSupabaseConfig, supabase } from './lib/supabase';

function App() {
  const [catalogProducts, setCatalogProducts] = useState(initialProducts);
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

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isClient = userRoles.includes('cliente');
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

  const categories = useMemo(
    () => [
      'Todos',
      ...new Set(
        catalogProducts
          .map((product) => product.category)
          .sort((a, b) => a.localeCompare(b))
      )
    ],
    [catalogProducts]
  );

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return catalogProducts.filter((product) => {
      const matchesCategory =
        activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, catalogProducts, query]);

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
  };

  const checkoutCart = () => {
    setCartMessage(
      'Pedido listo para preparar. El guardado definitivo se activara cuando el catalogo lea productos desde Supabase.'
    );
  };

  return (
    <main className="page-shell">
      <TopActions
        cartCount={cartCount}
        displayName={displayName}
        onCartOpen={() => setIsCartOpen(true)}
        onLoginOpen={() => openAuth('login')}
        onLogout={handleLogout}
        session={session}
      />

      <Header />

      <Toolbar
        activeCategory={activeCategory}
        categories={categories}
        query={query}
        onCategoryChange={setActiveCategory}
        onQueryChange={setQuery}
      />

      <ProductCatalog
        activeCategory={activeCategory}
        products={filteredProducts}
        onAddToCart={addToCart}
      />

      <SiteFooter />

      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onModeChange={setAuthMode}
          onProfileChange={setProfile}
        />
      )}

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
    </main>
  );
}

export default App;
