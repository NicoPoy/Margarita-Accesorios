import React from 'react';

function PaymentBanner() {
  return (
    <section className="payment-banner" aria-label="Medios de pago">
      <img
        src="/payment-methods-banner.png"
        alt="Medios de pago: efectivo, transferencia y Mercado Pago"
      />
    </section>
  );
}

export default PaymentBanner;
