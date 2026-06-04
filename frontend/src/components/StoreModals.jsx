import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Download,
  Lock,
  MapPin,
  Minus,
  Plus,
  Scissors,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { formatCurrency, getTaxRate } from '../lib/config';

export function CartSidebar({ isOpen, onClose, cart, updateQty, removeItem, onCheckout }) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 45 || subtotal === 0 ? 0 : 4.99;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 w-full max-w-[440px] h-full bg-[var(--surf)] shadow-heavy z-[201] flex flex-col transition-transform duration-400 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-[var(--bdr)] flex items-center justify-between bg-[var(--surf)] z-10">
          <h3 className="font-serif text-[26px] text-[var(--tx)] font-medium">Your Bag</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-[var(--surf2)] rounded-full text-[var(--tx2)] hover:text-[var(--tx)] transition-colors active:scale-95 border border-[var(--bdr)]"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 bg-[var(--surf)]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-[var(--surf2)] rounded-full flex items-center justify-center mb-6 border border-[var(--bdrm)]">
                <ShoppingBag className="w-8 h-8 text-[var(--tx3)]" />
              </div>
              <h4 className="font-serif text-[22px] text-[var(--tx)] mb-2">Your bag is empty</h4>
              <p className="text-[14px] text-[var(--tx2)] mb-8">Discover our premium blends and matcha.</p>
              <button onClick={onClose} className="px-8 py-3.5 bg-[var(--tx)] text-[var(--bg)] rounded-full font-semibold text-[13px] active:scale-95 transition-transform shadow-soft">Continue Shopping</button>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-[84px] h-[90px] rounded-2xl bg-[var(--surf2)] flex shrink-0 items-center justify-center overflow-hidden border border-[var(--bdr)]">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="font-serif text-[24px] font-bold text-[var(--tx2)]">{item.shortName || item.name.substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="text-[14px] font-semibold text-[var(--tx)] truncate pr-2">{item.name}</div>
                        <button onClick={() => removeItem(item.id)} className="text-[var(--tx3)] hover:text-[var(--red)] transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="text-[12px] text-[var(--tx3)] mt-0.5">{item.weight || '250g'}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-[var(--surf2)] rounded-full border border-[var(--bdrm)] p-0.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--surf)] active:scale-95 transition-all"><Minus className="w-3 h-3" /></button>
                        <span className="font-mono text-[13px] font-medium min-w-[24px] text-center text-[var(--tx)]">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--surf)] active:scale-95 transition-all"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="font-mono text-[15px] text-[var(--tx)] font-semibold">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[var(--bdr)] bg-[var(--surf)] shadow-[0_-4px_24px_rgba(0,0,0,0.03)] z-10">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[14px] text-[var(--tx2)]"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-[14px] text-[var(--tx2)]"><span>Shipping</span><span className="font-mono">{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between text-[14px] text-[var(--tx2)]"><span>Estimated Tax</span><span className="font-mono">{formatCurrency(tax)}</span></div>
            </div>
            <div className="flex justify-between text-[20px] font-bold text-[var(--tx)] pt-4 border-t border-[var(--bdrm)] mb-6">
              <span>Total</span><span className="font-mono">{formatCurrency(total)}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-[var(--tx)] text-[var(--bg)] py-4 rounded-full font-semibold text-[15px] active:scale-[0.98] transition-transform shadow-heavy flex items-center justify-center gap-2 hover:bg-[var(--acc)]">
              Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function CheckoutModal({ cart, onClose, onSubmit, initialCustomer = null }) {
  const [form, setForm] = useState(() => ({
    name: initialCustomer?.name || '',
    email: initialCustomer?.email || '',
    address: initialCustomer?.address || '',
    city: initialCustomer?.city || '',
    state: initialCustomer?.state || 'CA',
    zip: initialCustomer?.zip || '',
    card: '',
    expiry: '',
    cvv: '',
  }));

  const taxRate = getTaxRate(form.state);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const ship = subtotal >= 45 ? 0 : 4.99;
  const tax = subtotal * taxRate;
  const total = subtotal + ship + tax;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 md:p-6">
      <div className="bg-[var(--surf)] rounded-[24px] w-full max-w-[900px] max-h-[95vh] shadow-[var(--shl)] animate-in zoom-in-95 flex flex-col md:flex-row overflow-hidden border border-[var(--bdr)]">
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="flex items-center justify-between mb-8 md:hidden">
            <h3 className="font-serif text-[28px] font-medium text-[var(--tx)]">Checkout</h3>
            <button onClick={onClose} className="p-2 bg-[var(--surf2)] rounded-full text-[var(--tx2)] active:scale-95 border border-[var(--bdr)]"><X className="w-4 h-4" /></button>
          </div>
          <h3 className="hidden md:block font-serif text-[32px] font-medium text-[var(--tx)] mb-8">Secure Checkout</h3>

          <form id="checkout-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
            <div className="mb-8">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] mb-4 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Contact Info</h4>
              <div className="space-y-4">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email Address" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm" />
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] mb-4 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Shipping Address</h4>
              <div className="space-y-4">
                <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street Address" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm" />
                  <select required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm appearance-none">
                    {['AK', 'CA', 'FL', 'NY', 'TX', 'WA', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] mb-4 flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Payment Details</h4>
              <div className="space-y-4">
                <div className="relative">
                  <input required value={form.card} onChange={(e) => setForm({ ...form, card: e.target.value })} placeholder="Card Number" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] pl-12 pr-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm font-mono" />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--tx3)]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} placeholder="MM / YY" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm font-mono text-center" />
                  <div className="relative">
                    <input required value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} placeholder="CVV" className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] pl-12 pr-4 py-3.5 rounded-xl text-[14px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none transition-all shadow-sm font-mono" />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tx3)]" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="w-full md:w-[380px] bg-[var(--surf2)] p-6 md:p-10 flex flex-col border-t md:border-t-0 md:border-l border-[var(--bdrm)] relative">
          <div className="hidden md:flex justify-end absolute top-6 right-6">
            <button onClick={onClose} className="p-2.5 bg-[var(--surf)] border border-[var(--bdrm)] rounded-full text-[var(--tx2)] hover:text-[var(--tx)] transition-colors active:scale-95 shadow-sm"><X className="w-4 h-4" /></button>
          </div>

          <h4 className="font-serif text-[22px] font-medium text-[var(--tx)] mb-6 mt-2 md:mt-10">Order Summary</h4>

          <div className="flex-1 overflow-y-auto pr-2 mb-8 space-y-5">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-[60px] h-[60px] rounded-2xl bg-[var(--surf)] border border-[var(--bdrm)] flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="font-serif text-[18px] font-bold text-[var(--tx2)]">{item.shortName || item.name.substring(0, 2).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--tx)] truncate">{item.name}</div>
                  <div className="text-[11px] text-[var(--tx3)] mt-0.5">Qty: {item.quantity}</div>
                </div>
                <div className="font-mono text-[14px] font-bold text-[var(--tx)]">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-[13px] text-[var(--tx2)]"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-[13px] text-[var(--tx2)]"><span>Shipping</span><span className="font-mono">{ship === 0 ? 'Free' : formatCurrency(ship)}</span></div>
            <div className="flex justify-between text-[13px] text-[var(--tx2)]"><span>Tax ({(taxRate * 100).toFixed(2)}%)</span><span className="font-mono">{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-[20px] font-bold text-[var(--tx)] pt-5 border-t border-[var(--bdrm)] mt-3">
              <span>Total</span><span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>

          <button form="checkout-form" type="submit" className="w-full bg-[var(--tx)] text-[var(--bg)] font-semibold py-4 rounded-full active:scale-[0.98] transition-transform shadow-heavy flex items-center justify-center gap-2 hover:bg-[var(--acc)]">
            <Lock className="w-4 h-4" /> Pay {formatCurrency(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ order, onClose }) {
  const randomQr = useMemo(() => Math.random().toString(36).substring(2, 15).toUpperCase(), []);
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-[var(--surf)] text-[var(--tx)] rounded-[20px] w-full max-w-[380px] shadow-heavy animate-in zoom-in-95 overflow-hidden flex flex-col border border-[var(--bdrm)]">
        <div className="h-4 w-full" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, var(--surf) 11px)', backgroundSize: '20px 20px', backgroundRepeat: 'repeat-x', marginTop: '-10px' }} />
        <div className="px-8 py-10 font-mono text-[12px] flex-1 overflow-y-auto max-h-[75vh]">
          <div className="text-center mb-8">
            <Scissors className="w-5 h-5 mx-auto mb-4 text-[var(--tx3)]" />
            <h2 className="font-serif text-[30px] font-bold tracking-widest mb-1">CHAZEN TEA</h2>
            <p className="text-[var(--tx3)] uppercase tracking-widest text-[10px]">Premium Grade</p>
            <div className="mt-6 pt-5 border-t border-dashed border-[var(--bdrh)] text-[var(--tx2)]">Order #{order.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-[var(--tx3)] mt-1">{new Date(order.createdAt).toLocaleString()}</div>
          </div>

          <div className="space-y-4 mb-8">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <span className="font-bold">{item.quantity}x {item.name}</span>
                </div>
                <span className="font-bold text-right">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[var(--bdrh)] pt-5 space-y-2 mb-8 text-[var(--tx2)]">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
            {order.shipping > 0 && <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping)}</span></div>}
            <div className="flex justify-between font-bold text-[18px] mt-4 pt-4 border-t border-[var(--tx)] text-[var(--tx)]"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-[var(--surf2)] border border-[var(--bdrm)] rounded-xl shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${randomQr}`}
                className="w-[100px] h-[100px] rounded-lg bg-white p-1"
                alt="QR"
              />
            </div>
          </div>
          
          <div className="text-center text-[11px] text-[var(--tx3)] font-sans">
            <p>Thank you for your order.</p>
            <p className="mt-1 font-mono">shop.chazentea.com</p>
          </div>
        </div>
        <div className="bg-[var(--surf2)] p-5 flex gap-3 border-t border-[var(--bdrm)]">
          <button onClick={onClose} className="flex-1 py-3.5 bg-[var(--surf)] border border-[var(--bdrm)] rounded-xl text-[13px] font-bold text-[var(--tx)] active:scale-95 transition-transform shadow-sm">Close</button>
          <button onClick={() => window.print()} className="flex-1 py-3.5 bg-[var(--tx)] text-[var(--bg)] rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"><Download className="w-4 h-4" /> Download PDF</button>
        </div>
      </div>
    </div>
  );
}
