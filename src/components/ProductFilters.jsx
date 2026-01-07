import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Inline SVG icons (no external dependency)
const FiFilter = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const FiX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FiChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FiChevronUp = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ProductFilters = ({ 
  categories = [],
  onFilterChange,
  initialFilters = {},
  customFilters = [] // Admin-defined custom filters from backend
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    sort: true,
    discount: true,
  });
  
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    priceRange: initialFilters.priceRange || '',
    sortBy: initialFilters.sortBy || '',
    discount: initialFilters.discount || '',
    ...initialFilters.custom || {},
  });

  // Price range options
  const priceRanges = [
    { label: 'All Prices', value: '' },
    { label: 'Under ₹100', value: '0-100' },
    { label: '₹100 - ₹500', value: '100-500' },
    { label: '₹500 - ₹1000', value: '500-1000' },
    { label: '₹1000 - ₹2000', value: '1000-2000' },
    { label: 'Above ₹2000', value: '2000-999999' },
  ];

  // Sort options
  const sortOptions = [
    { label: 'Default', value: '' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'newest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Best Discount', value: 'discount' },
  ];

  // Discount options
  const discountOptions = [
    { label: 'All', value: '' },
    { label: '10% or more', value: '10' },
    { label: '20% or more', value: '20' },
    { label: '30% or more', value: '30' },
    { label: '50% or more', value: '50' },
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      category: '',
      priceRange: '',
      sortBy: '',
      discount: '',
    };
    // Clear custom filters too
    customFilters.forEach(cf => {
      clearedFilters[cf.key] = '';
    });
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const FilterSection = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-gray-800">{title}</span>
        {expandedSections[sectionKey] ? (
          <FiChevronUp className="text-gray-500" />
        ) : (
          <FiChevronDown className="text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const RadioOption = ({ name, value, label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-600 group-hover:text-gray-900">{label}</span>
    </label>
  );

  const FilterContent = () => (
    <div className="space-y-0">
      {/* Category Filter */}
      <FilterSection title="Category" sectionKey="category">
        <RadioOption
          name="category"
          value=""
          label="All Categories"
          checked={filters.category === ''}
          onChange={(v) => handleFilterChange('category', v)}
        />
        {categories.map((cat) => (
          <RadioOption
            key={cat}
            name="category"
            value={cat}
            label={cat}
            checked={filters.category === cat}
            onChange={(v) => handleFilterChange('category', v)}
          />
        ))}
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range" sectionKey="price">
        {priceRanges.map((range) => (
          <RadioOption
            key={range.value}
            name="priceRange"
            value={range.value}
            label={range.label}
            checked={filters.priceRange === range.value}
            onChange={(v) => handleFilterChange('priceRange', v)}
          />
        ))}
      </FilterSection>

      {/* Sort By Filter */}
      <FilterSection title="Sort By" sectionKey="sort">
        {sortOptions.map((option) => (
          <RadioOption
            key={option.value}
            name="sortBy"
            value={option.value}
            label={option.label}
            checked={filters.sortBy === option.value}
            onChange={(v) => handleFilterChange('sortBy', v)}
          />
        ))}
      </FilterSection>

      {/* Discount Filter */}
      <FilterSection title="Discount" sectionKey="discount">
        {discountOptions.map((option) => (
          <RadioOption
            key={option.value}
            name="discount"
            value={option.value}
            label={option.label}
            checked={filters.discount === option.value}
            onChange={(v) => handleFilterChange('discount', v)}
          />
        ))}
      </FilterSection>

      {/* Custom Filters from Admin Panel */}
      {customFilters.map((customFilter) => (
        <FilterSection 
          key={customFilter.key} 
          title={customFilter.name} 
          sectionKey={customFilter.key}
        >
          <RadioOption
            name={customFilter.key}
            value=""
            label="All"
            checked={filters[customFilter.key] === '' || !filters[customFilter.key]}
            onChange={(v) => handleFilterChange(customFilter.key, v)}
          />
          {customFilter.options.map((option) => (
            <RadioOption
              key={option.value}
              name={customFilter.key}
              value={option.value}
              label={option.label}
              checked={filters[customFilter.key] === option.value}
              onChange={(v) => handleFilterChange(customFilter.key, v)}
            />
          ))}
        </FilterSection>
      ))}

      {/* Clear All Button */}
      {activeFilterCount > 0 && (
        <div className="pt-4">
          <button
            onClick={clearAllFilters}
            className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear All Filters ({activeFilterCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <FiFilter />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto lg:hidden"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 pb-20">
                <FilterContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiFilter />
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <FilterContent />
        </div>
      </div>
    </>
  );
};

export default ProductFilters;
