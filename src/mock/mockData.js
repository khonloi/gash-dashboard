import productsRaw from './data/gash_products.json';
import categoriesRaw from './data/gash_categories.json';
import variantsRaw from './data/gash_Productvariants.json';
import imagesRaw from './data/gash_productimages.json';
import colorsRaw from './data/gash_productcolors.json';
import sizesRaw from './data/gash_productsizes.json';
import accountsRaw from './data/gash_accounts.json';
import ordersRaw from './data/gash_orders.json';
import orderDetailsRaw from './data/gash_orderdetails.json';
import vouchersRaw from './data/gash_vouchers.json';

// Helper to normalize MongoDB $oid to string
const getID = (obj) => {
  if (!obj) return null;
  return obj.$oid || obj;
};

// Maps for quick lookup by ID string
export const mockCategories = categoriesRaw.map(c => ({ 
  ...c, 
  _id: getID(c._id),
  cat_name: c.categoryName // Aliased for dashboard component
}));
export const mockColors = colorsRaw.map(c => ({ 
  ...c, 
  _id: getID(c._id),
  color_name: c.productColorName // Aliased for dashboard component
}));
export const mockSizes = sizesRaw.map(s => ({ 
  ...s, 
  _id: getID(s._id),
  size_name: s.productSizeName // Aliased for dashboard component
}));

const categoriesMap = Object.fromEntries(mockCategories.map(c => [c._id, c]));
const colorsMap = Object.fromEntries(mockColors.map(c => [c._id, c]));
const sizesMap = Object.fromEntries(mockSizes.map(s => [s._id, s]));
const imagesMap = Object.fromEntries(imagesRaw.map(i => [getID(i._id), { ...i, _id: getID(i._id) }]));

// Pre-process variants to include color/size objects
const variantsMap = Object.fromEntries(variantsRaw.map(v => {
  const id = getID(v._id);
  return [id, {
    ...v,
    _id: id,
    productColorId: colorsMap[getID(v.productColorId)],
    productSizeId: sizesMap[getID(v.productSizeId)]
  }];
}));

export const mockUser = {
  _id: "admin-123",
  username: "admin",
  name: "Administrator",
  email: "admin@gash.com",
  phone: "0123456789",
  address: "GASH Headquarters",
  role: "admin",
  image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  gender: "male",
  dob: "1990-01-01",
  createdAt: new Date().toISOString()
};


export const mockProducts = productsRaw.map(p => {
  const pId = getID(p._id);
  return {
    ...p,
    _id: pId,
    name: p.productName, // Aliased for components expecting .name
    categoryId: categoriesMap[getID(p.categoryId)],
    // In actual app, products often come with populated images and variants
    productImageIds: (p.productImageIds || []).map(id => imagesMap[getID(id)]).filter(Boolean),
    productVariantIds: (p.productVariantIds || []).map(id => variantsMap[getID(id)]).filter(Boolean),
    createdAt: p.createdAt?.$date || p.createdAt
  };
});

export const mockVariants = Object.values(variantsMap);
export const mockAccounts = accountsRaw.map(a => ({ ...a, _id: getID(a._id) }));
export const mockOrders = ordersRaw.map(o => ({ ...o, _id: getID(o._id) }));
export const mockOrderDetails = orderDetailsRaw.map(od => ({ ...od, _id: getID(od._id) }));
export const mockVouchers = vouchersRaw.map(v => ({ ...v, _id: getID(v._id) }));

export const mockImages = Object.values(imagesMap);
export const mockFeedbacks = [
  { _id: "f1", productId: "6916c4f34945cd9a5d8631fb", userId: "u1", content: "Great product!", rating: 5, createdAt: new Date().toISOString() },
  { _id: "f2", productId: "691836f7bc4af928d6320cb3", userId: "u2", content: "Good quality.", rating: 4, createdAt: new Date().toISOString() }
];
