export const WHATSAPP_NUMBER = '+54 9 2226 60-6589';
export const WHATSAPP_WA_NUMBER = '5492226606589';

const BUENOS_AIRES_AREA_PREFIXES = [
  '11',
  '220',
  '221',
  '2221',
  '2223',
  '2224',
  '2225',
  '2226',
  '2227',
  '2241',
  '2242',
  '2243',
  '2244',
  '2245',
  '2246',
  '2252',
  '2254',
  '2255',
  '2257',
  '2261',
  '2262',
  '2264',
  '2265',
  '2266',
  '2267',
  '2268',
  '2271',
  '2272',
  '2273',
  '2274',
  '2281',
  '2283',
  '2284',
  '2285',
  '2286',
  '2291',
  '2292',
  '2296',
  '2297',
  '2302',
  '2314',
  '2316',
  '2320',
  '2323',
  '2324',
  '2325',
  '2326',
  '2331',
  '2342',
  '2343',
  '2344',
  '2345',
  '2346',
  '2352',
  '2353',
  '2354',
  '2355',
  '2356',
  '2357',
  '2392',
  '2393',
  '2394',
  '2395',
  '2396',
  '2473',
  '2474',
  '2475',
  '2477',
  '2478',
  '249',
  '291',
  '2921',
  '2923'
];

const getBuenosAiresAreaPrefix = (mobileDigits) =>
  BUENOS_AIRES_AREA_PREFIXES.find((prefix) => mobileDigits.startsWith(prefix));

export const normalizeWhatsAppNumber = (value = '') => {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) return WHATSAPP_WA_NUMBER;
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('9')) return `54${digits}`;

  return `549${digits}`;
};

export const normalizeBuenosAiresWhatsApp = (value = '') => {
  const rawDigits = String(value).replace(/\D/g, '');

  if (!rawDigits) {
    return {
      error: 'Ingresa un WhatsApp de Buenos Aires para poder coordinar la entrega.',
      value: ''
    };
  }

  let mobileDigits = rawDigits;

  if (mobileDigits.startsWith('549')) {
    mobileDigits = mobileDigits.slice(3);
  } else if (mobileDigits.startsWith('54')) {
    mobileDigits = mobileDigits.slice(2);
    if (mobileDigits.startsWith('9')) {
      mobileDigits = mobileDigits.slice(1);
    }
  } else if (mobileDigits.startsWith('9') && mobileDigits.length === 11) {
    mobileDigits = mobileDigits.slice(1);
  }

  if (mobileDigits.startsWith('0')) {
    mobileDigits = mobileDigits.slice(1);
  }

  const areaPrefix = getBuenosAiresAreaPrefix(mobileDigits);

  if (areaPrefix && mobileDigits.slice(areaPrefix.length).startsWith('15')) {
    mobileDigits = `${areaPrefix}${mobileDigits.slice(areaPrefix.length + 2)}`;
  }

  if (mobileDigits.length !== 10 || !getBuenosAiresAreaPrefix(mobileDigits)) {
    return {
      error: 'El WhatsApp tiene que ser de Buenos Aires y quedar con formato +549 seguido del numero.',
      value: ''
    };
  }

  return {
    error: '',
    value: `+549${mobileDigits}`
  };
};

export const buildWhatsAppUrl = (message = '', phone = WHATSAPP_WA_NUMBER) =>
  `https://wa.me/${normalizeWhatsAppNumber(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`;

export const orderWhatsAppMessage = (orderId) =>
  `Hola, soy cliente de Accesorios Margarita. Quiero coordinar la entrega${
    orderId ? ` del pedido #${orderId}` : ''
  }.`;
