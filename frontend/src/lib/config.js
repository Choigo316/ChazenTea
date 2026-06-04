export const API_URL = 'https://shop.kduong.dev/api';

export const DEFAULT_POSTER_ITEM = {
  id: 'poster-1',
  eyebrow: 'Featured Poster',
  title: 'Spring Matcha House Special',
  subtitle: 'Promote limited drops, seasonal drinks, or in-store specials with a big visual moment right from Admin.',
  ctaText: 'Shop Collection',
  image: null,
  enabled: true,
};

export const DEFAULT_POSTER = {
  enabled: true,
  intervalMs: 5000,
  items: [DEFAULT_POSTER_ITEM],
};


export const CATEGORIES = ['All', 'Classic', 'Flavored', 'Matcha', 'Specialty', 'New'];

export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);

export const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Classic Milk Tea',
    shortName: 'CM',
    category: 'Classic',
    type: 'Ingredient',
    price: 12.99,
    stock: 48,
    maxStock: 60,
    description: 'Rich Assam black tea with creamy whole milk powder.',
    tag: 'Best Seller',
    weight: '250g',
    image: null,
  },
  {
    id: 'p2',
    name: 'Taro Dream',
    shortName: 'TD',
    category: 'Flavored',
    type: 'Ingredient',
    price: 13.99,
    stock: 32,
    maxStock: 50,
    description: 'Real taro root powder with a gentle vanilla undertone.',
    tag: 'Popular',
    weight: '250g',
    image: null,
  },
  {
    id: 'p10',
    name: 'Fresh Iced Matcha',
    shortName: 'FM',
    category: 'Matcha',
    type: 'Drink/Snack',
    price: 5.99,
    stock: 100,
    maxStock: 100,
    description: 'Freshly prepared iced matcha latte to-go.',
    tag: 'Fresh',
    weight: '1 Cup',
    image: null,
  },
];

export const getTaxRate = (stateAbbr) => {
  const STATE_TAX_RATES = {
    AK: 0.0176,
    AL: 0.0925,
    AR: 0.0947,
    AZ: 0.0837,
    CA: 0.0825,
    CO: 0.0777,
    CT: 0.0635,
    DC: 0.06,
    DE: 0,
    FL: 0.0702,
    GA: 0.0735,
    HI: 0.0444,
    IA: 0.0694,
    ID: 0.0603,
    IL: 0.0882,
    IN: 0.07,
    KS: 0.087,
    KY: 0.06,
    LA: 0.0955,
    MA: 0.0625,
    MD: 0.06,
    ME: 0.055,
    MI: 0.06,
    MN: 0.0746,
    MO: 0.0829,
    MS: 0.0707,
    MT: 0,
    NC: 0.0698,
    ND: 0.0696,
    NE: 0.0696,
    NH: 0,
    NJ: 0.066,
    NM: 0.0772,
    NV: 0.0823,
    NY: 0.0887,
    OH: 0.0722,
    OK: 0.0895,
    OR: 0,
    PA: 0.0634,
    RI: 0.07,
    SC: 0.0744,
    SD: 0.064,
    TN: 0.0955,
    TX: 0.082,
    UT: 0.0719,
    VA: 0.0575,
    VT: 0.0624,
    WA: 0.0929,
    WI: 0.0543,
    WV: 0.0655,
    WY: 0.0536,
    Other: 0.05,
  };

  return STATE_TAX_RATES[stateAbbr] || 0.05;
};

export const compressImage = (
  file,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
