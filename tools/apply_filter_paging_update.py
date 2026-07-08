from pathlib import Path


app_path = Path("src/App.jsx")
app = app_path.read_text(encoding="utf-8")

app = app.replace(
    "  const [sortOrder, setSortOrder] = useState('name-asc');\n"
    "  const [adminStockFilter, setAdminStockFilter] = useState('with-stock');\n",
    "  const [sortOrder, setSortOrder] = useState('name-asc');\n"
    "  const [priceMin, setPriceMin] = useState('');\n"
    "  const [priceMax, setPriceMax] = useState('');\n"
    "  const [itemsPerPage, setItemsPerPage] = useState(12);\n"
    "  const [adminStockFilter, setAdminStockFilter] = useState('with-stock');\n",
)

app = app.replace(
    "    const search = query.trim().toLowerCase();\n"
    "    const sourceProducts = isAdmin ? catalogProducts : activeProducts;\n",
    "    const search = query.trim().toLowerCase();\n"
    "    const minPrice = priceMin === '' ? null : Number(priceMin);\n"
    "    const maxPrice = priceMax === '' ? null : Number(priceMax);\n"
    "    const sourceProducts = isAdmin ? catalogProducts : activeProducts;\n",
)

app = app.replace(
    "      const matchesSearch =\n"
    "        !search ||\n"
    "        product.name.toLowerCase().includes(search) ||\n"
    "        product.category.toLowerCase().includes(search);\n\n"
    "      return matchesStockFilter && matchesCategory && matchesSearch;\n",
    "      const matchesSearch =\n"
    "        !search ||\n"
    "        product.name.toLowerCase().includes(search) ||\n"
    "        product.category.toLowerCase().includes(search);\n"
    "      const matchesMinPrice = minPrice === null || product.price >= minPrice;\n"
    "      const matchesMaxPrice = maxPrice === null || product.price <= maxPrice;\n\n"
    "      return (\n"
    "        matchesStockFilter &&\n"
    "        matchesCategory &&\n"
    "        matchesSearch &&\n"
    "        matchesMinPrice &&\n"
    "        matchesMaxPrice\n"
    "      );\n",
)

app = app.replace(
    "  }, [activeCategory, activeProducts, adminStockFilter, catalogProducts, isAdmin, query, sortOrder]);\n",
    "  }, [\n"
    "    activeCategory,\n"
    "    activeProducts,\n"
    "    adminStockFilter,\n"
    "    catalogProducts,\n"
    "    isAdmin,\n"
    "    priceMax,\n"
    "    priceMin,\n"
    "    query,\n"
    "    sortOrder\n"
    "  ]);\n\n"
    "  useEffect(() => {\n"
    "    const maxItems = Math.max(1, filteredProducts.length);\n"
    "    setItemsPerPage((currentItemsPerPage) =>\n"
    "      Math.min(Math.max(1, currentItemsPerPage), maxItems)\n"
    "    );\n"
    "  }, [filteredProducts.length]);\n",
)

app = app.replace(
    "            isAdmin={isAdmin}\n"
    "            query={query}\n"
    "            sortOrder={sortOrder}\n"
    "            onCategoryChange={setActiveCategory}\n"
    "            onQueryChange={setQuery}\n"
    "            onSortOrderChange={setSortOrder}\n"
    "            onStockFilterChange={setAdminStockFilter}\n",
    "            isAdmin={isAdmin}\n"
    "            itemsPerPage={itemsPerPage}\n"
    "            maxItemsPerPage={Math.max(1, filteredProducts.length)}\n"
    "            priceMax={priceMax}\n"
    "            priceMin={priceMin}\n"
    "            query={query}\n"
    "            sortOrder={sortOrder}\n"
    "            onCategoryChange={setActiveCategory}\n"
    "            onItemsPerPageChange={setItemsPerPage}\n"
    "            onPriceMaxChange={setPriceMax}\n"
    "            onPriceMinChange={setPriceMin}\n"
    "            onQueryChange={setQuery}\n"
    "            onSortOrderChange={setSortOrder}\n"
    "            onStockFilterChange={setAdminStockFilter}\n",
)

app = app.replace(
    "              products={filteredProducts}\n"
    "              resetKey={[activeCategory, query, sortOrder, adminStockFilter, isAdmin].join(\"-\")}\n",
    "              itemsPerPage={itemsPerPage}\n"
    "              products={filteredProducts}\n"
    "              resetKey={[\n"
    "                activeCategory,\n"
    "                query,\n"
    "                sortOrder,\n"
    "                adminStockFilter,\n"
    "                priceMin,\n"
    "                priceMax,\n"
    "                itemsPerPage,\n"
    "                isAdmin\n"
    "              ].join(\"-\")}\n",
)

app_path.write_text(app, encoding="utf-8")


toolbar_path = Path("src/components/Toolbar.jsx")
toolbar = toolbar_path.read_text(encoding="utf-8")

