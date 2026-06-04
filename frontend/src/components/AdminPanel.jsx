import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  DollarSign,
  FileText,
  History,
  LayoutDashboard,
  Loader2,
  Maximize,
  Minimize,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { CATEGORIES, DEFAULT_POSTER, compressImage, formatCurrency } from '../lib/config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const useCountUp = (value, duration = 500) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value, duration]);

  return display;
};

const REPORTABLE_STATUSES = new Set(['Pending', 'Preparing', 'Picked Up', 'Fulfilled', 'Completed']);

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DashboardView({ orders, darkMode, isSidebarOpen, setIsSidebarOpen, showToast }) {
  const [range, setRange] = useState('today');
  const bestDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!o.createdAt || o.status === 'Refunded') return;
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      map[day] = (map[day] || 0) + o.total;
    });
    const best = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return best ? { date: best[0], revenue: best[1] } : null;
  }, [orders]);

  const stats = useMemo(() => {
    const now = new Date();
    const getFiltered = (rangeType) =>
      orders.filter((o) => {
        if (!o.createdAt || o.status === 'Refunded') return false;
        const orderDate = new Date(o.createdAt);
        const diff = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (rangeType === 'today') return diff < 1;
        if (rangeType === '7d') return diff <= 7;
        if (rangeType === '30d') return diff <= 30;
        return true;
      });

    const current = getFiltered(range);
    const previous = orders.filter((o) => {
      if (!o.createdAt || o.status === 'Refunded') return false;
      const orderDate = new Date(o.createdAt);
      const diff = (now - orderDate) / (1000 * 60 * 60 * 24);
      if (range === 'today') return diff >= 1 && diff < 2;
      if (range === '7d') return diff > 7 && diff <= 14;
      if (range === '30d') return diff > 30 && diff <= 60;
      return false;
    });

    const calc = (list) => {
      const revenue = list.reduce((s, o) => s + o.total, 0);
      const count = list.length;
      return { revenue, count };
    };

    const curr = calc(current);
    const prev = calc(previous);
    const growth = (currVal, prevVal) => {
      if (!prevVal) return '—';
      const g = ((currVal - prevVal) / prevVal) * 100;
      return `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`;
    };

    return {
      revenue: curr.revenue,
      orderCount: curr.count,
      aov: curr.count ? curr.revenue / curr.count : 0,
      uniqueCustomers: new Set(current.map((o) => o.customer?.email)).size,
      revenueGrowth: growth(curr.revenue, prev.revenue),
      orderGrowth: growth(curr.count, prev.count),
      aovGrowth: growth(curr.count ? curr.revenue / curr.count : 0, prev.count ? prev.revenue / prev.count : 0),
    };
  }, [orders, range]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });
    const data = days.map((d) =>
      orders
        .filter((o) => (o.status !== 'Refunded' && o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] === d : false))
        .reduce((s, o) => s + o.total, 0)
    );
    return {
      labels: days.map((d) => d.split('-').slice(1).join('/')),
      datasets: [
        {
          data,
          borderColor: darkMode ? '#A3BCA6' : '#2E4032',
          backgroundColor: darkMode ? 'rgba(163,188,166,.09)' : 'rgba(46,64,50,.07)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: darkMode ? '#A3BCA6' : '#2E4032',
        },
      ],
    };
  }, [orders, darkMode]);

  const categoryData = useMemo(() => {
    const counts = {};
    orders
      .filter((o) => o.status !== 'Refunded')
      .forEach((o) => o.items.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + i.price * i.quantity; }));
    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: darkMode ? ['#A3BCA6', '#E5A93D', '#CF6679', '#C2D6C5', '#707570'] : ['#2E4032', '#A17532', '#8B3A3A', '#1D2920', '#A3A8A3'],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    };
  }, [orders, darkMode]);

  const topProducts = useMemo(() => {
    const rev = {};
    const units = {};
    orders
      .filter((o) => o.status !== 'Refunded')
      .forEach((o) =>
        o.items.forEach((i) => {
          rev[i.name] = (rev[i.name] || 0) + i.price * i.quantity;
          units[i.name] = (units[i.name] || 0) + i.quantity;
        })
      );
    return Object.entries(rev)
      .map(([n, r]) => ({ name: n, rev: r, units: units[n] }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
  }, [orders]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? '#121412' : '#fff',
        titleColor: darkMode ? '#F0F2F0' : '#1A1C1A',
        bodyColor: darkMode ? '#A0A6A0' : '#666B66',
        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: darkMode ? '#707570' : '#A3A8A3', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false },
        border: { display: false },
        ticks: { color: darkMode ? '#707570' : '#A3A8A3', font: { family: 'Inter', size: 11 } },
      },
    },
  };

  const exportSalesCsv = () => {
    const exportableOrders = orders.filter((order) => REPORTABLE_STATUSES.has(order.status || 'Pending') || order.status === 'Refunded');
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Status', 'Channel', 'Subtotal', 'Tax', 'Shipping', 'Total'],
      ...exportableOrders.map((order) => [
        order.id,
        order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
        order.customer?.name || order.customer?.email || 'Walk-in',
        order.status || 'Pending',
        order.channel || 'Online',
        Number(order.subtotal || 0).toFixed(2),
        Number(order.tax || 0).toFixed(2),
        Number(order.shipping || 0).toFixed(2),
        Number(order.total || 0).toFixed(2),
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadFile('sales-report.csv', csvContent, 'text/csv;charset=utf-8;');
    showToast('CSV report downloaded.');
  };

  const exportSalesPdf = () => {
    const printableRows = orders
      .filter((order) => REPORTABLE_STATUSES.has(order.status || 'Pending') || order.status === 'Refunded')
      .slice(0, 20)
      .map(
        (order) => `
          <tr>
            <td>${order.id}</td>
            <td>${order.customer?.name || order.customer?.email || 'Walk-in'}</td>
            <td>${order.status || 'Pending'}</td>
            <td>${order.channel || 'Online'}</td>
            <td>$${Number(order.total || 0).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      showToast('Please allow pop-ups to export PDF.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1e2438; }
            h1 { margin: 0 0 8px; }
            p { color: #5f6b85; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
            .card { border: 1px solid #dce4f2; border-radius: 16px; padding: 16px; background: #fff; }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #5f6b85; }
            .value { font-size: 24px; font-weight: 700; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { padding: 12px 10px; border-bottom: 1px solid #e7edf7; text-align: left; font-size: 14px; }
            th { font-size: 12px; text-transform: uppercase; color: #5f6b85; letter-spacing: 0.08em; }
          </style>
        </head>
        <body>
          <h1>Sales Report</h1>
          <p>Generated from the Chazen admin dashboard.</p>
          <div class="grid">
            <div class="card"><div class="label">Revenue</div><div class="value">${formatCurrency(stats.revenue)}</div></div>
            <div class="card"><div class="label">Orders</div><div class="value">${stats.orderCount}</div></div>
            <div class="card"><div class="label">Average Value</div><div class="value">${formatCurrency(stats.aov)}</div></div>
            <div class="card"><div class="label">Customers</div><div class="value">${stats.uniqueCustomers}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Channel</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${printableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast('Print dialog opened for PDF export.');
  };

  return (
    <div className="animate-fade-up">
      <div className="admin-hero mb-6 md:mb-8">
        <div>
          <div className="eyebrow">Command Center</div>
          <h2 className="font-serif text-[30px] md:text-[42px] leading-none text-[var(--tx)] mt-3">Track performance without the clutter.</h2>
          <p className="text-[13px] md:text-[14px] text-[var(--tx2)] mt-3 max-w-[520px]">Revenue, product mix, and top sellers are organized into a cleaner dashboard for both quick mobile checks and full desktop review.</p>
        </div>
        {bestDay && <div className="admin-hero-badge">Best Day: <strong>{bestDay.date}</strong> {formatCurrency(bestDay.revenue)}</div>}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] active:scale-95 shadow-soft hidden md:flex transition-all">
            {isSidebarOpen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-serif text-[26px] md:text-[30px] font-medium text-[var(--tx)] leading-none">Dashboard</h3>
            <p className="text-[13px] text-[var(--tx3)] mt-1">Store performance & analytics</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="flex bg-[var(--surf2)] p-1 rounded-full border border-[var(--bdr)] w-full md:w-auto overflow-x-auto">
            {[{ key: 'today', label: 'Today' }, { key: '7d', label: '7D' }, { key: '30d', label: '30D' }, { key: 'all', label: 'All' }].map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap ${range === r.key ? 'bg-[var(--surf)] text-[var(--tx)] shadow-soft' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={exportSalesCsv} className="px-4 py-2 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[12px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] transition-all active:scale-95">
              Export CSV
            </button>
            <button onClick={exportSalesPdf} className="px-4 py-2 rounded-full bg-[var(--tx)] text-[var(--bg)] text-[12px] font-semibold hover:opacity-90 transition-all active:scale-95">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <KPICard label="Gross Revenue" val={formatCurrency(useCountUp(stats.revenue))} trend={stats.revenueGrowth} />
        <KPICard label="Total Orders" val={useCountUp(stats.orderCount)} trend={stats.orderGrowth} />
        <KPICard label="Average Value" val={formatCurrency(useCountUp(stats.aov))} trend={stats.aovGrowth} />
        <KPICard label="Customers" val={useCountUp(stats.uniqueCustomers)} trend={stats.orderGrowth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
        <div className="lg:col-span-2 bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] shadow-soft p-6">
          <div className="flex justify-between items-end mb-6">
            <div><h3 className="text-[16px] font-semibold text-[var(--tx)] mb-1">Revenue Trajectory</h3><p className="text-[12px] text-[var(--tx3)]">Last 14 days performance</p></div>
          </div>
          <div className="h-[280px] w-full"><Line data={chartData} options={chartOptions} /></div>
        </div>
        <div className="bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] shadow-soft p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-[16px] font-semibold text-[var(--tx)] mb-1">Sales by Category</h3>
            <p className="text-[12px] text-[var(--tx3)]">Lifetime distribution</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            <div className="h-[200px] w-full"><Doughnut data={categoryData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: chartOptions.plugins }} /></div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] shadow-soft overflow-hidden">
        <div className="p-6 border-b border-[var(--bdrm)]">
          <h3 className="text-[16px] font-semibold text-[var(--tx)]">Top Performing Products</h3>
        </div>
        <div className="p-2">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-4 px-6 py-4 border-b border-[var(--bdr)] last:border-0 hover:bg-[var(--surf2)] transition-colors rounded-xl mx-2 my-1">
              <span className="w-6 h-6 rounded-full bg-[var(--surf3)] flex items-center justify-center font-mono text-[10px] text-[var(--tx2)] font-bold">{i + 1}</span>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-[var(--tx)]">{p.name}</div>
                <div className="text-[12px] text-[var(--tx3)] mt-0.5">{p.units} units sold</div>
              </div>
              <div className="font-mono text-[15px] font-bold text-[var(--tx)]">{formatCurrency(p.rev)}</div>
            </div>
          ))}
          {topProducts.length === 0 && <div className="p-10 text-center text-[13px] text-[var(--tx3)]">Awaiting first sale data.</div>}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, val, trend }) {
  const isPositive = trend?.startsWith('+');
  return (
    <div className="bg-[var(--surf)] border border-[var(--bdr)] rounded-[20px] p-6 shadow-soft relative overflow-hidden group">
      <div className="flex justify-between items-start mb-5">
        <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--tx3)]">{label}</div>
      </div>
      <div className="font-serif text-[38px] font-light leading-none mb-4 tracking-tight">{val}</div>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${trend === '—' ? 'text-[var(--tx3)]' : isPositive ? 'text-[var(--grn)]' : 'text-[var(--red)]'}`}>
        {trend !== '—' && <span className="text-[13px]">{isPositive ? '↑' : '↓'}</span>}
        {trend}
      </div>
    </div>
  );
}

function OrderManager({ orders, setOrders, setProducts, showToast, isSidebarOpen, setIsSidebarOpen, setReceiptOrder, usingBackend, API_URL }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => orders.filter((o) => o.id.includes(search) || (o.customer?.name || '').toLowerCase().includes(search.toLowerCase())), [orders, search]);

  const updateStatus = async (order, newStatus) => {
    try {
      if (usingBackend) {
        const response = await fetch(`${API_URL}/orders/${order.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, items: order.items })
        });
        if (!response.ok) {
          throw new Error('Status update failed');
        }
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      if (newStatus === 'Refunded') {
        setProducts((prevProducts) => prevProducts.map((p) => {
          const itemInOrder = order.items.find((i) => i.id === p.id);
          if (itemInOrder && itemInOrder.type !== 'Drink/Snack') return { ...p, stock: p.stock + itemInOrder.quantity };
          return p;
        }));
      }
      showToast(`Order updated to ${newStatus}`);
    } catch (e) {
      console.warn(e);
      showToast('Error updating status');
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="admin-hero mb-6">
        <div>
          <div className="eyebrow">Orders</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-none text-[var(--tx)] mt-3">Order Management</h2>
          <p className="text-[13px] md:text-[14px] text-[var(--tx2)] mt-3">Search by customer or ID, then move orders from pending to completed without losing the receipt trail.</p>
        </div>
        <div className="admin-hero-badge">{orders.length} total orders</div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] active:scale-95 shadow-soft hidden md:flex transition-all">
            {isSidebarOpen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-serif text-[26px] md:text-[30px] font-medium text-[var(--tx)] leading-none">Orders</h3>
            <p className="text-[13px] text-[var(--tx3)] mt-1">{orders.length} total orders processed</p>
          </div>
        </div>
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tx3)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID or Customer..." className="w-full pl-11 pr-5 py-3 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] outline-none focus:border-[var(--tx)] shadow-sm transition-all text-[var(--tx)]" />
        </div>
      </div>
      <div className="bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[var(--surf2)] text-[var(--tx3)] text-[9px] uppercase tracking-[0.16em] font-semibold border-b border-[var(--bdrm)]">
              <tr>
                <th className="py-4 px-6 whitespace-nowrap">Order ID</th>
                <th className="py-4 px-6 whitespace-nowrap">Customer</th>
                <th className="py-4 px-6">Contents</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">Total</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bdr)]">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[var(--surf2)] transition-colors group">
                  <td className="py-4 px-6 font-mono text-[13px] text-[var(--tx2)]">#{o.id.slice(0, 8)}</td>
                  <td className="py-4 px-6 font-medium text-[var(--tx)] whitespace-nowrap">{o.customer?.name || 'Walk-in'}</td>
                  <td className="py-4 px-6 max-w-[200px]"><div className="text-[13px] text-[var(--tx)] font-medium mb-0.5">{o.items.length} items</div><div className="text-[12px] text-[var(--tx3)] truncate">{o.items.map((i) => i.name).join(', ')}</div></td>
                  <td className="py-4 px-6 font-mono font-bold text-[var(--tx)] text-right">{formatCurrency(o.total)}</td>
                  <td className="py-4 px-6 text-center"><span className={`inline-flex items-center justify-center text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${(o.status === 'Completed') ? 'bg-[var(--grnb)] text-[var(--grn)]' : o.status === 'Picked Up' || o.status === 'Fulfilled' ? 'bg-[var(--accl)] text-[var(--acc)]' : o.status === 'Refunded' ? 'bg-[var(--redb)] text-[var(--red)]' : 'bg-[var(--ambb)] text-[var(--amb)]'}`}>{o.status}</span></td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {o.status === 'Pending' && <button onClick={() => updateStatus(o, 'Preparing')} className="px-3 py-1.5 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[11px] font-bold hover:border-[var(--tx)] hover:bg-[var(--tx)] hover:text-[var(--bg)] transition-all active:scale-95 shadow-sm">Prepare</button>}
                      {o.status === 'Preparing' && <button onClick={() => updateStatus(o, 'Picked Up')} className="px-3 py-1.5 rounded-full border border-[var(--accl)] bg-[var(--accl)] text-[var(--acc)] text-[11px] font-bold hover:bg-[var(--acc)] hover:text-[var(--acc-tx)] transition-all active:scale-95 shadow-sm">Picked Up</button>}
                      {(o.status === 'Picked Up' || o.status === 'Fulfilled') && <button onClick={() => updateStatus(o, 'Completed')} className="px-3 py-1.5 rounded-full border border-[var(--grnb)] bg-[var(--grnb)] text-[var(--grn)] text-[11px] font-bold hover:bg-[var(--grn)] hover:text-white transition-all active:scale-95 shadow-sm">Complete</button>}
                      {o.status !== 'Refunded' && <button onClick={() => updateStatus(o, 'Refunded')} className="px-3 py-1.5 rounded-full border border-[var(--redb)] bg-[var(--surf)] text-[var(--red)] text-[11px] font-bold hover:bg-[var(--redb)] transition-all active:scale-95 shadow-sm">Refund</button>}
                      <button onClick={() => setReceiptOrder(o)} className="w-8 h-8 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[var(--tx2)] hover:text-[var(--tx)] flex items-center justify-center active:scale-95 shadow-sm transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6"><div className="py-20 flex flex-col items-center justify-center text-[var(--tx3)]"><History className="w-12 h-12 mb-4 opacity-30" /><span className="text-[14px] font-medium">No orders found matching your search.</span></div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function POSTerminal({ products, placeOrder, isSidebarOpen, setIsSidebarOpen }) {
  const [posCart, setPosCart] = useState([]);
  const [cat, setCat] = useState('All');
  const [payMethod, setPayMethod] = useState('card');
  const [customerName, setCustomerName] = useState('');
  const filtered = useMemo(() => (cat === 'All' ? products : products.filter((p) => p.category === cat)), [products, cat]);
  const subtotal = posCart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;
  const add = (p) => {
    if (p.type !== 'Drink/Snack' && p.stock <= 0) return;
    setPosCart((pr) => (pr.find((x) => x.id === p.id) ? pr.map((x) => (x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x)) : [...pr, { ...p, quantity: 1 }]));
  };

  return (
    <div className="flex flex-col h-full animate-fade-up">
      <div className="admin-hero mb-6">
        <div>
          <div className="eyebrow">Counter Mode</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-none text-[var(--tx)] mt-3">Point Of Sale</h2>
          <p className="text-[13px] md:text-[14px] text-[var(--tx2)] mt-3">Tap products, assign a walk-in customer if needed, and charge out the current ticket within this tab.</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-8 shrink-0">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] active:scale-95 shadow-soft hidden md:flex transition-all">
          {isSidebarOpen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
        <div>
          <h3 className="font-serif text-[26px] md:text-[30px] font-medium text-[var(--tx)] leading-none">Point of Sale</h3>
          <p className="text-[13px] text-[var(--tx3)] mt-1">Walk-in & counter terminal</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start pb-10">
        <div>
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
            {CATEGORIES.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${cat === c ? 'bg-[var(--tx)] text-[var(--bg)] shadow-soft' : 'bg-[var(--surf)] border border-[var(--bdrm)] text-[var(--tx2)] hover:border-[var(--tx3)] hover:text-[var(--tx)]'}`}>{c}</button>)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const isDrink = p.type === 'Drink/Snack';
              const isOutOfStock = !isDrink && p.stock <= 0;
              return (
                <div key={p.id} onClick={() => add(p)} className={`bg-[var(--surf)] border border-[var(--bdr)] rounded-[20px] p-3 text-center transition-all flex flex-col ${isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale-[0.3]' : 'cursor-pointer hover:border-[var(--acc)] hover:-translate-y-0.5 shadow-soft hover:shadow-heavy hover:border-[var(--bdrm)] active:scale-95'}`}>
                  <div className="h-[100px] bg-[var(--surf2)] rounded-[12px] flex justify-center items-center overflow-hidden mb-3">
                    {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="font-serif text-[32px] font-bold text-[var(--tx2)]">{p.shortName || p.name.substring(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="px-1 pb-1 flex-1 flex flex-col">
                    <div className="text-[13px] font-semibold text-[var(--tx)] leading-tight mb-1 line-clamp-2 flex-1">{p.name}</div>
                    <div className="text-[14px] font-bold font-mono text-[var(--acc)] mt-2">{formatCurrency(p.price)}</div>
                    <div className="text-[11px] text-[var(--tx3)] mt-1 font-medium">{isDrink ? 'Made to order' : `${p.stock} left`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pos-ticket bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] shadow-heavy flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-6 overflow-hidden">
          <div className="p-6 border-b border-[var(--bdrm)] bg-[var(--surf2)]">
            <div className="font-serif text-[22px] font-medium text-[var(--tx)] mb-3">Current Ticket</div>
            <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tx3)]" /><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Assign to customer (optional)" className="w-full bg-[var(--surf)] border border-[var(--bdrm)] pl-10 pr-4 py-2.5 rounded-xl text-[13px] text-[var(--tx)] outline-none focus:border-[var(--acc)] shadow-sm transition-all" /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {posCart.length === 0 ? (
              <div className="text-center p-10 flex flex-col items-center justify-center h-full text-[var(--tx3)]"><div className="w-16 h-16 rounded-full border border-dashed border-[var(--bdrm)] flex items-center justify-center mb-4"><ShoppingCart className="w-6 h-6 opacity-50" /></div><div className="text-[14px] font-medium text-[var(--tx2)]">Ticket is empty</div><div className="text-[12px] mt-1">Tap a product to start</div></div>
            ) : (
              <div className="p-2 space-y-1">
                {posCart.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-3 hover:bg-[var(--surf2)] rounded-xl transition-colors group border border-transparent hover:border-[var(--bdr)]">
                    <div className="w-12 h-12 rounded-lg bg-[var(--surf2)] border border-[var(--bdrm)] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">{it.image ? <img src={it.image} className="w-full h-full object-cover" /> : <span className="font-serif text-[16px] font-bold text-[var(--tx2)]">{it.shortName || it.name.substring(0, 2).toUpperCase()}</span>}</div>
                    <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-[var(--tx)] truncate">{it.name}</div><div className="font-mono text-[13px] font-bold text-[var(--tx2)] mt-0.5">{formatCurrency(it.price)}</div></div>
                    <div className="flex items-center gap-4"><span className="font-mono text-[14px] font-bold text-[var(--acc)] bg-[var(--accl)] px-2.5 py-1 rounded-md">x{it.quantity}</span><button onClick={() => setPosCart((pr) => pr.filter((x) => x.id !== it.id))} className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--tx3)] hover:bg-[var(--redb)] hover:text-[var(--red)] transition-colors active:scale-95 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 bg-[var(--surf2)] border-t border-[var(--bdrm)]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-[13px] text-[var(--tx2)]"><span>Subtotal</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-[13px] text-[var(--tx2)]"><span>Tax (8.25%)</span><span className="font-mono">{formatCurrency(tax)}</span></div>
              <div className="flex justify-between text-[20px] font-bold text-[var(--tx)] pt-3 border-t border-[var(--bdr)] mt-2"><span>Total</span><span className="font-mono">{formatCurrency(total)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setPayMethod('card')} className={`py-3 rounded-xl text-[13px] font-bold transition-all border flex items-center justify-center gap-2 ${payMethod === 'card' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md border-transparent' : 'bg-[var(--surf)] border-[var(--bdrm)] text-[var(--tx)] hover:bg-[var(--surf2)]'}`}><CreditCard className="w-4 h-4" /> Card</button>
              <button onClick={() => setPayMethod('cash')} className={`py-3 rounded-xl text-[13px] font-bold transition-all border flex items-center justify-center gap-2 ${payMethod === 'cash' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md border-transparent' : 'bg-[var(--surf)] border-[var(--bdrm)] text-[var(--tx)] hover:bg-[var(--surf2)]'}`}><DollarSign className="w-4 h-4" /> Cash</button>
            </div>
            <button disabled={!posCart.length} onClick={async () => { await placeOrder({ name: customerName || 'Walk-in' }, 'POS', posCart); setPosCart([]); setCustomerName(''); }} className="w-full bg-[var(--acc)] text-[var(--acc-tx)] py-4 rounded-xl text-[15px] font-bold active:scale-[0.98] disabled:opacity-50 transition-transform shadow-heavy flex justify-center items-center gap-2">
              Charge {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductManager({ products, setProducts, showToast, isSidebarOpen, setIsSidebarOpen, usingBackend, API_URL }) {
  const [modalObj, setModalObj] = useState(null);
  const [isCompressingInline, setIsCompressingInline] = useState(null);
  const [confirmDeleteObj, setConfirmDeleteObj] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');

  const restock = async (p) => {
    const newStock = Math.min(p.maxStock || 60, p.stock + 20);
    try {
      if (usingBackend) {
        await fetch(`${API_URL}/products/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, stock: newStock }),
        });
      }
      setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, stock: newStock } : item)));
      showToast(`Restocked 20 units of ${p.name}`);
    } catch (e) {
      console.warn(e);
      showToast('Error restocking');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteObj) return;
    try {
      if (usingBackend) {
        await fetch(`${API_URL}/products/${confirmDeleteObj.id}`, {
          method: 'DELETE',
        });
      }
      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteObj.id));
      showToast(`Successfully deleted ${confirmDeleteObj.name}`);
      setConfirmDeleteObj(null);
    } catch (e) {
      console.warn(e);
      showToast('Error deleting');
    }
  };

  const handleInlineImage = async (e, p) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsCompressingInline(p.id);
    try {
      const compressedImage = await compressImage(file, 800, 800, 0.7);
      if (usingBackend) await fetch(`${API_URL}/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, image: compressedImage }) });
      setProducts((prev) => prev.map((item) => (item.id === p.id ? { ...item, image: compressedImage } : item)));
      showToast(`${p.name} image updated`);
    } catch (err) {
      console.warn(err);
      showToast('Error saving image.');
    } finally {
      setIsCompressingInline(null);
    }
  };

  const displayedProducts = useMemo(() => products.filter((p) => typeFilter === 'All' || (p.type || 'Ingredient') === typeFilter), [products, typeFilter]);

  return (
    <div className="relative min-h-full animate-fade-up">
      <div className="admin-hero mb-6">
        <div>
          <div className="eyebrow">Catalog Admin</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-none text-[var(--tx)] mt-3">Product Management</h2>
          <p className="text-[13px] md:text-[14px] text-[var(--tx2)] mt-3">Manage inventory, imagery, and product status.</p>
        </div>
        <div className="admin-hero-badge">{displayedProducts.length} products</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] active:scale-95 shadow-soft hidden md:flex transition-all">
            {isSidebarOpen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-serif text-[26px] md:text-[30px] font-medium text-[var(--tx)] leading-none">Products</h3>
            <p className="text-[13px] text-[var(--tx3)] mt-1">Manage catalog & inventory ({displayedProducts.length} items)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-[var(--surf2)] p-1 rounded-full border border-[var(--bdr)]">
            <button onClick={() => setTypeFilter('All')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${typeFilter === 'All' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}>All</button>
            <button onClick={() => setTypeFilter('Ingredient')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${typeFilter === 'Ingredient' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}>Ingredients</button>
            <button onClick={() => setTypeFilter('Drink/Snack')} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${typeFilter === 'Drink/Snack' ? 'bg-[var(--surf)] text-[var(--tx)] shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`}>Drinks & Snacks</button>
          </div>
          <button onClick={() => setModalObj({ name: '', shortName: '', price: '', stock: '', description: '', weight: '250g', category: 'Classic', type: 'Ingredient', image: null })} className="bg-[var(--tx)] text-[var(--bg)] px-5 py-2.5 rounded-full font-semibold text-[13px] active:scale-95 shadow-soft flex items-center gap-2 hover:opacity-90 transition-all"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProducts.map((p, i) => {
          const pct = p.maxStock ? Math.round((p.stock / p.maxStock) * 100) : Math.min(100, (p.stock / 50) * 100);
          const isDrink = p.type === 'Drink/Snack';
          return (
            <div key={p.id} className="group bg-[var(--surf)] border border-[var(--bdr)] rounded-[24px] shadow-soft hover:shadow-heavy transition-all duration-400 overflow-hidden flex flex-col hover:-translate-y-1" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="h-[180px] bg-[var(--surf2)] relative flex items-center justify-center overflow-hidden border-b border-[var(--bdr)]">
                {isCompressingInline === p.id ? (
                  <div className="flex flex-col items-center text-[var(--tx)]"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-[10px] font-bold tracking-widest">PROCESSING...</span></div>
                ) : (
                  <>
                    {p.image ? <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <span className="font-serif text-[40px] font-bold text-[var(--tx2)] transition-transform duration-700 group-hover:scale-110 drop-shadow-sm">{p.shortName || p.name.substring(0, 2).toUpperCase()}</span>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none backdrop-blur-sm"><span className="text-white text-[13px] font-semibold border border-white/30 px-4 py-2 rounded-full glass">Change Photo</span></div>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleInlineImage(e, p)} title="Change Photo" />
                  </>
                )}
                {p.tag && <span className="absolute top-3 left-3 bg-[var(--acc)] text-[var(--acc-tx)] text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{p.tag}</span>}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1 gap-2"><div className="text-[16px] font-serif font-semibold text-[var(--tx)] leading-tight">{p.name}</div><div className="font-mono text-[15px] font-bold text-[var(--acc)]">{formatCurrency(p.price)}</div></div>
                <div className="text-[12px] text-[var(--tx3)] mb-4">{p.type || 'Ingredient'} · {p.category}</div>
                {isDrink ? (
                  <div className="mt-auto mb-4 py-2.5 px-3 bg-[var(--surf2)] rounded-lg text-[11px] text-[var(--tx2)] font-medium text-center border border-[var(--bdrm)]">Made to order (Unlimited Stock)</div>
                ) : (
                  <div className="mt-auto mb-5">
                    <div className="flex justify-between text-[11px] font-semibold text-[var(--tx2)] mb-1.5 uppercase tracking-wider"><span>Stock</span><span className={pct < 20 ? 'text-[var(--red)]' : ''}>{p.stock} / {p.maxStock || 60}</span></div>
                    <div className="h-1.5 bg-[var(--surf3)] rounded-full overflow-hidden border border-[var(--bdr)]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: pct > 50 ? 'var(--grn)' : pct > 20 ? 'var(--amb)' : 'var(--red)' }} /></div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setModalObj(p)} className="flex-1 py-2 rounded-xl border border-[var(--bdrm)] bg-[var(--surf)] text-[12px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] transition-colors active:scale-95 shadow-sm">Edit</button>
                  {!isDrink && <button onClick={() => restock(p)} className="flex-1 py-2 rounded-xl border border-[var(--grnb)] bg-[var(--grnb)] text-[12px] font-semibold text-[var(--grn)] hover:bg-[var(--grn)] hover:text-white transition-colors active:scale-95 shadow-sm">+20</button>}
                  <button onClick={() => setConfirmDeleteObj(p)} className="w-10 flex items-center justify-center rounded-xl border border-[var(--redb)] bg-[var(--surf)] text-[var(--red)] hover:bg-[var(--redb)] transition-colors active:scale-95 shadow-sm shrink-0"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={async () => {
                    const updated = { ...p, active: !p.active };
                    if (usingBackend) await fetch(`${API_URL}/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                    setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
                    showToast(`${p.name} ${p.active ? 'disabled' : 'enabled'}`);
                  }} className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all border ${p.active ? 'bg-[var(--redb)] text-[var(--red)] border-[var(--redb)]' : 'bg-[var(--grnb)] text-[var(--grn)] border-[var(--grnb)]'}`}>
                    {p.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {displayedProducts.length === 0 && <div className="col-span-full py-20 border border-dashed border-[var(--bdrm)] rounded-[24px] flex flex-col items-center justify-center text-[var(--tx3)] bg-[var(--surf2)]"><Package className="w-12 h-12 mb-4 opacity-40" /><div className="text-[15px] font-medium text-[var(--tx)]">No products found</div><div className="text-[13px] mt-1">Try adjusting your filters or add a new product.</div></div>}
      </div>

      {confirmDeleteObj && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"><div className="bg-[var(--surf)] rounded-[24px] p-8 w-full max-w-[420px] shadow-heavy animate-in zoom-in-95 text-center border border-[var(--bdr)]"><div className="w-20 h-20 bg-[var(--redb)] text-[var(--red)] rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="w-10 h-10" /></div><h3 className="font-serif text-[28px] font-medium text-[var(--tx)] mb-3">Delete Product?</h3><p className="text-[14px] text-[var(--tx2)] mb-8 leading-relaxed">Are you sure you want to permanently delete <strong className="text-[var(--tx)]">{confirmDeleteObj.name}</strong>? This cannot be undone.</p><div className="flex gap-3"><button onClick={() => setConfirmDeleteObj(null)} className="flex-1 bg-[var(--surf2)] border border-[var(--bdrm)] text-[var(--tx)] font-semibold py-3.5 rounded-full text-[14px] hover:bg-[var(--surf3)] active:scale-95 transition-transform">Cancel</button><button onClick={handleDelete} className="flex-1 bg-[var(--red)] text-white font-semibold py-3.5 rounded-full text-[14px] hover:brightness-90 active:scale-95 transition-transform shadow-md">Yes, Delete</button></div></div></div>}

      {modalObj && <ProductModal product={modalObj} onClose={() => setModalObj(null)} setProducts={setProducts} showToast={showToast} usingBackend={usingBackend} API_URL={API_URL} />}
    </div>
  );
}

function ProductModal({ product, onClose, setProducts, showToast, usingBackend, API_URL }) {
  const [form, setForm] = useState(product);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEdit = !!product.id;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressedImage = await compressImage(file, 800, 800, 0.7);
      setForm({ ...form, image: compressedImage });
    } catch (err) {
      console.warn(err);
      alert('Error processing image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-[var(--acc)]', 'bg-[var(--accl)]');
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsCompressing(true);
    try {
      const compressedImage = await compressImage(file, 800, 800, 0.7);
      setForm({ ...form, image: compressedImage });
    } catch (err) {
      console.warn(err);
      alert('Error processing image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const save = async () => {
  setLoading(true);
  const data = {
    ...form,
    price: parseFloat(form.price) || 0,
    stock: parseInt(form.stock) || 0,
    maxStock: Math.max(parseInt(form.stock) || 0, 20),
    type: form.type || 'Ingredient'
  };

  try {
    if (isEdit) {
      if (usingBackend)
        await fetch(`${API_URL}/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data : p))
      );
      showToast(`Successfully updated ${data.name}`);
    } else {
      const newProduct = {
        ...data,
        id: `p_${Math.random().toString(36).substr(2, 9)}`
      };

      if (usingBackend)
        await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        });

      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Successfully added ${data.name}`);
    }
  } catch (e) {
    console.warn(e);
    showToast('Error saving product');
  }

  setLoading(false);
  onClose();
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4 md:p-6">
      <div className={`bg-[var(--surf)] rounded-[24px] w-full overflow-hidden shadow-heavy animate-in zoom-in-95 duration-300 transition-all border border-[var(--bdr)] flex flex-col ${isFullscreen ? 'max-w-[95vw] h-[95vh] max-h-[95vh]' : 'max-w-[700px] max-h-[90vh]'}`}>
        <div className="px-8 py-6 border-b border-[var(--bdrm)] flex justify-between items-center bg-[var(--surf)] z-10 shrink-0">
          <div><h3 className="font-serif text-[26px] font-medium text-[var(--tx)] leading-tight">{isEdit ? 'Edit Product' : 'Add New Product'}</h3><p className="text-[13px] text-[var(--tx3)] mt-1">Fields render via Liquid templates across Store, POS & Admin</p></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="w-9 h-9 rounded-full border border-[var(--bdr)] bg-[var(--surf2)] text-[var(--tx2)] hover:text-[var(--tx)] transition-all active:scale-95 flex items-center justify-center hidden md:flex">{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}</button><button type="button" onClick={onClose} className="w-9 h-9 rounded-full border border-[var(--bdr)] bg-[var(--surf2)] text-[var(--tx2)] hover:text-[var(--tx)] transition-all active:scale-95 flex items-center justify-center"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-8 flex-1 overflow-y-auto bg-[var(--bg)] md:bg-[var(--surf)]">
          <div className="bg-[var(--surf2)] border border-[var(--bdrm)] rounded-2xl p-4 mb-8 font-mono text-[11px] leading-[2] overflow-x-auto text-[var(--tx)] shadow-sm">
            <span className="text-[var(--tx3)]">{'{%- comment -%}'}</span> <span className="text-[var(--tx2)]">templates/product-card.liquid</span> <span className="text-[var(--tx3)]">{'{%- endcomment -%}'}</span><br />
            <span className="text-[var(--tx3)]">{'{% if '}</span><span className="text-[var(--acc)]">product.image</span><span className="text-[var(--tx3)]">{' %}'}</span> {'<img src="'}<span className="text-[var(--acc)]">{'{{ product.image }}'}</span>{'">'} <span className="text-[var(--tx3)]">{'{% endif %}'}</span><br />
            <span className="text-[var(--acc)]">{'{{ product.title }}'}</span> — <span className="text-[var(--acc)]">{'{{ product.price '}</span><span className="text-[var(--tx2)]">| money</span><span className="text-[var(--acc)]">{' }}'}</span> / <span className="text-[var(--acc)]">{'{{ product.weight '}</span><span className="text-[var(--tx2)]">| default: "250g"</span><span className="text-[var(--acc)]">{' }}'}</span><br />
            <span className="text-[var(--tx3)]">{'{% if '}</span><span className="text-[var(--acc)]">product.stock</span><span className="text-[var(--tx3)]">{' == 0 %}'}</span> <span className="text-[var(--grn)]">Out of stock</span> <span className="text-[var(--tx3)]">{'{% elsif '}</span><span className="text-[var(--acc)]">product.stock</span><span className="text-[var(--tx3)]">{' < 15 %}'}</span> <span className="text-[var(--amb)]">Low stock</span> <span className="text-[var(--tx3)]">{'{% endif %}'}</span><br />
            <span className="text-[var(--tx3)]">{'{% if '}</span><span className="text-[var(--acc)]">product.tag</span><span className="text-[var(--tx3)]">{' %}'}</span> {'<span class="ptag">'}<span className="text-[var(--acc)]">{'{{ product.tag }}'}</span>{'</span>'} <span className="text-[var(--tx3)]">{'{% endif %}'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start">
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)]">Product Media</label>
              <div className={`relative border-2 border-dashed border-[var(--bdrm)] rounded-[20px] bg-[var(--surf2)] transition-colors overflow-hidden flex flex-col items-center justify-center group ${form.image && !isCompressing ? 'p-0 border-solid min-h-[200px]' : 'p-6 min-h-[200px] hover:border-[var(--acc)] hover:bg-[var(--accl)] cursor-pointer'}`} onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[var(--acc)]', 'bg-[var(--accl)]'); }} onDragLeave={(e) => e.currentTarget.classList.remove('border-[var(--acc)]', 'bg-[var(--accl)]')} onDrop={handleDrop}>
                <input type="file" accept="image/*" onChange={handleFile} disabled={isCompressing} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:cursor-wait" title="Upload Image" />
                {isCompressing ? <div className="flex flex-col items-center text-[var(--acc)] pointer-events-none"><Loader2 className="w-8 h-8 animate-spin mb-3" /><span className="text-[11px] font-bold tracking-widest uppercase">Compressing</span></div> : form.image ? <><img src={form.image} className="w-full h-full absolute inset-0 object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-0 backdrop-blur-sm"><span className="text-white text-[12px] font-semibold border border-white/30 px-3 py-1.5 rounded-full">Change</span></div></> : <div className="text-center pointer-events-none flex flex-col items-center"><div className="w-10 h-10 border-2 border-dashed border-[var(--tx3)] rounded-lg mb-3 flex items-center justify-center opacity-50"><Plus className="w-5 h-5 text-[var(--tx3)]" /></div><div className="text-[13px] font-medium text-[var(--tx2)] mb-1">Upload Photo</div><div className="text-[11px] text-[var(--tx3)] leading-relaxed">Drag & drop or click</div></div>}
              </div>
              <div className="mt-2"><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Abbreviation</label><input value={form.shortName || ''} maxLength={2} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="w-16 h-16 bg-[var(--surf2)] border border-[var(--bdrm)] rounded-xl text-[20px] font-serif font-bold text-center focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all mx-auto block uppercase" placeholder="MT" /></div>
            </div>
            <div className="flex flex-col gap-5">
              <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Product Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[14px] font-medium text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="e.g. Kyoto Ceremonial Matcha" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Type</label><select value={form.type || 'Ingredient'} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] font-medium text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all appearance-none"><option value="Ingredient">Ingredient / Retail</option><option value="Drink/Snack">Made to Order (Drink/Snack)</option></select></div>
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] font-medium text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all appearance-none">{CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Price (USD)</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tx3)] font-mono">$</span><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] pl-8 pr-4 py-3 rounded-xl text-[14px] font-mono font-medium text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" /></div></div>
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Inventory Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[14px] font-mono font-medium text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all disabled:opacity-50 disabled:bg-[var(--surf3)]" disabled={form.type === 'Drink/Snack'} placeholder={form.type === 'Drink/Snack' ? 'Unlimited' : '0'} /></div>
              </div>
              <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Description</label><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all resize-none leading-relaxed" placeholder="Short description of the product..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Highlight Tag</label><input value={form.tag || ''} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="e.g. Best Seller" /></div>
                <div><label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Weight / Size</label><input value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="e.g. 250g or 1 Cup" /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-[var(--bdrm)] bg-[var(--surf)] flex gap-3 justify-end shrink-0 z-10"><button onClick={onClose} className="px-6 py-3 rounded-full font-semibold text-[13px] text-[var(--tx)] bg-[var(--surf)] border border-[var(--bdrm)] hover:bg-[var(--surf3)] active:scale-95 transition-all shadow-sm">Cancel</button><button onClick={save} disabled={loading || !form.name || isCompressing} className="px-8 py-3 rounded-full font-bold text-[13px] text-[var(--acc-tx)] bg-[var(--acc)] hover:bg-[var(--acc2)] disabled:opacity-50 active:scale-95 transition-all shadow-md flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{isEdit ? 'Save Product' : 'Create Product'}</button></div>
      </div>
    </div>
  );
}

function PosterManager({ poster, setPoster, showToast, isSidebarOpen, setIsSidebarOpen }) {
  const [draft, setDraft] = useState(() => ({
    ...DEFAULT_POSTER,
    ...poster,
    items: (poster?.items || DEFAULT_POSTER.items).map((item, index) => ({
      ...DEFAULT_POSTER.items[0],
      ...item,
      id: item.id || `poster-${index + 1}`,
    })),
  }));
  const [activePosterId, setActivePosterId] = useState(() => poster?.items?.[0]?.id || DEFAULT_POSTER.items[0].id);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    const nextDraft = {
      ...DEFAULT_POSTER,
      ...poster,
      items: (poster?.items || DEFAULT_POSTER.items).map((item, index) => ({
        ...DEFAULT_POSTER.items[0],
        ...item,
        id: item.id || `poster-${index + 1}`,
      })),
    };
    setDraft(nextDraft);
    setActivePosterId(nextDraft.items[0]?.id || DEFAULT_POSTER.items[0].id);
  }, [poster]);

  const activePoster = draft.items.find((item) => item.id === activePosterId) || draft.items[0];

  const updatePosterField = (posterId, key, value) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === posterId ? { ...item, [key]: value } : item)),
    }));
  };

  const addPoster = () => {
    const newPoster = {
      ...DEFAULT_POSTER.items[0],
      id: `poster-${Date.now()}`,
      title: `New Poster ${draft.items.length + 1}`,
      subtitle: 'Describe the campaign, drink, or seasonal launch here.',
    };
    setDraft((current) => ({ ...current, items: [...current.items, newPoster] }));
    setActivePosterId(newPoster.id);
  };

  const removePoster = (posterId) => {
    setDraft((current) => {
      const nextItems = current.items.filter((item) => item.id !== posterId);
      const safeItems = nextItems.length ? nextItems : [{ ...DEFAULT_POSTER.items[0], id: `poster-${Date.now()}` }];
      setActivePosterId(safeItems[0].id);
      return { ...current, items: safeItems };
    });
  };

  const savePosterSet = () => {
    setPoster({
      ...DEFAULT_POSTER,
      ...draft,
      intervalMs: 5000,
      items: draft.items.map((item, index) => ({
        ...DEFAULT_POSTER.items[0],
        ...item,
        id: item.id || `poster-${index + 1}`,
      })),
    });
    showToast('Poster carousel updated');
  };

  const resetPosterSet = () => {
    const nextPoster = { ...DEFAULT_POSTER, items: DEFAULT_POSTER.items.map((item) => ({ ...item })) };
    setDraft(nextPoster);
    setPoster(nextPoster);
    setActivePosterId(nextPoster.items[0].id);
    showToast('Poster carousel reset');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || !activePoster) return;

    setIsCompressing(true);
    try {
      const compressedImage = await compressImage(file, 1400, 2200, 0.88);
      updatePosterField(activePoster.id, 'image', compressedImage);
      showToast('Poster image ready');
    } catch (error) {
      console.warn(error);
      showToast('Error processing poster image');
    } finally {
      setIsCompressing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="admin-hero mb-6">
        <div>
          <div className="eyebrow">Homepage Posters</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-none text-[var(--tx)] mt-3">Poster Management</h2>
          <p className="text-[13px] md:text-[14px] text-[var(--tx2)] mt-3">These posters appear beside the homepage headline and rotate automatically every 5 seconds.</p>
        </div>
        <div className="admin-hero-badge">{draft.items.length} posters</div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] flex items-center justify-center text-[var(--tx2)] hover:text-[var(--tx)] active:scale-95 shadow-soft hidden md:flex transition-all">
            {isSidebarOpen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <div>
            <h3 className="font-serif text-[26px] md:text-[30px] font-medium text-[var(--tx)] leading-none">Poster Carousel</h3>
            <p className="text-[13px] text-[var(--tx3)] mt-1">Add more than one poster and the storefront will cycle them automatically.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={resetPosterSet} className="px-5 py-2.5 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[13px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] active:scale-95 transition-all shadow-sm">Reset</button>
          <button onClick={savePosterSet} disabled={isCompressing} className="px-5 py-2.5 rounded-full bg-[var(--tx)] text-[var(--bg)] text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all shadow-soft disabled:opacity-50">Save Carousel</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-[var(--bdr)] bg-[var(--surf)] p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)]">Poster List</div>
              <div className="text-[13px] text-[var(--tx2)] mt-1">Choose which poster to edit.</div>
            </div>
            <button onClick={addPoster} className="inline-flex items-center gap-2 rounded-full bg-[var(--acc)] px-4 py-2 text-[12px] font-semibold text-[var(--acc-tx)] hover:bg-[var(--acc2)] transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {draft.items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActivePosterId(item.id)}
                className={`w-full text-left rounded-[20px] border p-3 transition-all ${item.id === activePoster?.id ? 'border-[var(--tx)] bg-[var(--surf2)] shadow-sm' : 'border-[var(--bdr)] bg-[var(--surf)] hover:bg-[var(--surf2)]'}`}
              >
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-20 rounded-[14px] overflow-hidden bg-[var(--surf3)] shrink-0 flex items-center justify-center">
                    {item.image ? <img src={item.image} alt={item.title || `Poster ${index + 1}`} className="w-full h-full object-cover" /> : <span className="text-[11px] font-semibold text-[var(--tx3)]">No image</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--tx3)]">Poster {index + 1}</div>
                    <div className="mt-1 font-serif text-[20px] leading-none text-[var(--tx)] truncate">{item.title || `Poster ${index + 1}`}</div>
                    <div className="mt-2 text-[12px] text-[var(--tx2)] line-clamp-2">{item.subtitle || 'No description yet.'}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activePoster && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-[var(--bdr)] bg-[var(--surf)] p-6 shadow-soft">
              <div className="grid gap-5">
                <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[var(--bdrm)] bg-[var(--surf2)] px-4 py-4">
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--tx)]">Show all posters on storefront</div>
                    <div className="text-[12px] text-[var(--tx3)] mt-1">The homepage carousel rotates automatically every 5 seconds.</div>
                  </div>
                  <button onClick={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))} className={`relative h-8 w-14 rounded-full transition-all ${draft.enabled ? 'bg-[var(--grn)]' : 'bg-[var(--surf3)] border border-[var(--bdrm)]'}`}>
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${draft.enabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Eyebrow Label</label>
                  <input value={activePoster.eyebrow || ''} onChange={(e) => updatePosterField(activePoster.id, 'eyebrow', e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="Featured Poster" />
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Headline</label>
                  <input value={activePoster.title || ''} onChange={(e) => updatePosterField(activePoster.id, 'title', e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="Taro Root" />
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Description</label>
                  <textarea rows="4" value={activePoster.subtitle || ''} onChange={(e) => updatePosterField(activePoster.id, 'subtitle', e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all resize-none leading-relaxed" placeholder="Tell customers what this poster is promoting." />
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)] block mb-2">Button Label</label>
                  <input value={activePoster.ctaText || ''} onChange={(e) => updatePosterField(activePoster.id, 'ctaText', e.target.value)} className="w-full bg-[var(--surf2)] border border-[var(--bdrm)] px-4 py-3 rounded-xl text-[13px] text-[var(--tx)] focus:border-[var(--acc)] focus:bg-[var(--surf)] outline-none shadow-sm transition-all" placeholder="Shop Collection" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => updatePosterField(activePoster.id, 'image', null)} className="px-4 py-2 rounded-full border border-[var(--bdrm)] bg-[var(--surf)] text-[12px] font-semibold text-[var(--tx)] hover:bg-[var(--surf2)] active:scale-95 transition-all">Remove Image</button>
                  <button onClick={() => removePoster(activePoster.id)} className="px-4 py-2 rounded-full border border-[var(--redb)] bg-[var(--surf)] text-[12px] font-semibold text-[var(--red)] hover:bg-[var(--redb)] active:scale-95 transition-all">Delete Poster</button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--bdr)] bg-[var(--surf)] p-6 shadow-soft">
              <div className="mb-4">
                <div className="text-[11px] font-bold tracking-widest uppercase text-[var(--tx3)]">Poster Image</div>
                <p className="text-[13px] text-[var(--tx2)] mt-2">Use tall poster art. It will rotate beside the hero headline automatically.</p>
              </div>

              <div className={`relative overflow-hidden rounded-[24px] border-2 border-dashed border-[var(--bdrm)] bg-[var(--surf2)] min-h-[420px] ${activePoster.image && !isCompressing ? 'border-solid' : ''}`}>
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={isCompressing} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait" title="Upload Poster Image" />
                {isCompressing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--tx)]">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <span className="text-[11px] font-bold tracking-widest uppercase">Processing Poster</span>
                  </div>
                ) : activePoster.image ? (
                  <div className="absolute inset-0 p-4">
                    <img src={activePoster.image} alt={activePoster.title || 'Poster preview'} className="w-full h-full object-contain rounded-[18px] bg-[#f2e9dd]" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-[radial-gradient(circle_at_top_left,rgba(170,212,178,0.22),transparent_35%),linear-gradient(135deg,#172219_0%,#27372b_48%,#101712_100%)]">
                    <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center mb-4 shadow-sm">
                      <Plus className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="text-[14px] font-semibold text-white">Upload Poster Image</div>
                    <div className="text-[12px] text-white/70 mt-2">Click to choose a poster for this slide.</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={savePosterSet} disabled={isCompressing} className="px-4 py-2 rounded-full bg-[var(--acc)] text-[var(--acc-tx)] text-[12px] font-semibold hover:bg-[var(--acc2)] active:scale-95 transition-all disabled:opacity-50">Apply To Homepage</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel(props) {
  const { products, orders, setProducts, setOrders, placeOrder, darkMode, showToast, setReceiptOrder, usingBackend, API_URL, poster, setPoster } = props;
  const [tab, setTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { key: 'orders', label: 'Orders', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'pos', label: 'POS', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'products', label: 'Products', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { key: 'poster', label: 'Poster', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="admin-shell flex min-h-[calc(100vh-60px)] overflow-x-hidden animate-in fade-in duration-500 w-full max-w-[1400px] mx-auto">
      <aside className={`my-6 ml-6 bg-[var(--surf)] border border-[var(--bdr)] rounded-[20px] hidden md:flex flex-col shrink-0 transition-all duration-400 shadow-soft overflow-hidden ${isSidebarOpen ? 'w-[230px]' : 'w-0 opacity-0 -ml-6 border-0'}`}>
        <div className="p-5 pb-2">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[var(--tx3)] px-3 mb-3">Analytics</div>
          <div className="space-y-0.5">
            <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${tab === 'dashboard' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md' : 'text-[var(--tx3)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'}`}><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</button>
            <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${tab === 'orders' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md' : 'text-[var(--tx3)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'}`}><Package className="w-3.5 h-3.5" /> Orders</button>
          </div>
        </div>
        <div className="p-5 pt-4 border-t border-[var(--bdr)] mt-2">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[var(--tx3)] px-3 mb-3">Commerce</div>
          <div className="space-y-0.5">
            <button onClick={() => setTab('pos')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${tab === 'pos' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md' : 'text-[var(--tx3)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'}`}><CreditCard className="w-3.5 h-3.5" /> Point of Sale</button>
            <button onClick={() => setTab('products')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${tab === 'products' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md' : 'text-[var(--tx3)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'}`}><ShoppingBag className="w-3.5 h-3.5" /> Products</button>
            <button onClick={() => setTab('poster')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${tab === 'poster' ? 'bg-[var(--tx)] text-[var(--bg)] shadow-md' : 'text-[var(--tx3)] hover:bg-[var(--surf2)] hover:text-[var(--tx)]'}`}><FileText className="w-3.5 h-3.5" /> Poster</button>
          </div>
        </div>
        <div className="mt-auto p-5 border-t border-[var(--bdr)] bg-[var(--surf2)]">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[var(--acc)] text-[var(--acc-tx)] flex items-center justify-center font-serif text-[15px] font-semibold shrink-0">C</div><div><div className="text-[12px] font-semibold leading-tight text-[var(--tx)]">Chazen Admin</div><div className="text-[10px] text-[var(--tx3)] flex items-center gap-1 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full ${usingBackend ? 'bg-[var(--grn)]' : 'bg-[var(--amb)]'}`} />{usingBackend ? 'Live (DB)' : 'Local Memory'}</div></div></div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="admin-mobile-tabs md:hidden mb-5">{navItems.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`admin-mobile-tab ${tab === item.key ? 'active' : ''}`}>{item.icon}<span>{item.label}</span></button>)}</div>
        {tab === 'dashboard' && <DashboardView orders={orders} darkMode={darkMode} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} showToast={showToast} />}
        {tab === 'pos' && <POSTerminal products={products} placeOrder={placeOrder} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
        {tab === 'orders' && <OrderManager orders={orders} setOrders={setOrders} setProducts={setProducts} showToast={showToast} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} setReceiptOrder={setReceiptOrder} usingBackend={usingBackend} API_URL={API_URL} />}
        {tab === 'products' && <ProductManager products={products} setProducts={setProducts} showToast={showToast} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} usingBackend={usingBackend} API_URL={API_URL} />}
        {tab === 'poster' && <PosterManager poster={poster} setPoster={setPoster} showToast={showToast} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
      </main>
    </div>
  );
}
