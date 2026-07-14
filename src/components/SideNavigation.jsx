import React, { useState } from 'react';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

const navGroups = [
  {
    title: 'Principal',
    items: [
      {
        view: 'home',
        label: 'Home',
        icon: (
          <Icon>
            <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />
          </Icon>
        )
      },
      {
        view: 'catalog',
        label: 'Catalogo',
        icon: (
          <Icon>
            <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
          </Icon>
        )
      }
    ]
  },
  {
    title: 'Cuenta',
    items: [
      {
        view: 'my-orders',
        label: 'Mis pedidos',
        clientOnly: true,
        icon: (
          <Icon>
            <path d="M7 7h13M7 12h13M7 17h13M3.5 7h.01M3.5 12h.01M3.5 17h.01" />
          </Icon>
        )
      }
    ]
  },
  {
    title: 'Administracion',
    adminOnly: true,
    items: [
      {
        view: 'orders',
        label: 'Pedidos',
        icon: (
          <Icon>
            <path d="M6 3h12v18H6V3Zm3 5h6M9 12h6M9 16h4" />
          </Icon>
        )
      },
      {
        view: 'out-of-stock',
        label: 'Sin stock',
        icon: (
          <Icon>
            <path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3M9 12h6" />
          </Icon>
        )
      },
      {
        view: 'categories',
        label: 'Categorias',
        icon: (
          <Icon>
            <path d="M4 5h7v6H4V5Zm9 0h7v6h-7V5ZM4 13h7v6H4v-6Zm9 0h7v6h-7v-6Z" />
          </Icon>
        )
      },
      {
        view: 'raffles',
        label: 'Sorteos',
        icon: (
          <Icon>
            <path d="M20 12v8H4v-8M2 7h20v5H2V7Zm10 13V7M12 7H7.5A2.5 2.5 0 1 1 10 4.5C10 6 12 7 12 7Zm0 0h4.5A2.5 2.5 0 1 0 14 4.5C14 6 12 7 12 7Z" />
          </Icon>
        )
      }
    ]
  }
];

function SideNavigation({
  currentView,
  isAdmin,
  onClientViewChange,
  onAdminViewChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (item) => {
    setIsOpen(false);

    if (isAdmin && ['orders', 'out-of-stock', 'categories', 'raffles'].includes(item.view)) {
      onAdminViewChange(item.view);
      return;
    }

    onClientViewChange(item.view);
  };

  return (
    <>
      <button
        className="side-navigation-trigger desktop-only"
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-controls="side-navigation-menu"
      >
        <Icon>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </Icon>
        <span className="sr-only">Menu</span>
      </button>

      {isOpen && (
        <>
          <button
            className="side-navigation-backdrop desktop-only"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menu"
          />
          <aside
            className="side-navigation desktop-only"
            id="side-navigation-menu"
            aria-label="Menu de navegacion"
          >
            <div className="side-navigation-scroll">
              {navGroups
                .filter((group) => !group.adminOnly || isAdmin)
                .map((group) => {
                  const visibleItems = group.items.filter((item) => !item.clientOnly || !isAdmin);

                  if (!visibleItems.length) return null;

                  return (
                    <section className="side-navigation-group" key={group.title}>
                      <span>{group.title}</span>
                      {visibleItems.map((item) => (
                        <button
                          className={currentView === item.view ? 'is-active' : ''}
                          key={item.label}
                          type="button"
                          onClick={() => handleItemClick(item)}
                        >
                          {item.icon}
                          <strong>{item.label}</strong>
                        </button>
                      ))}
                    </section>
                  );
                })}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default SideNavigation;
