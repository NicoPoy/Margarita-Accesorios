import { useEffect } from 'react';

const ensureMetaTag = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => {
      if (name !== 'content') {
        element.setAttribute(name, value);
      }
    });
    document.head.appendChild(element);
  }

  if (attributes.content) {
    element.setAttribute('content', attributes.content);
  }
};

function DocumentMeta({ description, title }) {
  useEffect(() => {
    document.title = title;

    ensureMetaTag('meta[name="description"]', {
      name: 'description',
      content: description
    });
    ensureMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: title
    });
    ensureMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description
    });
    ensureMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title
    });
    ensureMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description
    });
  }, [description, title]);

  return null;
}

export default DocumentMeta;
