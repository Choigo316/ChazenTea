import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Check, Moon, ShieldCheck, ShoppingBag, Sun, User } from 'lucide-react';
import Storefront from './components/Storefront';
import { CartSidebar, CheckoutModal, ReceiptModal } from './components/StoreModals';
import AdminPanel from './components/AdminPanel';
import { API_URL, DEFAULT_POSTER, INITIAL_PRODUCTS, getTaxRate } from './lib/config';

const THEME_STORAGE_KEY = 'chazen-theme';
const POSTER_STORAGE_KEY = 'chazen-store-poster';
const CUSTOMER_SESSION_STORAGE_KEY = 'chazen-customer-session';
const CUSTOMER_USERS_STORAGE_KEY = 'chazen-customer-users';
const MANAGER_PIN = '2003';

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false;

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark) {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function normalizePosterConfig(rawPoster) {
  if (!rawPoster) return DEFAULT_POSTER;

  if (Array.isArray(rawPoster?.items)) {
    return {
      ...DEFAULT_POSTER,
      ...rawPoster,
      items: rawPoster.items.map((item, index) => ({
        ...DEFAULT_POSTER.items[0],
        ...item,
        id: item.id || `poster-${index + 1}`,
      })),
    };
  }

  return {
    ...DEFAULT_POSTER,
    enabled: rawPoster?.enabled ?? true,
    items: [
      {
        ...DEFAULT_POSTER.items[0],
        ...rawPoster,
        id: rawPoster?.id || 'poster-1',
      },
    ],
  };
}

function getInitialPoster() {
  if (typeof window === 'undefined') return DEFAULT_POSTER;

  try {
    const savedPoster = window.localStorage.getItem(POSTER_STORAGE_KEY);
    if (!savedPoster) return DEFAULT_POSTER;
    return normalizePosterConfig(JSON.parse(savedPoster));
  } catch (error) {
    console.warn('Poster settings failed to load from cache', error);
    return DEFAULT_POSTER;
  }
}

function getStoredCustomerUsers() {
  if (typeof window === 'undefined') return [];

  try {
    const savedUsers = window.localStorage.getItem(CUSTOMER_USERS_STORAGE_KEY);
    return savedUsers ? JSON.parse(savedUsers) : [];
  } catch (error) {
    console.warn('Customer accounts failed to load', error);
    return [];
  }
}

function getInitialCustomerSession() {
  if (typeof window === 'undefined') return null;

  try {
    const savedSession = window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  } catch (error) {
    console.warn('Customer session failed to load', error);
    return null;
  }
}

function getApiHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (import.meta.env.VITE_API_KEY) {
    headers['x-api-key'] = import.meta.env.VITE_API_KEY;
  }

  return headers;
}

