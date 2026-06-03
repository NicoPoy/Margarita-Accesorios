export const WHATSAPP_NUMBER = '+54 9 2226 60-6589';
export const WHATSAPP_WA_NUMBER = '5492226606589';

export const normalizeWhatsAppNumber = (value = '') => {
  const digits = String(value).replace(/\D/g, '');

  if (!digits) return WHATSAPP_WA_NUMBER;
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('9')) return `54${digits}`;

  return `549${digits}`;
};

export const buildWhatsAppUrl = (message = '', phone = WHATSAPP_WA_NUMBER) =>
  `https://wa.me/${normalizeWhatsAppNumber(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`;

export const orderWhatsAppMessage = (orderId) =>
  `Hola, soy cliente de Accesorios Margarita. Quiero coordinar la entrega${
    orderId ? ` del pedido #${orderId}` : ''
  }.`;
