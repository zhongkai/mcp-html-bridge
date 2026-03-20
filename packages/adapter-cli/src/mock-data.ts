// ── Mock datasets for testing ──

/** E-commerce SKU matrix dataset */
export const ecommerceData = {
  store: 'TechMart Global',
  lastUpdated: '2026-03-20T08:00:00Z',
  summary: {
    totalSKUs: 8,
    totalRevenue: 284750.0,
    avgPrice: 449.99,
    lowStockCount: 2,
  },
  products: [
    {
      sku: 'TM-LAP-001',
      name: 'UltraBook Pro 16"',
      category: 'Laptops',
      price: 1299.99,
      stock: 142,
      status: 'Active',
      rating: 4.7,
      revenue: 92399.29,
    },
    {
      sku: 'TM-LAP-002',
      name: 'DevStation X1 Carbon',
      category: 'Laptops',
      price: 1849.0,
      stock: 67,
      status: 'Active',
      rating: 4.9,
      revenue: 55470.0,
    },
    {
      sku: 'TM-PHN-001',
      name: 'Pixel Ultra 8',
      category: 'Phones',
      price: 899.0,
      stock: 234,
      status: 'Active',
      rating: 4.5,
      revenue: 44950.0,
    },
    {
      sku: 'TM-PHN-002',
      name: 'GalaxyFold Z7',
      category: 'Phones',
      price: 1799.0,
      stock: 12,
      status: 'Low Stock',
      rating: 4.3,
      revenue: 35980.0,
    },
    {
      sku: 'TM-TAB-001',
      name: 'iPad Air M3',
      category: 'Tablets',
      price: 649.0,
      stock: 0,
      status: 'Out of Stock',
      rating: 4.8,
      revenue: 25960.0,
    },
    {
      sku: 'TM-AUD-001',
      name: 'AirPods Max 2',
      category: 'Audio',
      price: 549.0,
      stock: 89,
      status: 'Active',
      rating: 4.6,
      revenue: 16470.0,
    },
    {
      sku: 'TM-ACC-001',
      name: 'MagSafe Charger Bundle',
      category: 'Accessories',
      price: 79.99,
      stock: 456,
      status: 'Active',
      rating: 4.2,
      revenue: 7999.0,
    },
    {
      sku: 'TM-ACC-002',
      name: 'USB-C Hub 12-in-1',
      category: 'Accessories',
      price: 129.99,
      stock: 8,
      status: 'Backorder',
      rating: 4.4,
      revenue: 5521.71,
    },
  ],
};

/** Particle physics collision dataset */
export const physicsData = {
  experiment: 'LHC Run 4 — Higgs Boson Decay Analysis',
  runId: 'CERN-2026-0342',
  timestamp: '2026-03-19T14:32:07.291Z',
  beamEnergy: 13.6, // TeV
  luminosity: 4.2e34, // cm⁻²s⁻¹
  description:
    'Analysis of diphoton invariant mass spectrum from proton-proton collisions at √s = 13.6 TeV. This run focused on measuring the Higgs boson signal strength in the H→γγ decay channel with improved electromagnetic calorimeter calibration. The observed excess at 125.09 GeV is consistent with the Standard Model Higgs boson prediction within 1.2σ.',
  results: {
    observedEvents: 14283,
    backgroundEstimate: 13950,
    signalExcess: 333,
    significance: 5.2, // sigma
    higgsMass: 125.09, // GeV/c²
    massUncertainty: 0.24,
    signalStrength: 1.12,
    signalStrengthError: 0.09,
  },
  eventSample: [
    { eventId: 'EVT-90341', energy: 125.3, eta: -1.42, phi: 2.81, pt: 64.2, channel: 'diphoton', selected: true },
    { eventId: 'EVT-90342', energy: 124.8, eta: 0.67, phi: -1.23, pt: 58.7, channel: 'diphoton', selected: true },
    { eventId: 'EVT-90343', energy: 91.2, eta: 2.11, phi: 0.45, pt: 42.1, channel: 'Z-boson', selected: false },
    { eventId: 'EVT-90344', energy: 125.1, eta: -0.23, phi: -2.67, pt: 71.3, channel: 'diphoton', selected: true },
    { eventId: 'EVT-90345', energy: 80.4, eta: 1.89, phi: 1.12, pt: 38.5, channel: 'W-boson', selected: false },
    { eventId: 'EVT-90346', energy: 125.0, eta: 0.02, phi: -0.89, pt: 66.8, channel: 'diphoton', selected: true },
  ],
};

/** Sample JSON Schema for a tool */
export const sampleToolSchema = {
  name: 'search_products',
  description: 'Search the product catalog with filters and sorting options.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
      category: {
        type: 'string',
        enum: ['Laptops', 'Phones', 'Tablets', 'Audio', 'Accessories'],
        description: 'Filter by product category',
      },
      priceRange: {
        type: 'object',
        properties: {
          min: { type: 'number', minimum: 0, description: 'Minimum price' },
          max: { type: 'number', minimum: 0, description: 'Maximum price' },
        },
        description: 'Price range filter',
      },
      inStockOnly: {
        type: 'boolean',
        default: true,
        description: 'Only show in-stock items',
      },
      sortBy: {
        type: 'string',
        enum: ['price', 'rating', 'name', 'stock'],
        description: 'Sort results by field',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Maximum number of results',
      },
    },
    required: ['query'],
  },
};