function AuthModal({ onClose, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (pin !== MANAGER_PIN) {
      setError('Incorrect manager PIN.');
      return;
    }

    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(18,18,14,0.55)] backdrop-blur-md px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-[880px] rounded-[36px] border border-[var(--bdrm)] bg-[var(--surf)] shadow-heavy overflow-hidden grid md:grid-cols-[0.95fr_1.05fr]">
        <div className="relative px-6 py-8 md:px-8 md:py-10 bg-[linear-gradient(160deg,#14241b_0%,#22362b_50%,#355544_100%)] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(87,184,170,0.22),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[10px] font-bold tracking-[0.18em] uppercase">
              Store Portal
            </div>
            <h2 className="mt-6 font-serif text-[34px] md:text-[42px] leading-[0.94]"> Store Acess</h2>
            <p className="mt-4 text-[14px] md:text-[15px] leading-[1.8] text-white/72 max-w-[320px]">
              Please enter Pin to access  the admin workspace, reporting tools, and store controls from the public storefront.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8 md:px-8 md:py-10 space-y-5">
          <div>
            <div className="eyebrow text-[var(--acc)]">Secure Access</div>
            <h3 className="mt-3 text-[28px] md:text-[34px] font-serif leading-none text-[var(--tx)]">Sign in to continue</h3>
            <p className="mt-3 text-[14px] md:text-[15px] text-[var(--tx2)] leading-[1.8]">
              Enter PIN to unlock  admin panel.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--tx3)] block mb-2">Manager PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value);
                setError('');
              }}
              placeholder="Enter PIN"
              className="w-full rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-3.5 text-[14px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:bg-[var(--surf)] focus:ring-4 focus:ring-[var(--accl)] transition-all"
            />
          </div>

          {error && <div className="rounded-[20px] border border-[var(--redb)] bg-[var(--redb)] px-4 py-3 text-[13px] text-[var(--red)]">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] transition-all">
              Continue browsing
            </button>
            <button type="submit" className="px-5 py-3 rounded-full bg-[var(--acc)] text-[var(--acc-tx)] text-[13px] font-semibold hover:bg-[var(--acc2)] transition-all flex items-center justify-center gap-2 shadow-soft">
              <ShieldCheck className="w-4 h-4" />
              Enter Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerAccountModal({ onClose, onSignIn, onCreateAccount }) {
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (mode === 'create') {
      if (!form.name.trim()) {
        setError('Name is required to create an account.');
        return;
      }

      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const result = onCreateAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      if (!result.ok) setError(result.message);
      return;
    }

    const result = onSignIn({ email: form.email.trim(), password: form.password });
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(18,18,14,0.55)] backdrop-blur-md px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-[920px] rounded-[36px] border border-[var(--bdrm)] bg-[var(--surf)] shadow-heavy overflow-hidden grid md:grid-cols-[0.92fr_1.08fr]">
        <div className="relative px-6 py-8 md:px-8 md:py-10 bg-[linear-gradient(155deg,#f5ece0_0%,#f1e5d8_42%,#ead9c7_100%)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(87,184,170,0.12),transparent_28%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,18,0.08)] bg-white/65 px-4 py-2 text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--acc)]">
              Tea Club
            </div>
            <h2 className="mt-6 font-serif text-[36px] md:text-[44px] leading-[0.94] text-[var(--tx)]">Check out.</h2>
            <p className="mt-4 text-[14px] md:text-[15px] leading-[1.8] text-[var(--tx2)] max-w-[320px]">
              Create an account to save your profiles.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8 md:px-8 md:py-10 space-y-5">
          <div>
            <div className="eyebrow text-[var(--acc)]">Customer Account</div>
            <h3 className="mt-3 text-[28px] md:text-[34px] font-serif leading-none text-[var(--tx)]">Sign in or create account</h3>
          </div>

          <div className="inline-flex bg-[var(--surf2)] p-1 rounded-full border border-[var(--bdr)]">
            <button type="button" onClick={() => { setMode('sign-in'); setError(''); }} className={`px-5 py-2 rounded-full text-[12px] font-semibold transition-all ${mode === 'sign-in' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx2)]'}`}>Sign In</button>
            <button type="button" onClick={() => { setMode('create'); setError(''); }} className={`px-5 py-2 rounded-full text-[12px] font-semibold transition-all ${mode === 'create' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx2)]'}`}>Create Account</button>
          </div>

          <div className="space-y-4">
            {mode === 'create' && (
              <div>
                <label className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--tx3)] block mb-2">Full Name</label>
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-3.5 text-[14px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:bg-[var(--surf)] focus:ring-4 focus:ring-[var(--accl)] transition-all" />
              </div>
            )}
            <div>
              <label className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--tx3)] block mb-2">Email</label>
              <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-3.5 text-[14px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:bg-[var(--surf)] focus:ring-4 focus:ring-[var(--accl)] transition-all" />
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--tx3)] block mb-2">Password</label>
              <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} className="w-full rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-3.5 text-[14px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:bg-[var(--surf)] focus:ring-4 focus:ring-[var(--accl)] transition-all" />
            </div>
            {mode === 'create' && (
              <div>
                <label className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--tx3)] block mb-2">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} className="w-full rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-3.5 text-[14px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:bg-[var(--surf)] focus:ring-4 focus:ring-[var(--accl)] transition-all" />
              </div>
            )}
          </div>

          {error && <div className="rounded-[20px] border border-[var(--redb)] bg-[var(--redb)] px-4 py-3 text-[13px] text-[var(--red)]">{error}</div>}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] transition-all">Close</button>
            <button type="submit" className="px-5 py-3 rounded-full bg-[var(--acc)] text-[var(--acc-tx)] text-[13px] font-semibold hover:bg-[var(--acc2)] transition-all flex items-center justify-center gap-2 shadow-soft">
              <User className="w-4 h-4" />
              {mode === 'create' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerHubModal({ session, orders, onClose, onSignOut, onReorder }) {
  const customerOrders = orders.filter(
    (order) => (order.customer?.email || '').toLowerCase() === (session?.email || '').toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(18,18,14,0.55)] backdrop-blur-md px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-[860px] rounded-[36px] border border-[var(--bdrm)] bg-[var(--surf)] shadow-heavy overflow-hidden grid md:grid-cols-[0.92fr_1.08fr]">
        <div className="relative px-6 py-8 md:px-8 md:py-10 bg-[linear-gradient(155deg,#f5ece0_0%,#f1e5d8_42%,#ead9c7_100%)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(87,184,170,0.12),transparent_28%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,18,0.08)] bg-white/65 px-4 py-2 text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--acc)]">Account Hub</div>
            <h2 className="mt-6 font-serif text-[34px] md:text-[42px] leading-[0.94] text-[var(--tx)]">Welcome back, {session?.name?.split(' ')[0] || 'friend'}.</h2>
            <p className="mt-4 text-[14px] md:text-[15px] leading-[1.8] text-[var(--tx2)] max-w-[320px]">Your profile is saved on this device so checkout stays faster and your recent orders stay easy to review.</p>
          </div>
        </div>

        <div className="px-6 py-8 md:px-8 md:py-10 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow text-[var(--acc)]">Order History</div>
              <h3 className="mt-3 text-[28px] md:text-[34px] font-serif leading-none text-[var(--tx)]">Your recent orders</h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf2)] text-[var(--tx2)] hover:text-[var(--tx)] transition-all">×</button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-1">
            {customerOrders.length > 0 ? (
              customerOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="rounded-[24px] border border-[var(--bdr)] bg-[var(--surf2)] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--tx3)]">Order</div>
                      <div className="mt-1 text-[16px] font-semibold text-[var(--tx)]">#{order.id.slice(0, 8)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--tx3)]">Total</div>
                      <div className="mt-1 text-[16px] font-semibold text-[var(--tx)]">{Number(order.total || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[13px] text-[var(--tx2)]">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent order'}</div>
                  <div className="mt-2 text-[13px] text-[var(--tx2)] line-clamp-2">{(order.items || []).map((item) => `${item.quantity}x ${item.name}`).join(', ')}</div>
                  <div className="mt-3 inline-flex items-center rounded-full bg-[var(--surf)] border border-[var(--bdr)] px-3 py-1.5 text-[11px] font-semibold text-[var(--tx2)]">{order.status || 'Pending'}</div>
                  <div className="mt-3">
                    <button onClick={() => onReorder(order)} className="px-4 py-2 rounded-full bg-[var(--tx)] text-[var(--bg)] text-[12px] font-semibold hover:bg-[var(--acc)] transition-all">Reorder Items</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-[var(--bdr)] bg-[var(--surf2)] px-5 py-8 text-center">
                <div className="text-[18px] font-serif text-[var(--tx)]">No orders yet</div>
                <p className="mt-2 text-[13px] leading-[1.7] text-[var(--tx2)]">Once you place an order with this account, it will show up here.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button onClick={onClose} className="px-5 py-3 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] transition-all">Close</button>
            <button onClick={onSignOut} className="px-5 py-3 rounded-full bg-[var(--tx)] text-[var(--bg)] text-[13px] font-semibold hover:bg-[var(--acc)] transition-all">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('store');
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [cartAnim, setCartAnim] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [usingBackend, setUsingBackend] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [brandTapCount, setBrandTapCount] = useState(0);
  const [storePoster, setStorePoster] = useState(getInitialPoster);
  const [isManagerUnlocked, setIsManagerUnlocked] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [customerSession, setCustomerSession] = useState(getInitialCustomerSession);
  const [customerUsers, setCustomerUsers] = useState(getStoredCustomerUsers);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [isCustomerHubOpen, setIsCustomerHubOpen] = useState(false);
  const canAccessAdmin = isManagerUnlocked;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!brandTapCount) return undefined;
    const timeoutId = window.setTimeout(() => setBrandTapCount(0), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [brandTapCount]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        if (canAccessAdmin) {
          setView('admin');
        } else {
          setIsAuthOpen(true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canAccessAdmin]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    window.localStorage.setItem(CUSTOMER_USERS_STORAGE_KEY, JSON.stringify(customerUsers));
  }, [customerUsers]);

  useEffect(() => {
    if (customerSession) {
      window.localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, JSON.stringify(customerSession));
    } else {
      window.localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    }
  }, [customerSession]);

  const handleBrandClick = () => {
    if (view === 'admin') {
      setView('store');
      setIsManagerUnlocked(false);
      setBrandTapCount(0);
      return;
    }

    setView('store');
    setBrandTapCount((current) => {
      const nextCount = current + 1;
      if (nextCount >= 5) {
        if (canAccessAdmin) {
          setView('admin');
        } else {
          setIsAuthOpen(true);
          showToast('Manager sign-in required.');
        }
        return 0;
      }
      return nextCount;
    });
  };

  const normalizeOrder = (order) => ({
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      name: item.name || 'Unknown Item',
    })),
    createdAt: order.created_at
      ? new Date(order.created_at)
      : order.createdAt
      ? new Date(order.createdAt)
      : null,
  });

  const sortOrdersNewestFirst = (nextOrders) =>
    [...nextOrders].sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  useEffect(() => {
    const fetchData = async () => {
      let backendOk = true;

      try {
        const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
        const data = await res.json();
        setProducts(data.length ? data : INITIAL_PRODUCTS);
      } catch (err) {
        console.warn('Products failed');
        setProducts(INITIAL_PRODUCTS);
        backendOk = false;
      }

      try {
        const res = await fetch(`${API_URL}/orders`, { cache: 'no-store' });
        const data = await res.json();
        setOrders(sortOrdersNewestFirst(data.map(normalizeOrder)));
      } catch (err) {
        console.warn('Orders failed');
        backendOk = false;
      }

      try {
        const res = await fetch(`${API_URL}/store-settings/homepage-posters`, {
          cache: 'no-store',
          headers: getApiHeaders(),
        });

        if (!res.ok) throw new Error('Poster fetch failed');

        const data = await res.json();
        const normalizedPoster = normalizePosterConfig(data);
        setStorePoster(normalizedPoster);
        window.localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify(normalizedPoster));
      } catch (err) {
        console.warn('Poster settings failed, using cached/local defaults', err);
      }

      setUsingBackend(backendOk);
    };

    fetchData();
  }, []);

  useLayoutEffect(() => {
    applyTheme(darkMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    window.localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify(storePoster));
  }, [storePoster]);

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      applyTheme(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const savePoster = async (nextPoster) => {
    const normalizedPoster = normalizePosterConfig(nextPoster);

    setStorePoster(normalizedPoster);
    window.localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify(normalizedPoster));

    try {
      const response = await fetch(`${API_URL}/store-settings/homepage-posters`, {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify(normalizedPoster),
      });

      if (!response.ok) throw new Error('Poster save failed');

      const savedPoster = normalizePosterConfig(await response.json());
      setStorePoster(savedPoster);
      window.localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify(savedPoster));
      showToast('Poster carousel synced');
      return true;
    } catch (error) {
      console.error(error);
      showToast('Poster saved locally, but backend sync failed.');
      return false;
    }
  };

  const addToCart = (product) => {
    const isDrink = product.type === 'Drink/Snack';
    if (!isDrink && product.stock <= 0) return;

    setCart((prev) => {
      const ex = prev.find((item) => item.id === product.id);
      if (ex) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 300);
    showToast(`${product.name} added to bag`);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          const p = products.find((product) => product.id === id);
          const isDrink = p.type === 'Drink/Snack';
          if (!isDrink && delta > 0 && newQty > p.stock) {
            showToast(`Max stock reached for ${p.name}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const placeOrder = async (customerInfo, channel = 'Online', orderItems = cart) => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = channel === 'POS' || subtotal >= 45 ? 0 : 4.99;
    const taxRate = channel === 'POS' ? 0.0825 : customerInfo.state ? getTaxRate(customerInfo.state) : 0.05;
    const tax = subtotal * taxRate;
    const total = subtotal + shipping + tax;

    const newOrder = {
      items: orderItems.map((item) => ({
        id: item.id,
        name: item.name || item.title || 'Unknown Item',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        category: item.category || '',
        type: item.type || '',
      })),
      total,
      subtotal,
      shipping,
      tax,
      customer: customerInfo,
      status: channel === 'POS' ? 'Completed' : 'Pending',
      channel,
      createdAt: new Date().toISOString(),
    };

    try {
      let savedOrder = null;

      if (usingBackend) {
        const response = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(newOrder),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('POST FAILED:', err);
          throw new Error('Order failed');
        }

        savedOrder = await response.json();
        const normalizedSavedOrder = normalizeOrder(savedOrder);

        setOrders((prev) =>
          sortOrdersNewestFirst([
            normalizedSavedOrder,
            ...prev.filter((order) => order.id !== normalizedSavedOrder.id),
          ])
        );

        const res = await fetch(`${API_URL}/orders`, { cache: 'no-store' });
        const fresh = await res.json();
        setOrders(sortOrdersNewestFirst(fresh.map(normalizeOrder)));
      } else {
        savedOrder = {
          ...newOrder,
          id: `temp_${Date.now()}`,
          createdAt: new Date(newOrder.createdAt),
        };

        setOrders((prev) => sortOrdersNewestFirst([normalizeOrder(savedOrder), ...prev]));
      }

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const inOrder = orderItems.find((item) => item.id === p.id);
          if (inOrder && p.type !== 'Drink/Snack') {
            return { ...p, stock: Math.max(0, p.stock - inOrder.quantity) };
          }
          return p;
        })
      );

      if (channel === 'Online') {
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
      }

      showToast('Order completed successfully!');

      if (savedOrder) {
        setReceiptOrder({
          ...savedOrder,
          createdAt: savedOrder.created_at
            ? new Date(savedOrder.created_at)
            : savedOrder.createdAt
            ? new Date(savedOrder.createdAt)
            : new Date(newOrder.createdAt),
        });
      }

      if (
        customerSession &&
        customerInfo?.email &&
        customerSession.email.toLowerCase() === customerInfo.email.toLowerCase()
      ) {
        setCustomerSession((current) =>
          current
            ? {
                ...current,
                name: customerInfo.name || current.name,
                email: customerInfo.email || current.email,
                address: customerInfo.address || current.address || '',
                city: customerInfo.city || current.city || '',
                state: customerInfo.state || current.state || 'CA',
                zip: customerInfo.zip || current.zip || '',
              }
            : current
        );
      }

      return true;
    } catch (e) {
      console.error(e);
      showToast('Error placing order.');
      return false;
    }
  };

  const handleManagerUnlock = () => {
    setIsManagerUnlocked(true);
    setIsAuthOpen(false);
    showToast('Manager access enabled.');
    setView('admin');
  };

  const handleCustomerSignIn = ({ email, password }) => {
    const matchedUser = customerUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    );

    if (!matchedUser) {
      return { ok: false, message: 'Account not found. Create one first or try again.' };
    }

    setCustomerSession({
      name: matchedUser.name,
      email: matchedUser.email,
      address: matchedUser.address || '',
      city: matchedUser.city || '',
      state: matchedUser.state || 'CA',
      zip: matchedUser.zip || '',
      role: 'customer',
    });
    setIsCustomerAuthOpen(false);
    showToast(`Welcome back, ${matchedUser.name.split(' ')[0] || 'customer'}!`);
    return { ok: true };
  };

  const handleCreateCustomerAccount = ({ name, email, password }) => {
    const exists = customerUsers.some((user) => user.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { ok: false, message: 'An account with that email already exists.' };
    }

    const nextUser = { name, email, password, address: '', city: '', state: 'CA', zip: '' };
    setCustomerUsers((current) => [...current, nextUser]);
    setCustomerSession({ ...nextUser, role: 'customer' });
    setIsCustomerAuthOpen(false);
    showToast(`Account created for ${name.split(' ')[0] || 'customer'}!`);
    return { ok: true };
  };

  const handleCustomerSignOut = () => {
    setCustomerSession(null);
    setIsCustomerHubOpen(false);
    showToast('Customer signed out.');
  };

  const handleReorder = (order) => {
    const reorderItems = (order.items || [])
      .map((item) => {
        const matchingProduct = products.find((product) => product.id === item.id);
        if (!matchingProduct) return null;
        return { ...matchingProduct, quantity: Number(item.quantity) || 1 };
      })
      .filter(Boolean);

    if (!reorderItems.length) {
      showToast('No reorderable items found for this order.');
      return;
    }

    setCart((current) => {
      const next = [...current];
      reorderItems.forEach((item) => {
        const existingIndex = next.findIndex((entry) => entry.id === item.id);
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + item.quantity,
          };
        } else {
          next.push(item);
        }
      });
      return next;
    });

    setIsCustomerHubOpen(false);
    setIsCartOpen(true);
    showToast('Items added back to your bag.');
  };

  const isStoreHeroNav = view === 'store' && !scrolled && !darkMode;

  return (
    <div className="app-shell selection:bg-[var(--acc)] selection:text-[var(--acc-tx)] min-h-[100svh] pb-[env(safe-area-inset-bottom)] font-sans relative flex flex-col">
      <div className={`premium-toast fixed top-6 left-1/2 -translate-x-1/2 glass border border-[var(--bdrm)] shadow-heavy px-5 py-3 rounded-full text-[13px] font-medium text-[var(--tx)] z-[999] transition-all duration-500 flex items-center gap-2 ${toastMsg ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="w-5 h-5 rounded-full bg-[var(--grn)] text-white flex items-center justify-center shrink-0"><Check className="w-3 h-3" /></div>
        {toastMsg}
      </div>

      <nav
        className={`premium-nav fixed top-3 left-3 right-3 md:top-4 md:left-8 md:right-8 z-50 h-[58px] sm:h-[56px] md:h-[60px] rounded-[20px] md:rounded-2xl flex items-center justify-between px-3 sm:px-3 md:px-7 transition-all duration-500 ${
          isStoreHeroNav
            ? 'border border-[rgba(26,23,18,0.08)] shadow-[0_12px_36px_rgba(34,28,20,0.14)]'
            : 'glass border border-[var(--bdr)] shadow-soft'
        }`}
        style={isStoreHeroNav ? { background: 'rgba(253,252,249,0.78)', backdropFilter: 'blur(18px)' } : {}}
      >
        <h1 className="text-[15px] sm:text-[17px] md:text-[21px] font-serif font-semibold tracking-[0.02em] cursor-pointer flex items-center gap-1 hover:opacity-70 transition-all shrink-0 text-[var(--tx)]" onClick={handleBrandClick}>
          Chazen <span className="italic font-light hidden sm:inline text-[var(--acc)]">Tea</span>
        </h1>

        <div className={`flex p-0.5 rounded-full border shrink-0 ${isStoreHeroNav ? 'bg-[rgba(255,255,255,0.52)] border-[rgba(26,23,18,0.08)]' : 'bg-[var(--surf2)] border-[var(--bdr)]'}`}>
          <button onClick={() => setView('store')} className={`px-3 sm:px-4 md:px-5 py-2 md:py-1.5 rounded-full text-[12px] md:text-[12px] font-semibold transition-all ${view === 'store' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}>Store</button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <button onClick={() => (customerSession ? setIsCustomerHubOpen(true) : setIsCustomerAuthOpen(true))} className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${isStoreHeroNav ? 'border-[rgba(26,23,18,0.08)] bg-[rgba(255,255,255,0.52)] text-[var(--tx2)] hover:text-[var(--tx)]' : 'border-[var(--bdrm)] bg-[var(--surf2)] text-[var(--tx3)] hover:text-[var(--tx)]'}`}>
            <span className="w-6 h-6 rounded-full bg-[var(--acc)] text-[var(--acc-tx)] text-[11px] font-bold flex items-center justify-center">
              {customerSession ? customerSession.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </span>
            <span className="hidden sm:inline text-[11px] font-semibold">{customerSession ? customerSession.name.split(' ')[0] : 'Account'}</span>
            {customerSession && <User className="w-3.5 h-3.5" />}
          </button>

          <button onClick={toggleDarkMode} className={`flex w-9 h-9 sm:w-9 sm:h-9 rounded-full border items-center justify-center transition-all active:scale-95 ${isStoreHeroNav ? 'border-[rgba(26,23,18,0.08)] bg-[rgba(255,255,255,0.52)] text-[var(--tx2)] hover:text-[var(--tx)]' : 'border-[var(--bdrm)] bg-[var(--surf2)] text-[var(--tx3)] hover:text-[var(--tx)]'}`}>
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button onClick={() => setIsCartOpen(true)} className={`relative px-3 sm:px-4 md:px-5 py-2.5 md:py-2 rounded-full text-[12px] md:text-[12px] font-semibold tracking-wide hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5 shadow-soft ${isStoreHeroNav ? 'bg-[var(--acc)] text-[var(--acc-tx)]' : 'bg-[var(--tx)] text-[var(--bg)]'}`}>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bag</span>
            {cart.length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-[var(--acc)] text-[var(--acc-tx)] text-[10px] font-bold flex items-center justify-center shadow-soft border-2 border-[var(--surf)] ${cartAnim ? 'animate-pop' : ''}`}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className={`flex-1 flex flex-col ${view === 'admin' ? 'pt-[68px] md:pt-[76px]' : ''}`}>
        {view === 'store' ? (
          <Storefront products={products} addToCart={addToCart} poster={storePoster} />
        ) : (
          <AdminPanel
            products={products}
            orders={orders}
            setProducts={setProducts}
            setOrders={setOrders}
            placeOrder={placeOrder}
            darkMode={darkMode}
            showToast={showToast}
            setReceiptOrder={setReceiptOrder}
            usingBackend={usingBackend}
            API_URL={API_URL}
            poster={storePoster}
            setPoster={savePoster}
          />
        )}
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} updateQty={updateCartQty} removeItem={removeFromCart} onCheckout={() => setIsCheckoutOpen(true)} />
      {isCheckoutOpen && <CheckoutModal cart={cart} onClose={() => setIsCheckoutOpen(false)} onSubmit={placeOrder} initialCustomer={customerSession} />}
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onUnlock={handleManagerUnlock} />}
      {isCustomerAuthOpen && <CustomerAccountModal onClose={() => setIsCustomerAuthOpen(false)} onSignIn={handleCustomerSignIn} onCreateAccount={handleCreateCustomerAccount} />}
      {isCustomerHubOpen && <CustomerHubModal session={customerSession} orders={orders} onClose={() => setIsCustomerHubOpen(false)} onSignOut={handleCustomerSignOut} onReorder={handleReorder} />}
    </div>
  );
}