toolbar = toolbar.replace(
    "  isAdmin = false,\n"
    "  query,\n"
    "  sortOrder,\n"
    "  onCategoryChange,\n"
    "  onQueryChange,\n"
    "  onSortOrderChange,\n"
    "  onStockFilterChange\n",
    "  isAdmin = false,\n"
    "  itemsPerPage,\n"
    "  maxItemsPerPage,\n"
    "  priceMax,\n"
    "  priceMin,\n"
    "  query,\n"
    "  sortOrder,\n"
    "  onCategoryChange,\n"
    "  onItemsPerPageChange,\n"
    "  onPriceMaxChange,\n"
    "  onPriceMinChange,\n"
    "  onQueryChange,\n"
    "  onSortOrderChange,\n"
    "  onStockFilterChange\n",
)

toolbar = toolbar.replace(
    "        {isAdmin && (\n"
    "          <label className=\"select-field\">\n"
    "            <span>Stock</span>\n"
    "            <select\n"
    "              value={adminStockFilter}\n"
    "              onChange={(event) => onStockFilterChange(event.target.value)}\n"
    "            >\n"
    "              {stockFilterOptions.map((option) => (\n"
    "                <option key={option.value} value={option.value}>\n"
    "                  {option.label}\n"
    "                </option>\n"
    "              ))}\n"
    "            </select>\n"
    "          </label>\n"
    "        )}\n",
    "        <div className=\"filter-range-grid\">\n"
    "          <label className=\"number-field\">\n"
    "            <span>Precio min.</span>\n"
    "            <input\n"
    "              min=\"0\"\n"
    "              type=\"number\"\n"
    "              inputMode=\"numeric\"\n"
    "              value={priceMin}\n"
    "              onChange={(event) => onPriceMinChange(event.target.value)}\n"
    "              placeholder=\"0\"\n"
    "            />\n"
    "          </label>\n\n"
    "          <label className=\"number-field\">\n"
    "            <span>Precio max.</span>\n"
    "            <input\n"
    "              min=\"0\"\n"
    "              type=\"number\"\n"
    "              inputMode=\"numeric\"\n"
    "              value={priceMax}\n"
    "              onChange={(event) => onPriceMaxChange(event.target.value)}\n"
    "              placeholder=\"Sin limite\"\n"
    "            />\n"
    "          </label>\n"
    "        </div>\n\n"
    "        <label className=\"number-field\">\n"
    "          <span>Mostrar por pagina</span>\n"
    "          <input\n"
    "            min=\"1\"\n"
    "            max={maxItemsPerPage}\n"
    "            type=\"number\"\n"
    "            inputMode=\"numeric\"\n"
    "            value={itemsPerPage}\n"
    "            onChange={(event) => {\n"
    "              const nextValue = Number(event.target.value || 1);\n"
    "              onItemsPerPageChange(\n"
    "                Math.min(Math.max(1, nextValue), maxItemsPerPage)\n"
    "              );\n"
    "            }}\n"
    "          />\n"
    "        </label>\n\n"
    "        {isAdmin && (\n"
    "          <label className=\"select-field\">\n"
    "            <span>Stock</span>\n"
    "            <select\n"
    "              value={adminStockFilter}\n"
    "              onChange={(event) => onStockFilterChange(event.target.value)}\n"
    "            >\n"
    "              {stockFilterOptions.map((option) => (\n"
    "                <option key={option.value} value={option.value}>\n"
    "                  {option.label}\n"
    "                </option>\n"
    "              ))}\n"
    "            </select>\n"
    "          </label>\n"
    "        )}\n",
)

toolbar_path.write_text(toolbar, encoding="utf-8")


catalog_path = Path("src/components/ProductCatalog.jsx")
catalog = catalog_path.read_text(encoding="utf-8")

catalog = catalog.replace("const PRODUCTS_PER_PAGE = 12;\n\n", "")
catalog = catalog.replace(
    "  onDeleteProduct,\n"
    "  onEditProduct,\n"
    "  resetKey\n",
    "  onDeleteProduct,\n"
    "  onEditProduct,\n"
    "  itemsPerPage,\n"
    "  resetKey\n",
)
catalog = catalog.replace(
    "  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);\n",
    "  const totalPages = Math.ceil(products.length / itemsPerPage);\n",
)
catalog = catalog.replace(
    "        (currentPage - 1) * PRODUCTS_PER_PAGE,\n"
    "        currentPage * PRODUCTS_PER_PAGE\n",
    "        (currentPage - 1) * itemsPerPage,\n"
    "        currentPage * itemsPerPage\n",
)
catalog = catalog.replace(
    "  const hasPagedProducts = products.length > PRODUCTS_PER_PAGE;\n",
    "  const hasPagedProducts = products.length > itemsPerPage;\n",
)

catalog_path.write_text(catalog, encoding="utf-8")
