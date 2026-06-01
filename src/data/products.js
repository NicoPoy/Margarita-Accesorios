export const DEFAULT_PRODUCT_IMAGE = '/product-placeholder.svg';

export const baseProducts = [
  { id: 1, name: 'Aros pelotita cocida chiquitos', category: 'Aros', price: 1500 },
  { id: 2, name: 'Aros especiales florecitas', category: 'Aros', price: 2500 },
  { id: 3, name: 'Pulsera dorada', category: 'Pulseras', price: 2000 },
  { id: 4, name: 'Hebillas japonesas', category: 'Hebillas', price: 4500 },
  { id: 5, name: 'Set de resaltadores x6', category: 'Accesorios', price: 3000 },
  { id: 6, name: 'Aro oso', category: 'Aros', price: 2000 },
  { id: 7, name: 'Aros motivo agujas', category: 'Aros', price: 2800 },
  { id: 8, name: 'Aros corongi', category: 'Aros', price: 2900 },
  { id: 9, name: 'Aros flor dorada', category: 'Aros', price: 2800 },
  { id: 10, name: 'Colitas de terciopelo', category: 'Accesorios', price: 800 },
  { id: 11, name: 'Pinzita de depilar', category: 'Belleza', price: 1000 },
  { id: 12, name: 'Colitas chicas x2', category: 'Accesorios', price: 800 },
  { id: 13, name: 'Bijou', category: 'Accesorios', price: 1800 },
  { id: 14, name: 'Hebillitas sapito', category: 'Hebillas', price: 1000 },
  { id: 15, name: 'Anillo corona', category: 'Anillos', price: 2500 },
  { id: 16, name: 'Anillo piedras', category: 'Anillos', price: 3000 },
  { id: 17, name: 'Anillo cruz rosa', category: 'Anillos', price: 1800 },
  { id: 18, name: 'Anillo rayado negro', category: 'Anillos', price: 2000 },
  { id: 19, name: 'Anillo cinta lisa', category: 'Anillos', price: 1800 },
  { id: 20, name: 'Anillo con brillos', category: 'Anillos', price: 2500 },
  { id: 21, name: 'Anillo dibujo chino', category: 'Anillos', price: 2200 },
  { id: 22, name: 'Aro colgante mariposa', category: 'Aros', price: 1800 },
  { id: 23, name: 'Aro colgante cuadrado', category: 'Aros', price: 2000 },
  { id: 24, name: 'Aro colgante corazon', category: 'Aros', price: 2000 },
  { id: 25, name: 'Aro colgante con bolitas chicas', category: 'Aros', price: 2200 },
  { id: 26, name: 'Aro colgante con bolitas grandes', category: 'Aros', price: 2800 },
  { id: 27, name: 'Aro colgante dorado', category: 'Aros', price: 2000 },
  { id: 28, name: 'Aros de perla chicos', category: 'Aros', price: 1000 },
  { id: 29, name: 'Aros de perla medianos', category: 'Aros', price: 1500 },
  { id: 30, name: 'Aros de perla grandes', category: 'Aros', price: 2000 }
];

export const initialProducts = baseProducts.map((product) => ({
  ...product,
  image: product.image || DEFAULT_PRODUCT_IMAGE,
  stock: 1
}));
