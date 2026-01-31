import AxiosMockAdapter from 'axios-mock-adapter';
import axiosClient from '../common/axiosClient';
import { 
    mockUser, mockProducts, mockVariants, mockCategories, 
    mockColors, mockSizes, mockAccounts, mockOrders, 
    mockOrderDetails, mockVouchers, mockFeedbacks 
} from './mockData';

// Helper to normalize MongoDB $oid to string (duplicate from mockData for use here)
const getID = (obj) => {
  if (!obj) return null;
  return obj.$oid || obj;
};

export const setupMocks = () => {
  console.log("%c [GASH Demo] Initializing API Mocks... ", "background: #333; color: #ffcc00; font-weight: bold;");
  
  // Force baseURL to something predictable for mocking
  axiosClient.defaults.baseURL = 'http://gash-demo-mock';
  
  const mock = new AxiosMockAdapter(axiosClient, { delayResponse: 500 });
  
  const restrictedMessage = "This page is running in demo mode. To fully explore the project, please clone it and run it locally.";
  
  // -- Auth --
  mock.onGet(/.*\/auth\/check-status/).reply(200, { message: 'Active' });
  
  mock.onPost(/.*\/auth\/login/).reply(200, {
      token: "demo-token-12345",
      account: mockUser
  });

  mock.onPost(/.*\/auth\/logout/).reply(200);
  
  // -- Accounts --
  mock.onGet(/.*\/accounts$/).reply(config => {
      const { q, search, role } = config.params || {};
      let filtered = [...mockAccounts];
      const query = (q || search || '').toLowerCase();
      if (query) {
          filtered = filtered.filter(a => 
              (a.username && a.username.toLowerCase().includes(query)) ||
              (a.name && a.name.toLowerCase().includes(query)) ||
              (a.email && a.email.toLowerCase().includes(query))
          );
      }
      if (role) {
          filtered = filtered.filter(a => a.role === role);
      }
      return [200, { data: filtered }];
  });

  mock.onGet(/.*\/accounts\/search/).reply(config => {
      const { q, search } = config.params || {};
      const query = (q || search || '').toLowerCase();
      let filtered = [...mockAccounts];
      if (query) {
          filtered = filtered.filter(a => 
              (a.username && a.username.toLowerCase().includes(query)) ||
              (a.name && a.name.toLowerCase().includes(query)) ||
              (a.email && a.email.toLowerCase().includes(query))
          );
      }
      return [200, { data: filtered }];
  });

  mock.onGet(/.*\/accounts\/[a-zA-Z0-9_-]+$/).reply(config => {
      const id = config.url.split('/').pop();
      const account = mockAccounts.find(a => a._id === id) || (id === mockUser._id ? mockUser : null);
      return account ? [200, { data: account }] : [404, { message: "Account not found" }];
  });

  // -- Categories --
  mock.onGet(/.*\/categories\/get-all-categories/).reply(200, { success: true, data: mockCategories });
  mock.onGet(/.*\/categories\/get-category-detail\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const category = mockCategories.find(c => c._id === id);
      return category ? [200, { success: true, data: category }] : [404, { success: false, message: "Category not found" }];
  });
  mock.onGet(/.*\/categories\/search-categories/).reply(config => {
      const { q } = config.params || {};
      const query = (q || '').toLowerCase();
      const filtered = mockCategories.filter(c => c.categoryName.toLowerCase().includes(query));
      return [200, { success: true, data: filtered }];
  });
  mock.onPost(/.*\/categories\/create-category/).reply(200, { success: true, message: "Category created successfully (Demo)", data: {} });
  mock.onPut(/.*\/categories\/update-category\/.*/).reply(200, { success: true, message: "Category updated successfully (Demo)", data: {} });
  mock.onDelete(/.*\/categories\/delete-category\/.*/).reply(200, { success: true, message: "Category deleted successfully (Demo)", data: {} });

  // -- Specifications (Colors & Sizes) --
  mock.onGet(/.*\/specifications\/get-all-colors/).reply(200, { success: true, data: mockColors });
  mock.onGet(/.*\/specifications\/get-color-detail\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const color = mockColors.find(c => c._id === id);
      return color ? [200, { success: true, data: color }] : [404, { success: false, message: "Color not found" }];
  });
  mock.onGet(/.*\/specifications\/get-all-sizes/).reply(200, { success: true, data: mockSizes });
  mock.onGet(/.*\/specifications\/get-size-detail\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const size = mockSizes.find(s => s._id === id);
      return size ? [200, { success: true, data: size }] : [404, { success: false, message: "Size not found" }];
  });
  mock.onGet(/.*\/specifications\/search-specifications/).reply(config => {
      const { q, type } = config.params || {};
      const query = (q || '').toLowerCase();
      let data = type === 'color' ? mockColors : (type === 'size' ? mockSizes : [...mockColors, ...mockSizes]);
      const filtered = data.filter(item => 
          (item.productColorName && item.productColorName.toLowerCase().includes(query)) ||
          (item.productSizeName && item.productSizeName.toLowerCase().includes(query)) ||
          (item.color_name && item.color_name.toLowerCase().includes(query)) ||
          (item.size_name && item.size_name.toLowerCase().includes(query))
      );
      return [200, { success: true, data: filtered }];
  });
  mock.onPost(/.*\/specifications\/create-(color|size)/).reply(200, { success: true, message: "Specification created successfully (Demo)", data: {} });
  mock.onPut(/.*\/specifications\/update-(color|size)\/.*/).reply(200, { success: true, message: "Specification updated successfully (Demo)", data: {} });
  mock.onDelete(/.*\/specifications\/delete-(color|size)\/.*/).reply(200, { success: true, message: "Specification deleted successfully (Demo)", data: {} });

  // -- Vouchers --
  mock.onGet(/.*\/vouchers\/get-all-vouchers/).reply(200, { success: true, data: mockVouchers });
  mock.onGet(/.*\/vouchers\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const voucher = mockVouchers.find(v => v._id === id);
      return voucher ? [200, { success: true, data: voucher }] : [404, { success: false, message: "Voucher not found" }];
  });
  mock.onPost(/.*\/vouchers\/create-voucher/).reply(200, { success: true, message: "Voucher created successfully (Demo)", data: {} });
  mock.onPut(/.*\/vouchers\/update-voucher\/.*/).reply(200, { success: true, message: "Voucher updated successfully (Demo)", data: {} });
  mock.onDelete(/.*\/vouchers\/disable-voucher\/.*/).reply(200, { success: true, message: "Voucher disabled successfully (Demo)", data: {} });

  // -- Feedback --
  mock.onGet(/.*\/feedback\/get-all-feedbacks/).reply(200, { success: true, data: mockFeedbacks });
  mock.onGet(/.*\/feedback\/get-feedback-by-id\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const feedback = mockFeedbacks.find(f => f._id === id);
      return feedback ? [200, { success: true, data: feedback }] : [404, { success: false, message: "Feedback not found" }];
  });
  mock.onDelete(/.*\/feedback\/delete-feedback\/.*/).reply(200, { success: true, message: "Feedback deleted successfully (Demo)", data: {} });


  // -- Order Details / Feedback --
  mock.onGet(/.*\/order-details\/product\/[a-zA-Z0-9_-]+/).reply(config => {
      const productId = config.url.split('/').pop();
      const productFeedbacks = mockFeedbacks.filter(f => getID(f.productId) === productId);
      return [200, { data: productFeedbacks }];
  });

  // -- Products --
  mock.onGet(/.*\/new-products(\?.*)?$/).reply(200, { success: true, data: mockProducts });
  // (Ignoring filtering for brevity, but could keep it if needed)
  
  mock.onGet(/.*\/new-products\/search/).reply(config => {
      const { q, search } = config.params || {};
      const query = (q || search || '').toLowerCase();
      const filtered = mockProducts.filter(p => p.productName.toLowerCase().includes(query));
      return [200, { success: true, data: filtered }];
  });

  mock.onGet(/.*\/new-products\/[a-zA-Z0-9_-]+$/).reply(config => {
      const id = config.url.split('/').pop();
      const product = mockProducts.find(p => p._id === id);
      return product ? [200, { success: true, data: product }] : [404, { success: false, message: "Product not found" }];
  });

  mock.onPost(/.*\/new-products$/).reply(200, { success: true, message: "Product created successfully (Demo)", data: {} });
  mock.onPut(/.*\/new-products\/.*/).reply(200, { success: true, message: "Product updated successfully (Demo)", data: {} });
  mock.onDelete(/.*\/new-products\/.*/).reply(200, { success: true, message: "Product deleted successfully (Demo)", data: {} });
  mock.onPost(/.*\/new-products\/.*\/images/).reply(200, { success: true, message: "Image added successfully (Demo)", data: {} });
  mock.onDelete(/.*\/new-products\/.*\/images\/.*/).reply(200, { success: true, message: "Image deleted successfully (Demo)", data: {} });

  // -- Variants --
  mock.onGet(/.*\/new-variants\/get-all-variants/).reply(config => {
      const { productId } = config.params || {};
      let filtered = [...mockVariants];
      if (productId) filtered = filtered.filter(v => getID(v.productId) === productId);
      return [200, { success: true, data: filtered }];
  });

  mock.onGet(/.*\/new-variants\/get-variant-detail\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const variant = mockVariants.find(v => v._id === id);
      return variant ? [200, { success: true, data: variant }] : [404, { success: false, message: "Variant not found" }];
  });

  mock.onPost(/.*\/new-variants\/create-variant/).reply(200, { success: true, message: "Variant created successfully (Demo)", data: {} });
  mock.onPost(/.*\/new-variants\/bulk-create-variants/).reply(200, { success: true, message: "Bulk variants created successfully (Demo)", data: {} });
  mock.onPut(/.*\/new-variants\/update-variant\/.*/).reply(200, { success: true, message: "Variant updated successfully (Demo)", data: {} });
  mock.onDelete(/.*\/new-variants\/delete-variant\/.*/).reply(200, { success: true, message: "Variant deleted successfully (Demo)", data: {} });

  // -- Uploads / Images --
  mock.onPost(/.*\/upload(\/multiple)?/).reply(200, { 
      success: true, 
      data: { 
          url: "https://via.placeholder.com/600",
          urls: ["https://via.placeholder.com/600", "https://via.placeholder.com/600"] 
      } 
  });


  // ==== PERSISTENT MOCK STORAGE HELPERS ====
  const getStored = (key, fallback = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  const setStored = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  const MOCK_KEYS = {
      ORDERS: 'GASH_MOCK_ORDERS',
      CART: 'GASH_MOCK_CART',
      FAVORITES: 'GASH_MOCK_FAVORITES'
  };

  const currentOrders = getStored(MOCK_KEYS.ORDERS, mockOrders);
  if (currentOrders.length === 0 && mockOrders.length > 0) {
      setStored(MOCK_KEYS.ORDERS, mockOrders);
  }

  // Helper to enrich items with product/variant data
  const enrichItem = (item) => {
      const vId = getID(item.variantId?._id || item.variantId || item.variant?._id);
      const variant = mockVariants.find(v => getID(v._id) === vId);
      if (!variant) return item;
      
      const pId = getID(variant.productId?._id || variant.productId);
      const product = mockProducts.find(p => getID(p._id) === pId);
      
      return {
          ...item,
          variantId: {
              ...variant,
              productId: product
          },
          productName: product?.productName || "Unknown Product",
          productPrice: item.productPrice || variant.variantPrice || 0
      };
  };

  // -- Orders --
  mock.onGet(/.*\/orders\/admin\/get-all-order/).reply(200, { data: currentOrders });
  
  mock.onGet(/.*\/orders\/search/).reply(config => {
      const { q, orderStatus, payStatus } = config.params || {};
      const query = (q || '').toLowerCase();
      let filtered = [...currentOrders];
      if (query) {
          filtered = filtered.filter(o => o._id.toLowerCase().includes(query) || (o.customer?.name && o.customer.name.toLowerCase().includes(query)));
      }
      if (orderStatus) filtered = filtered.filter(o => o.orderStatus === orderStatus);
      if (payStatus) filtered = filtered.filter(o => o.payStatus === payStatus);
      return [200, { data: filtered }];
  });

  mock.onGet(/.*\/orders\/get-order-by-id\/[a-zA-Z0-9_-]+/).reply(config => {
      const id = config.url.split('/').pop();
      const order = currentOrders.find(o => o._id === id);
      if (!order) return [404, { message: "Order not found" }];
      
      // Enrich order details
      const enrichedDetails = (order.orderDetails || []).map(enrichItem);
      return [200, { data: { ...order, orderDetails: enrichedDetails } }];
  });

  // -- Order Details Search --
  mock.onGet(/.*\/order-details\/search/).reply(config => {
      const { q } = config.params || {};
      const query = (q || '').toLowerCase();
      let items = [...mockOrderDetails];
      if (query) {
          // Simplistic search in details
          items = items.filter(item => item._id.toLowerCase().includes(query));
      }
      return [200, { data: items.map(enrichItem) }];
  });

  // -- Statistics --
  mock.onGet(/.*\/new-statistics\/order-statistics/).reply(config => {
      const orders = currentOrders;
      return [200, {
          data: {
              totalOrders: orders.length,
              pending: orders.filter(o => o.orderStatus === 'pending').length,
              shipping: orders.filter(o => o.orderStatus === 'shipping').length,
              delivered: orders.filter(o => o.orderStatus === 'delivered').length,
              cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
          }
      }];
  });

  mock.onGet(/.*\/statistics\/revenue\/revenue-by-day/).reply(200, { 
      data: {
          dailyData: Array(30).fill(0).map((_, i) => ({ 
              date: `${i+1}/${new Date().getMonth()+1}/${new Date().getFullYear()}`, 
              revenue: Math.floor(Math.random() * 5000000),
              comparedToPreviousDay: "+5.2%"
          })),
          summary: {
              totalRevenueTodayFormatted: "1,200,000 đ",
              averageDailyRevenueFormatted: "950,000 đ",
              bestDayInPeriod: "15/01/2026"
          }
      } 
  });

  mock.onGet(/.*\/statistics\/revenue\/revenue-by-month/).reply(200, { 
      success: true,
      data: {
          monthlyData: [
              { year: 2026, month: "January", totalRevenue: 45000000, comparedToPreviousMonth: "+12%" },
              { year: 2026, month: "February", totalRevenue: 38000000, comparedToPreviousMonth: "-15%" },
              { year: 2025, month: "January", totalRevenue: 40000000, comparedToPreviousMonth: "+5%" },
              { year: 2025, month: "February", totalRevenue: 35000000, comparedToPreviousMonth: "+8%" },
              // ... add more if needed
          ],
          summary: {
              currentMonthRevenueFormatted: "45,000,000 đ",
              averageMonthlyRevenueFormatted: "38,000,000 đ"
          }
      }
  });

  mock.onGet(/.*\/statistics\/revenue\/revenue-by-week/).reply(200, { data: Array(52).fill(0).map((_, i) => ({ week: i+1, revenue: Math.floor(Math.random() * 5000) })) });
  mock.onGet(/.*\/statistics\/revenue\/revenue-by-year/).reply(200, { data: [{ year: 2024, revenue: 150000 }, { year: 2025, revenue: 200000 }] });


  // Catch-all 
  mock.onAny().reply(config => {
    console.warn(`[GASH Demo] Unmatched Request: ${config.method.toUpperCase()} ${config.url}`, config);
    return [404, { message: "Mock not found for this endpoint" }];
  });

  window.__GASH_DEMO_ACTIVE__ = true;
};
