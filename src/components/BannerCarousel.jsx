import React, { useEffect, useMemo, useState } from 'react';

const MANIFEST_URL = '/banners/manifest.json';
const REFRESH_INTERVAL_MS = 8000;

function normalizeBanners(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      src: typeof item === 'string' ? item : item?.src,
      alt: typeof item === 'string' ? 'Banner Margarita Accesorios' : item?.alt
    }))
    .filter((item) => item.src)
    .map((item) => ({
      ...item,
      alt: item.alt || 'Banner Margarita Accesorios'
    }));
}

function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const activeBanner = banners[activeIndex];
  const hasMultipleBanners = banners.length > 1;

  const loadBanners = async () => {
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el manifest de banners');

      const nextBanners = normalizeBanners(await response.json());
      setBanners(nextBanners);
      setActiveIndex((currentIndex) =>
        nextBanners.length ? Math.min(currentIndex, nextBanners.length - 1) : 0
      );
    } catch {
      setBanners([]);
      setActiveIndex(0);
    }
  };

  const goToSlide = (nextIndex) => {
    setActiveIndex((nextIndex + banners.length) % banners.length);
  };

  const removeBrokenBanner = (brokenSrc) => {
    setBanners((currentBanners) => {
      const nextBanners = currentBanners.filter((banner) => banner.src !== brokenSrc);
      setActiveIndex((currentIndex) =>
        nextBanners.length ? Math.min(currentIndex, nextBanners.length - 1) : 0
      );
      return nextBanners;
    });
  };

  useEffect(() => {
    loadBanners();
    const refresh = window.setInterval(loadBanners, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(refresh);
  }, []);

  useEffect(() => {
    if (!hasMultipleBanners) return undefined;

    const rotation = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % banners.length);
    }, 5200);

    return () => window.clearInterval(rotation);
  }, [banners.length, hasMultipleBanners]);

  const dotButtons = useMemo(
    () =>
      banners.map((banner, index) => (
        <button
          className={index === activeIndex ? 'is-active' : ''}
          key={banner.src}
          type="button"
          onClick={() => goToSlide(index)}
          aria-label={`Ver banner ${index + 1}`}
          aria-current={index === activeIndex ? 'true' : undefined}
        />
      )),
    [activeIndex, banners]
  );

  if (!activeBanner) return null;

  return (
    <section className="banner-carousel" aria-label="Promociones destacadas">
      <div className="banner-carousel-track">
        <img
          src={activeBanner.src}
          alt={activeBanner.alt}
          onError={() => removeBrokenBanner(activeBanner.src)}
        />
      </div>

      {hasMultipleBanners && (
        <>
          <button
            className="banner-carousel-control banner-carousel-prev"
            type="button"
            onClick={() => goToSlide(activeIndex - 1)}
            aria-label="Ver banner anterior"
          >
            {'<'}
          </button>
          <button
            className="banner-carousel-control banner-carousel-next"
            type="button"
            onClick={() => goToSlide(activeIndex + 1)}
            aria-label="Ver banner siguiente"
          >
            {'>'}
          </button>
          <div className="banner-carousel-dots">{dotButtons}</div>
        </>
      )}
    </section>
  );
}

export default BannerCarousel;