import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Package, Plus, Search } from 'lucide-react';
import { CATEGORIES, formatCurrency } from '../lib/config';

export default function Storefront({ products, addToCart, poster }) {
  const [typeFilter, setTypeFilter] = useState('Ingredient');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activePosterIndex, setActivePosterIndex] = useState(0);

  const posterItems = useMemo(
    () =>
      (poster?.items || []).filter((item) => item.enabled !== false),
    [poster]
  );

  useEffect(() => {
    if (activePosterIndex >= posterItems.length) {
      setActivePosterIndex(0);
    }
  }, [activePosterIndex, posterItems.length]);

  useEffect(() => {
    if (!poster?.enabled || posterItems.length <= 1) return undefined;

    const intervalMs = Math.max(2000, Number(poster.intervalMs) || 5000);
    const intervalId = window.setInterval(() => {
      setActivePosterIndex((current) => (current + 1) % posterItems.length);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [poster?.enabled, poster?.intervalMs, posterItems.length]);

  const activePoster = posterItems[activePosterIndex] || null;

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.active === false) return false;

      const matchType = (p.type || 'Ingredient') === typeFilter;
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [products, typeFilter, categoryFilter, search]);

  return (
    <main className="animate-in fade-in duration-700 w-full">
      <section className="relative w-full min-h-[100svh] md:min-h-[100svh] bg-[#1B2A1E] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(255,255,255,0.03),transparent)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[#2D4532] opacity-25 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0C1610] opacity-70 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#243828] opacity-30 rounded-full blur-[80px] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.72\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '200px',
          }}
        />

        <div className="h-[82px] md:h-[76px] shrink-0" />

        <div className="flex-1 flex flex-col items-center justify-center md:justify-center text-center px-5 sm:px-6 py-10 sm:py-10 md:py-20 relative z-10">
          <div
            className="inline-flex items-center gap-2 border border-white/[0.12] text-white/50 text-[9px] md:text-[10px] font-semibold tracking-[0.2em] uppercase px-4 py-2 rounded-full mb-4 sm:mb-8 md:mb-12 animate-fade-up"
            style={{ animationDelay: '0s', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.04)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7DAF8A] shrink-0" />
            Artisan · Taiwan &amp; Japan
          </div>

          <h1
            className="font-serif text-white animate-fade-up mb-4 md:mb-8 w-full max-w-[320px] sm:max-w-[560px] md:max-w-none"
            style={{
              animationDelay: '0.12s',
              fontSize: 'clamp(42px, 12vw, 120px)',
              lineHeight: 0.9,
              letterSpacing: '-0.02em',
              fontWeight: 300,
            }}
          >
            THE MODERN
            <br />
            <span style={{ color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', fontWeight: 300 }}>
              STANDARD
            </span>
            <br />
            FOR PREMIUM TEA.
          </h1>

          <p
            className="text-white/48 sm:text-white/35 text-[13px] sm:text-[17px] md:text-[17px] leading-[1.75] mb-8 md:mb-14 max-w-[300px] sm:max-w-[460px] font-sans animate-fade-up"
            style={{ animationDelay: '0.22s' }}
          >
            Artisan milk tea powders and pure matcha, meticulously sourced from heritage farms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up mt-1 md:mt-0 w-full max-w-[320px] sm:max-w-none" style={{ animationDelay: '0.32s' }}>
            <button
              onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
              className="group w-full sm:w-auto justify-center border border-white/20 text-white px-5 sm:px-7 py-3 sm:py-3 rounded-full font-semibold text-[12px] md:text-[13px] tracking-[0.06em] transition-all active:scale-95 flex items-center gap-2.5 hover:bg-white/8"
              style={{ backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.06)' }}
            >
              Explore Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-white/30 sm:text-white/20 text-[10px] sm:text-[11px] font-sans tracking-[0.14em] uppercase">Free shipping over $45</span>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] mt-8 sm:hidden animate-fade-up" style={{ animationDelay: '0.42s' }}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-sm">
              <div className="text-[9px] tracking-[0.18em] uppercase text-white/35 font-semibold">Sourcing</div>
              <div className="mt-1 text-[13px] text-white font-medium">Taiwan & Japan</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-sm">
              <div className="text-[9px] tracking-[0.18em] uppercase text-white/35 font-semibold">Shipping</div>
              <div className="mt-1 text-[13px] text-white font-medium">Free over $45</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/[0.07] px-5 md:px-16 py-4 md:py-5 flex items-center justify-between">
          <span className="text-white/20 text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase font-sans">Est. 2024</span>
          <div className="font-serif text-white/15 leading-none" style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 300 }}>茶</div>
          <span className="text-white/20 text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase font-sans">Taiwan · Japan</span>
        </div>

        <div className="hidden md:flex absolute bottom-20 left-1/2 -translate-x-1/2 flex-col items-center opacity-20 pointer-events-none animate-bounce">
          <div className="w-px h-12 bg-white/50" />
        </div>
      </section>

      <section className="flex md:flex relative w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-16 md:py-24 flex-col md:flex-row items-center gap-12 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--acc)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="flex-1 z-10 relative">
          <div className="inline-flex items-center gap-2.5 border border-[var(--bdrm)] bg-[var(--surf)] text-[var(--tx3)] text-[10px] font-semibold tracking-[0.18em] uppercase px-4 py-2 rounded-full mb-8 shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--grn)]" />
            The Modern Tea Room
          </div>
          <h2 className="font-serif text-[var(--tx)] mb-7" style={{ fontSize: 'clamp(40px,5.5vw,66px)', lineHeight: 0.97, letterSpacing: '-0.02em', fontWeight: 300 }}>
            Elevate your <br className="hidden md:block" />
            <em className="italic text-[var(--acc)]">daily ritual.</em>
          </h2>
          <p className="text-[16px] sm:text-[17px] md:text-[17px] text-[var(--tx2)] leading-[1.75] mb-10 max-w-[420px] font-sans">
            Artisan milk tea powders and pure matcha, meticulously sourced from heritage farms across Taiwan and Japan.
          </p>
          <button
            onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
            className="group bg-[var(--acc)] text-[var(--acc-tx)] px-8 py-4 rounded-full font-semibold text-[13px] tracking-wide hover:bg-[var(--acc2)] transition-all active:scale-95 shadow-heavy flex items-center gap-3"
          >
            Shop Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex-1 w-full max-w-[560px] relative z-10">
          {activePoster ? (
            <div className="rounded-[30px] border border-[var(--bdr)] bg-[var(--surf)] shadow-heavy overflow-hidden">
              <div className="p-4 md:p-5 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.96))]">
                <div className="rounded-[24px] bg-[#f3eadf] p-3 md:p-4">
                  {activePoster.image ? (
                    <img src={activePoster.image} alt={activePoster.title || 'Store poster'} className="w-full h-auto rounded-[18px] object-contain mx-auto" />
                  ) : (
                    <div className="rounded-[18px] min-h-[360px] md:min-h-[460px] bg-[radial-gradient(circle_at_top_left,rgba(170,212,178,0.22),transparent_35%),linear-gradient(135deg,#172219_0%,#27372b_48%,#101712_100%)] text-white p-8 flex flex-col justify-end">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">{activePoster.eyebrow || 'Featured Poster'}</div>
                      <div className="mt-4 font-serif text-[42px] leading-[0.95]">{activePoster.title || 'Store Poster'}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 md:px-6 py-5 border-t border-[var(--bdr)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--tx3)]">
                      {activePoster.eyebrow || 'Featured Poster'}
                    </div>
                    <h3 className="mt-2 font-serif text-[24px] md:text-[30px] leading-none text-[var(--tx)]">
                      {activePoster.title || 'Store Poster'}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.8] text-[var(--tx2)] max-w-[420px]">
                      {activePoster.subtitle || 'Highlight a seasonal product, event, or promo here.'}
                    </p>
                  </div>
                  <button
                    onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
                    className="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--tx)] px-5 py-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--bg)] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  >
                    {activePoster.ctaText || 'Shop Collection'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {posterItems.map((item, index) => (
                      <button
                        key={item.id || index}
                        onClick={() => setActivePosterIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${index === activePosterIndex ? 'w-8 bg-[var(--tx)]' : 'w-2.5 bg-[var(--bdrm)] hover:bg-[var(--tx3)]'}`}
                        aria-label={`Show poster ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex md:hidden items-center gap-2 rounded-full bg-[var(--tx)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-[var(--bg)] transition-all"
                  >
                    {activePoster.ctaText || 'Shop Collection'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[30px] border border-[var(--bdr)] bg-[var(--surf)] shadow-heavy p-8 md:p-10">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--tx3)]">Featured Posters</div>
              <div className="mt-4 font-serif text-[32px] md:text-[44px] leading-[0.95] text-[var(--tx)]">Add posters in Admin to feature seasonal drops here.</div>
            </div>
          )}
        </div>
      </section>

      <section id="catalog" className="catalog-shell w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-10 md:pt-0 pb-24 relative z-10">
        <div className="catalog-panel mb-8 md:mb-10">
          <div className="catalog-panel__copy">
            <div className="eyebrow">Shop Collection</div>
            <h3 className="font-serif text-[30px] md:text-[42px] leading-none text-[var(--tx)] mt-3">From single-origin teas to signature house drinks. A collection built around quality, not quantity.</h3>
            <p className="text-[14px] md:text-[15px] text-[var(--tx2)] mt-3 max-w-[560px]">
              Chazen. Where tea becomes ritual.
            </p>
          </div>

          <div className="catalog-actions">
            <div className="inline-flex bg-[var(--surf2)] p-1 rounded-full border border-[var(--bdr)] shadow-sm">
              <button onClick={() => { setTypeFilter('Ingredient'); setCategoryFilter('All'); }} className={`px-7 md:px-10 py-2 rounded-full text-[12px] font-semibold tracking-wide transition-all ${typeFilter === 'Ingredient' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx3)] hover:text-[var(--tx2)]'}`}>
                Ingredients
              </button>
              <button onClick={() => { setTypeFilter('Drink/Snack'); setCategoryFilter('All'); }} className={`px-7 md:px-10 py-2 rounded-full text-[12px] font-semibold tracking-wide transition-all ${typeFilter === 'Drink/Snack' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx3)] hover:text-[var(--tx2)]'}`}>
                Drinks & Snacks
              </button>
            </div>
            <div className="catalog-badge">{filteredProducts.length} visible products</div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 mb-8 md:mb-10">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 md:px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all ${categoryFilter === cat ? 'bg-[var(--acc)] text-[var(--acc-tx)] shadow-soft' : 'bg-[var(--surf)] border border-[var(--bdrm)] text-[var(--tx3)] hover:border-[var(--bdrh)] hover:text-[var(--tx2)]'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-[280px] md:self-end">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--tx3)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collection..." className="w-full pl-10 pr-5 py-2.5 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] text-[var(--tx)] outline-none focus:border-[var(--acc)] focus:ring-4 focus:ring-[var(--accl)] transition-all shadow-sm" />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center text-[var(--tx3)] border border-dashed border-[var(--bdrm)] rounded-3xl bg-[var(--surf2)]">
            <Package className="w-12 h-12 mb-4 mx-auto opacity-50" />
            <div className="text-[16px] font-medium text-[var(--tx2)]">No products found</div>
            <button onClick={() => { setSearch(''); setCategoryFilter('All'); }} className="text-[var(--acc)] text-[14px] mt-3 hover:underline font-medium">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {filteredProducts.map((p, i) => {
              const isDrink = p.type === 'Drink/Snack';
              const isOutOfStock = !isDrink && p.stock <= 0;
              return (
                <div key={p.id} onClick={!isOutOfStock ? () => addToCart(p) : undefined} className={`group relative bg-[var(--surf)] p-2 rounded-[24px] flex flex-col transition-all duration-300 border border-[var(--bdr)] ${isOutOfStock ? 'opacity-55 cursor-not-allowed grayscale-[0.3]' : 'cursor-pointer hover:-translate-y-1 shadow-soft hover:shadow-heavy hover:border-[var(--bdrm)] active:scale-[0.98]'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="h-[180px] sm:h-[220px] md:h-[260px] bg-[var(--surf2)] rounded-[18px] relative flex items-center justify-center overflow-hidden">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="font-serif text-[72px] font-light text-[var(--tx2)] leading-none transition-transform duration-700 group-hover:scale-110 opacity-70">
                        {p.shortName || p.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    {p.tag && (
                      <span className="absolute top-3.5 left-3.5 glass border border-[var(--bdr)] text-[var(--tx2)] text-[9px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-[0.14em] shadow-sm">
                        {p.tag}
                      </span>
                    )}

                    <div className="absolute inset-0 rounded-[18px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] pointer-events-none" />
                  </div>

                  <div className="p-5 pt-5 pb-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h4 className="font-serif text-[20px] leading-[1.2] font-medium text-[var(--tx)]">{p.name}</h4>
                      <div className="font-mono text-[14px] font-medium text-[var(--acc)] pt-0.5 shrink-0">{formatCurrency(p.price)}</div>
                    </div>
                    <p className="text-[13px] sm:text-[12px]text-[var(--tx3)] line-clamp-2 leading-[1.7] flex-1 mb-4 font-sans">{p.description}</p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--bdr)]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-semibold text-[var(--tx3)] uppercase tracking-[0.14em]">{p.weight || '250g'}</span>
                        <span className={`text-[11px] font-medium ${isOutOfStock ? 'text-[var(--red)]' : p.stock < 15 && !isDrink ? 'text-[var(--amb)]' : 'text-[var(--grn)]'}`}>{isDrink ? '' : isOutOfStock ? 'Out of stock' : p.stock < 15 ? `Only ${p.stock} left` : 'In stock'}</span>
                      </div>

                      <button disabled={isOutOfStock} onClick={(e) => { e.stopPropagation(); addToCart(p); }} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isOutOfStock ? 'bg-[var(--surf3)] text-[var(--tx3)]' : 'bg-[var(--tx)] text-[var(--bg)] hover:bg-[var(--acc)] hover:scale-105 active:scale-95 shadow-soft'}`}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
