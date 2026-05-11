/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  JUKUMU Super Admin — jukumu-admin/src/App.jsx                          ║
 * ║  Run:  npm create vite@latest jukumu-admin -- --template react          ║
 * ║        cd jukumu-admin && npm install axios && npm run dev              ║
 * ║  Port: 3001  (set in vite.config.js: server: { port: 3001 })           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from 'react';

// ─── API layer ────────────────────────────────────────────────────────────────
const BASE = {
  auth:         import.meta.env.VITE_AUTH_URL         || 'http://localhost:9081',
  members:      import.meta.env.VITE_MEMBERS_URL      || 'http://localhost:9087',
  reports:      import.meta.env.VITE_REPORTS_URL      || 'http://localhost:9088',
  expense:      import.meta.env.VITE_EXPENSE_URL      || 'http://localhost:9084',
  income:       import.meta.env.VITE_INCOME_URL       || 'http://localhost:9083',
  notification: import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:9085',
};
  //auth:         'http://localhost:9081',
  //members:      'http://localhost:9087',
  //reports:      'http://localhost:9088',
 // expense:      'http://localhost:9084',
  //income:       'http://localhost:9083',
  //: 'http://localhost:9085',
//};

async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API error ${url}:`, e.message);
    return null;
  }
}

function mapOrgToTenant(org) {
  return {
    organizationId: org.organizationId,
    name:           org.organizationName,
    county:         org.county       || '—',
    tier:           org.tier         || 'BASIC',
    status:         org.isActive === false ? 'SUSPENDED' : 'ACTIVE',
    joinedDate:     org.createdAt ? org.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    type:           org.type,
    contactEmail:   org.contactEmail,
    accountPrefix:  org.accountPrefix,
    paybill:        org.accountPrefix ? '4188463' : null,
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  teal: '#0F6E56', tealMid: '#1D9E75', tealLight: '#E1F5EE',
  amber: '#BA7517', amberLight: '#FAEEDA',
  red: '#A32D2D', redLight: '#FCEBEB',
  blue: '#185FA5', blueLight: '#E6F1FB',
  gray: '#5F5E5A', grayLight: '#F1EFE8', grayDark: '#2C2C2A',
  border: 'rgba(0,0,0,0.1)', borderStrong: 'rgba(0,0,0,0.16)',
  bg: '#F7F6F2', surface: '#fff',
  text: '#2C2C2A', textMuted: '#888780',
};

const css = {
  card:    { background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: 14 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  primary: { background: T.teal, color: '#fff' },
  ghost:   { background: T.surface, color: T.text, border: `0.5px solid ${T.borderStrong}` },
  input:   { width: '100%', padding: '9px 12px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? '—' : `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const avatarColor = (id) => {
  const colors    = [T.tealLight, T.blueLight, T.amberLight, T.redLight, T.grayLight];
  const textColors = [T.teal, T.blue, T.amber, T.red, T.gray];
  const i = id.charCodeAt(id.length - 1) % colors.length;
  return { bg: colors[i], text: textColors[i] };
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status, tier }) {
  const configs = {
    ACTIVE:    { bg: T.tealLight,  color: T.teal,  label: 'Active' },
    FLAGGED:   { bg: T.amberLight, color: T.amber, label: '⚠ Flagged' },
    SETUP:     { bg: T.blueLight,  color: T.blue,  label: 'Setting up' },
    SUSPENDED: { bg: T.redLight,   color: T.red,   label: 'Suspended' },
    PREMIUM:   { bg: T.tealLight,  color: T.teal,  label: '★ Premium' },
    BASIC:     { bg: T.grayLight,  color: T.gray,  label: 'Basic' },
  };
  const cfg = configs[status || tier] || { bg: T.grayLight, color: T.gray, label: status || tier };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const items = [
    { id: 'tenants',  label: 'Tenants',   icon: '🏢' },
    { id: 'waitlist', label: 'Enquiries',  icon: '📋' },
  ];
  return (
    <aside style={{ width: 220, background: T.grayDark, padding: '20px 12px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, background: T.teal, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>J</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>JUKUMU</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Super Admin</div>
        </div>
      </div>
      {items.map(item => (
        <div key={item.id} onClick={() => setPage(item.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 2, background: page === item.id ? T.teal : 'transparent', color: page === item.id ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: page === item.id ? 500 : 400, transition: 'all 0.15s' }}>
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          {item.label}
        </div>
      ))}
      <div style={{ marginTop: 'auto', padding: '12px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>JUKUMU Admin</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>v1.0 · localhost:3001</div>
      </div>
    </aside>
  );
}

// ─── Add Tenant Modal ─────────────────────────────────────────────────────────
const COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Kiambu','Uasin Gishu','Machakos',
  'Kilifi','Meru','Nyeri','Kakamega','Bungoma','Kisii','Migori','Siaya',
  'Homa Bay','Kwale','Taita Taveta','Kitui','Makueni','Kajiado','Muranga',
  'Kirinyaga','Laikipia','Nyandarua','Embu','Tharaka Nithi','Isiolo','Marsabit',
  'Garissa','Wajir','Mandera','Turkana','West Pokot','Samburu','Trans Nzoia',
  'Elgeyo Marakwet','Nandi','Baringo','Bomet','Kericho','Narok','Vihiga',
  'Busia','Lamu','Tana River',
];

function AddTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', type: 'CBO', contactEmail: '', county: 'Nairobi', tier: 'BASIC' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Organisation name is required'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${BASE.auth}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, type: form.type, contactEmail: form.contactEmail, county: form.county, tier: form.tier }),
      });
      if (!res.ok) throw new Error(await res.text() || `Server error ${res.status}`);
      onCreated(mapOrgToTenant(await res.json()));
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const field = (label, children) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 460, background: T.surface, borderRadius: 14, zIndex: 301, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add New Organisation</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.textMuted }}>×</button>
        </div>
        <div style={{ padding: 22 }}>
          {field('Organisation Name *', <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. CityCLEAN CBO" style={css.input} />)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Type',
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...css.input, padding: '8px 10px' }}>
                <option value="CBO">CBO</option><option value="SACCO">SACCO</option>
                <option value="CHAMA">Chama</option><option value="NGO">NGO</option><option value="CHURCH">Church</option>
              </select>
            )}
            {field('Tier',
              <select value={form.tier} onChange={e => set('tier', e.target.value)} style={{ ...css.input, padding: '8px 10px' }}>
                <option value="BASIC">Basic</option><option value="PREMIUM">Premium</option>
              </select>
            )}
          </div>
          {field('County',
            <select value={form.county} onChange={e => set('county', e.target.value)} style={{ ...css.input, padding: '8px 10px' }}>
              {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {field('Contact Email', <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="treasurer@cbo.org" type="email" style={css.input} />)}
          <div style={{ background: T.tealLight, border: `0.5px solid ${T.teal}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: T.teal, lineHeight: 1.6 }}>
            <strong>M-Pesa:</strong> A unique account prefix will be auto-assigned (e.g. prefix <strong>3</strong> → Paybill <strong>4188463</strong>, Account <strong>3-[MemberID]</strong>).
          </div>
          {error && <div style={{ background: T.redLight, color: T.red, padding: '8px 12px', borderRadius: 7, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...css.btn, ...css.ghost, flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...css.btn, ...css.primary, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Organisation'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
// ─── Invite Staff Member Modal ────────────────────────────────────────────────
function InviteStaffModal({ tenant, onClose, onInvited }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '', password: '', role: 'TREASURER'
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit() {
    if (!form.firstName.trim()) { setError('First name is required'); return; }
    if (!form.email.trim())     { setError('Email is required'); return; }
    if (!form.username.trim())  { setError('Username is required'); return; }
    if (!form.password.trim())  { setError('Password is required'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${BASE.auth}/organizations/${tenant.organizationId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
      onInvited();
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const field = (label, children) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 440, background: T.surface, borderRadius: 14, zIndex: 401, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Invite Staff Member</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{tenant.name} · {tenant.organizationId}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.textMuted }}>×</button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('First Name *', <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Jane" style={css.input} />)}
            {field('Last Name',    <input value={form.lastName}  onChange={e => set('lastName',  e.target.value)} placeholder="e.g. Wanjiru" style={css.input} />)}
          </div>
          {field('Email *', <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@cbo.org" type="email" style={css.input} />)}
          {field('Username *', <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. jane.wanjiru" style={css.input} />)}
          {field('Temporary Password *', <input value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" type="password" style={css.input} />)}
          {field('Role',
            <select value={form.role} onChange={e => set('role', e.target.value)} style={{ ...css.input, padding: '8px 10px' }}>
              <option value="TREASURER">Treasurer</option>
              <option value="CHAIRPERSON">Chairperson</option>
              <option value="SECRETARY">Secretary</option>
            </select>
          )}
          <div style={{ background: T.tealLight, border: `0.5px solid ${T.teal}`, borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 12, color: T.teal, lineHeight: 1.6 }}>
            The staff member will use these credentials to log in to the JUKUMU treasurer PWA.
          </div>
          {error && <div style={{ background: T.redLight, color: T.red, padding: '8px 12px', borderRadius: 7, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...css.btn, ...css.ghost, flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...css.btn, ...css.primary, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
// ─── Tenant Drawer ────────────────────────────────────────────────────────────
function TenantDrawer({ tenant, onClose, onSave }) {
  const [summary, setSummary] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTier, setEditTier] = useState(tenant.tier);
  const [editStatus, setEditStatus] = useState(tenant.status);
  // Helper to reload members after invite:
  const reloadMembers = async () => {
    const m = await apiFetch(`${BASE.members}/api/v1/members?organizationId=${tenant.organizationId}&page=0&size=5`);
    setMembers(m?.content || m?.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now  = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to   = now.toISOString().slice(0, 10);
      const [s, m] = await Promise.all([
        apiFetch(`${BASE.reports}/api/v1/reports/summary?organizationId=${tenant.organizationId}&from=${from}&to=${to}`),
        apiFetch(`${BASE.members}/api/v1/members?organizationId=${tenant.organizationId}&page=0&size=5`),
      ]);
      setSummary(s);
      setMembers(m?.content || m?.data || []);
      setLoading(false);
    })();
  }, [tenant.organizationId]);

  const av = avatarColor(tenant.organizationId);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 500, background: T.surface, zIndex: 201, overflow: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: av.text }}>{initials(tenant.name)}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{tenant.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>{tenant.organizationId} · {tenant.county}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.textMuted, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...css.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Account Settings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>Subscription Tier</label>
                <select value={editTier} onChange={e => setEditTier(e.target.value)} style={{ ...css.input, padding: '7px 10px' }}>
                  <option value="BASIC">Basic</option><option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.textMuted, display: 'block', marginBottom: 4 }}>Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...css.input, padding: '7px 10px' }}>
                  <option value="ACTIVE">Active</option><option value="SETUP">Setting Up</option>
                  <option value="FLAGGED">Flagged</option><option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
            <button onClick={() => onSave(tenant.organizationId, editTier, editStatus)} style={{ ...css.btn, ...css.primary, width: '100%', justifyContent: 'center', padding: 10 }}>Save Changes</button>
          </div>

          <div style={{ ...css.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Organisation Details</div>
            {[
              ['County', tenant.county],
              ['M-Pesa Paybill', tenant.paybill || 'Not configured'],
              ['Joined', new Date(tenant.joinedDate).toLocaleDateString('en-KE', { dateStyle: 'medium' })],
              ['Tier', null], ['Status', null],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.textMuted }}>{k}</span>
                {v ? <span style={{ fontWeight: 500 }}>{v}</span> : k === 'Tier' ? <Badge tier={editTier} /> : <Badge status={editStatus} />}
              </div>
            ))}
          </div>

          <div style={{ ...css.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Financial Summary (Current Month)
              {loading && <span style={{ marginLeft: 8, fontSize: 11, color: T.textMuted }}>Loading…</span>}
            </div>
            {summary ? [
              ['Total Income',     fmt(summary.totalIncome),     T.tealMid],
              ['Total Expenses',   fmt(summary.totalExpenses),   '#D85A30'],
              ['Net Balance',      fmt(summary.netBalance),      Number(summary.netBalance) >= 0 ? T.teal : T.red],
              ['WHT Deducted',     fmt(summary.whtDeducted),     T.amber],
              ['Pending Expenses', fmt(summary.pendingExpenses), T.gray],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.textMuted }}>{k}</span>
                <span style={{ fontWeight: 600, color: c }}>{v}</span>
              </div>
            )) : !loading && <div style={{ fontSize: 13, color: T.textMuted }}>Could not load — reports-service may be offline</div>}
          </div>

          <div style={{ ...css.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Staff Members
              {loading && <span style={{ marginLeft: 8, fontSize: 11, color: T.textMuted }}>Loading…</span>}
            </div>
            {members.length > 0 ? members.slice(0, 5).map((m, i) => {
              const mav = avatarColor(String(m.id || i));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `0.5px solid ${T.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: mav.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: mav.text, flexShrink: 0 }}>
                    {initials(`${m.firstName || 'U'} ${m.lastName || 'K'}`)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{m.role || 'Member'} · {m.phoneNumber || '—'}</div>
                  </div>
                  <Badge status={m.status || 'ACTIVE'} />
                </div>
              );
            }) : !loading && <div style={{ fontSize: 13, color: T.textMuted }}>No members found or members-service offline</div>}
          </div>

          <div style={{ ...css.card, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>M-Pesa Configuration</div>
            <div style={{ background: T.tealLight, borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.7 }}>
              {[
                ['Paybill Number', '4188463'],
                ['Account Prefix', tenant.accountPrefix || null],
                ['Account Format', tenant.accountPrefix ? `${tenant.accountPrefix}-[MemberID]` : null],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `0.5px solid rgba(15,110,86,0.15)` }}>
                  <span style={{ color: T.textMuted }}>{k}</span>
                  {v
                    ? <span style={{ fontFamily: 'monospace', fontWeight: 600, color: T.teal }}>{v}</span>
                    : <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Not assigned</span>}
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 11, color: T.teal }}>
                Members pay to Paybill <strong>4188463</strong>, Account <strong>{tenant.accountPrefix ? `${tenant.accountPrefix}-042` : '?-042'}</strong> (example for member 042).
              </div>
            </div>
          </div>

         <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowInvite(true)}
            style={{ ...css.btn, ...css.primary, flex: 1, justifyContent: 'center' }}>
            Invite Staff Member
          </button>
          <button
            onClick={() => alert(`Paybill: 4188463\nPrefix: ${tenant.accountPrefix || 'Not set'}\nFormat: ${tenant.accountPrefix}-[MemberID]`)}
            style={{ ...css.btn, ...css.ghost }}>
            Configure M-Pesa
          </button>
        </div>

        {showInvite && (
          <InviteStaffModal
            tenant={tenant}
            onClose={() => setShowInvite(false)}
            onInvited={reloadMembers}
          />
        )}
          </div>
        </div>
      </>
  );
}

// ─── Tenants Page ─────────────────────────────────────────────────────────────
function TenantsPage() {
  const [tenants,      setTenants]      = useState([]);
  const [loadingOrgs,  setLoadingOrgs]  = useState(true);
  const [orgsError,    setOrgsError]    = useState(null);
  const [search,       setSearch]       = useState('');
  const [tierFilter,   setTierFilter]   = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected,     setSelected]     = useState(null);
  const [summaries,    setSummaries]    = useState({});
  const [showModal,    setShowModal]    = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingOrgs(true); setOrgsError(null);
      try {
        const res = await fetch(`${BASE.auth}/organizations`);
        if (!res.ok) throw new Error(`Auth-service ${res.status}`);
        const data = await res.json();
        setTenants((Array.isArray(data) ? data : (data.content || data.data || [])).map(mapOrgToTenant));
      } catch (e) { setOrgsError(e.message); }
      finally { setLoadingOrgs(false); }
    })();
  }, []);

  useEffect(() => {
    if (tenants.length === 0) return;
    tenants.forEach(async (t) => {
      const now  = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to   = now.toISOString().slice(0, 10);
      const s = await apiFetch(`${BASE.reports}/api/v1/reports/summary?organizationId=${t.organizationId}&from=${from}&to=${to}`);
      if (s) setSummaries(prev => ({ ...prev, [t.organizationId]: s }));
    });
  }, [tenants]);

  
  const handleSave = async (orgId, tier, status) => {
  const res = await fetch(`${BASE.auth}/organizations/${orgId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier,
      isActive: status !== 'SUSPENDED',
    }),
  });
  if (res.ok) {
    setTenants(prev => prev.map(t => t.organizationId === orgId ? { ...t, tier, status } : t));
    setSelected(prev => prev ? { ...prev, tier, status } : null);
  } else {
    alert('Save failed — check auth-service logs');
  }
};  

  if (loadingOrgs) return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 14, color: T.textMuted }}>Loading tenants…</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Connecting to auth-service · port 9081</div>
      </div>
    </div>
  );

  if (orgsError) return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh' }}>
      <div style={{ ...css.card, padding: 24, background: T.redLight, border: `1px solid ${T.red}`, maxWidth: 520 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.red, marginBottom: 6 }}>⚠ Failed to load tenants</div>
        <div style={{ fontSize: 13, color: T.red, marginBottom: 14, fontFamily: 'monospace' }}>{orgsError}</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
          Ensure <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>auth-service</code> is running on port 9081 and CORS allows <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>localhost:3001</code>.
        </div>
        <button onClick={() => window.location.reload()} style={{ ...css.btn, ...css.primary }}>↺ Retry</button>
      </div>
    </div>
  );

  const filtered = tenants.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.organizationId.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (tierFilter === 'ALL' || t.tier === tierFilter) && (statusFilter === 'ALL' || t.status === statusFilter);
  });

  const stats = {
    total:   tenants.length,
    active:  tenants.filter(t => t.status === 'ACTIVE').length,
    premium: tenants.filter(t => t.tier === 'PREMIUM').length,
    flagged: tenants.filter(t => t.status === 'FLAGGED').length,
  };

  return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Tenant Management</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '3px 0 0' }}>All CBOs using JUKUMU · live from auth-service</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...css.btn, ...css.primary }}>+ Add Tenant</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[['Total Tenants', stats.total, T.text], ['Active', stats.active, T.teal], ['Premium', stats.premium, T.amber], ['Flagged', stats.flagged, T.red]].map(([label, value, color]) => (
          <div key={label} style={{ ...css.card, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…" style={{ ...css.input, width: 220 }} />
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: '9px 10px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, background: T.surface, outline: 'none' }}>
          <option value="ALL">All Tiers</option><option value="BASIC">Basic</option><option value="PREMIUM">Premium</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 10px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, background: T.surface, outline: 'none' }}>
          <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="SETUP">Setting Up</option>
          <option value="FLAGGED">Flagged</option><option value="SUSPENDED">Suspended</option>
        </select>
        <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 'auto' }}>{filtered.length} of {tenants.length} tenants</span>
      </div>

      <div style={{ ...css.card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: T.grayLight }}>
              {['Organisation','County','M-Pesa Paybill','This Month Income','This Month Expenses','Tier','Status',''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `0.5px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(tenant => {
              const av  = avatarColor(tenant.organizationId);
              const sum = summaries[tenant.organizationId];
              return (
                <tr key={tenant.organizationId} style={{ borderBottom: `0.5px solid ${T.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.grayLight}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: av.text, flexShrink: 0 }}>{initials(tenant.name)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tenant.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{tenant.organizationId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{tenant.county}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>
                    {tenant.paybill
                      ? <span style={{ fontFamily: 'monospace', fontSize: 13, background: T.grayLight, padding: '2px 7px', borderRadius: 4 }}>{tenant.paybill}</span>
                      : <span style={{ color: T.textMuted, fontSize: 12 }}>Not set</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: T.teal, fontWeight: sum ? 500 : 400 }}>{sum ? fmt(sum.totalIncome) : <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#D85A30', fontWeight: sum ? 500 : 400 }}>{sum ? fmt(sum.totalExpenses) : <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={{ padding: '12px 14px' }}><Badge tier={tenant.tier} /></td>
                  <td style={{ padding: '12px 14px' }}><Badge status={tenant.status} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelected(tenant)} style={{ ...css.btn, ...css.ghost, padding: '4px 10px', fontSize: 12 }}>View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>No tenants match your filters</div>}
      </div>

      {selected  && <TenantDrawer tenant={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
      {showModal && <AddTenantModal onClose={() => setShowModal(false)} onCreated={t => setTenants(prev => [t, ...prev])} />}
    </div>
  );
}

// ─── Send Message Modal ───────────────────────────────────────────────────────
function SendMessageModal({ entry, onClose, onSent }) {
  const [channel, setChannel] = useState(entry.email ? 'email' : 'sms');
  const [message, setMessage] = useState(
    `Hello ${entry.cboName}, thank you for your interest in JUKUMU! Our team will contact you within 1–2 working days to get your CBO set up on the platform.\n\n— The JUKUMU Team`
  );
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const hasSms   = entry.phoneNumber && entry.phoneNumber.trim() !== '';
  const hasEmail = entry.email && entry.email.trim() !== '';
  const charCount = message.length;
  const smsParts  = Math.ceil(charCount / 160);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`${BASE.notification}/api/v1/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: channel === 'email' ? entry.email : entry.phoneNumber,
          message,
          type: channel.toUpperCase(),
          organizationId: null,
        }),
     });

     if (!res.ok) {
      const err = await res.text();
      throw new Error(`Send failed (${res.status}): ${err}`);
    }

      await fetch(`${BASE.notification}/api/notifications/enquiries/${entry.id}/status`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
        status: 'CONTACTED',
        adminNotes: `Sent ${channel.toUpperCase()} on ${new Date().toLocaleDateString('en-KE')}`,
      }),
    });

    setSent(true);
    onSent(entry.id);
  } catch (e) {
    alert('Could not send: ' + e.message);
  } finally {
    setSending(false);
  }
}

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 480, background: T.surface, borderRadius: 14, zIndex: 401, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: T.teal }}>
              {initials(entry.cboName)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{entry.cboName}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {hasSms && `📱 ${entry.phoneNumber}`}{hasSms && hasEmail && ' · '}{hasEmail && `📧 ${entry.email}`}{entry.county && ` · ${entry.county}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMuted, lineHeight: 1 }}>×</button>
        </div>

        {!sent ? (
          <div style={{ padding: 18 }}>
            {/* Channel selector */}
            <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 6 }}>Channel</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {hasSms && (
                <div onClick={() => setChannel('sms')}
                  style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, border: `0.5px solid ${channel === 'sms' ? T.tealMid : T.borderStrong}`, background: channel === 'sms' ? T.tealLight : T.surface, color: channel === 'sms' ? T.teal : T.textMuted, fontSize: 13, fontWeight: channel === 'sms' ? 500 : 400, cursor: 'pointer' }}>
                  📱 SMS
                </div>
              )}
              {hasEmail && (
                <div onClick={() => setChannel('email')}
                  style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, border: `0.5px solid ${channel === 'email' ? T.blue : T.borderStrong}`, background: channel === 'email' ? T.blueLight : T.surface, color: channel === 'email' ? T.blue : T.textMuted, fontSize: 13, fontWeight: channel === 'email' ? 500 : 400, cursor: 'pointer' }}>
                  📧 Email
                </div>
              )}
            </div>

            {/* Message */}
            <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginBottom: 6 }}>Message</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: '10px 12px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: T.text, background: T.surface, resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.55 }}
            />
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'right', marginTop: 3 }}>
              {channel === 'sms' ? `${charCount} chars${smsParts > 1 ? ` — ${smsParts} parts` : ''}` : `${charCount} chars`}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={onClose} style={{ ...css.btn, ...css.ghost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending || !message.trim()}
                style={{ ...css.btn, ...css.primary, flex: 1, justifyContent: 'center', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending…' : `Send ${channel === 'sms' ? 'SMS' : 'Email'}`}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 12px', color: T.teal }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              {channel === 'sms' ? 'SMS sent' : 'Email sent'}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
              {channel === 'sms'
                ? `Message sent to ${entry.phoneNumber}. ${entry.cboName} status updated to Contacted.`
                : `Email delivered to ${entry.email}. ${entry.cboName} status updated to Contacted.`}
            </div>
            <button onClick={onClose} style={{ ...css.btn, ...css.primary, padding: '10px 28px' }}>Done</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Waitlist / Enquiries Page ────────────────────────────────────────────────
function WaitlistPage() {
  const [entries,      setEntries]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [composing,    setComposing]    = useState(null);

  async function loadEnquiries() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE.notification}/api/notifications/enquiries`);
      if (!res.ok) throw new Error(`notification-service ${res.status}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : (data.data || data.content || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEnquiries(); }, []);

  async function updateStatus(id, status, adminNotes) {
    try {
      const res = await fetch(`${BASE.notification}/api/notifications/enquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: adminNotes || null }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const data = await res.json();
      setEntries(prev => prev.map(e => e.id === id ? (data.data || data) : e));
    } catch (e) {
      alert('Could not update status: ' + e.message);
    }
  }

  if (loading) return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 14, color: T.textMuted }}>Loading enquiries…</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Connecting to notification-service · port 9085</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh' }}>
      <div style={{ ...css.card, padding: 24, background: T.redLight, border: `1px solid ${T.red}`, maxWidth: 520 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.red, marginBottom: 6 }}>⚠ Failed to load enquiries</div>
        <div style={{ fontSize: 13, color: T.red, marginBottom: 14, fontFamily: 'monospace' }}>{error}</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
          Ensure <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>notification-service</code> is running on port 9085 and CORS allows <code style={{ background: '#fff', padding: '1px 5px', borderRadius: 3 }}>localhost:3001</code>.
        </div>
        <button onClick={loadEnquiries} style={{ ...css.btn, ...css.primary }}>↺ Retry</button>
      </div>
    </div>
  );

  const statusConfig = {
    PENDING:   { bg: T.blueLight,  color: T.blue,  label: 'Pending' },
    CONTACTED: { bg: T.amberLight, color: T.amber, label: 'Contacted' },
    ONBOARDED: { bg: T.tealLight,  color: T.teal,  label: 'Onboarded' },
  };

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.cboName.toLowerCase().includes(search.toLowerCase()) || (e.county || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'ALL' || e.status === statusFilter);
  });

  const stats = {
    total:     entries.length,
    pending:   entries.filter(e => e.status === 'PENDING').length,
    contacted: entries.filter(e => e.status === 'CONTACTED').length,
    onboarded: entries.filter(e => e.status === 'ONBOARDED').length,
  };

  return (
    <div style={{ padding: 28, background: T.bg, minHeight: '100vh' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>CBO Enquiries</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '3px 0 0' }}>Organizations that submitted interest via the JUKUMU landing page</p>
        </div>
        <button onClick={loadEnquiries} style={{ ...css.btn, ...css.ghost }}>↺ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[['Total Enquiries', stats.total, T.text], ['Pending', stats.pending, T.blue], ['Contacted', stats.contacted, T.amber], ['Onboarded', stats.onboarded, T.teal]].map(([label, value, color]) => (
          <div key={label} style={{ ...css.card, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by CBO name or county…" style={{ ...css.input, width: 240 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 10px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, background: T.surface, outline: 'none' }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ONBOARDED">Onboarded</option>
        </select>
        <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 'auto' }}>{filtered.length} enquiries</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(entry => {
          const sc       = statusConfig[entry.status] || statusConfig.PENDING;
          const hasEmail = entry.email && entry.email.trim() !== '';
          const hasPhone = entry.phoneNumber && entry.phoneNumber.trim() !== '';

          return (
            <div key={entry.id} style={{ ...css.card, padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.teal, flexShrink: 0 }}>
                    {initials(entry.cboName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{entry.cboName}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{entry.county || 'County not provided'}</div>
                  </div>
                  <span style={{ display: 'inline-flex', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, marginLeft: 4 }}>{sc.label}</span>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.textMuted, marginBottom: entry.adminNotes ? 8 : 0 }}>
                  {hasPhone && <span>📱 {entry.phoneNumber}</span>}
                  {hasEmail && <span>📧 {entry.email}</span>}
                  {!hasPhone && !hasEmail && <span style={{ color: T.red }}>No contact provided</span>}
                  <span>🗓 {entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—'}</span>
                  {entry.contactedAt && <span style={{ color: T.amber }}>Contacted: {new Date(entry.contactedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>}
                </div>

                {entry.adminNotes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: T.gray, background: T.grayLight, padding: '5px 10px', borderRadius: 6, fontStyle: 'italic' }}>
                    Note: {entry.adminNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', minWidth: 130 }}>
                {entry.status !== 'ONBOARDED' && (hasEmail || hasPhone) && (
                  <button onClick={() => setComposing(entry)} style={{ ...css.btn, ...css.primary, padding: '6px 12px', fontSize: 12 }}>
                    ✉ Send message
                  </button>
                )}
                {entry.status !== 'ONBOARDED' && (
                  <button onClick={() => updateStatus(entry.id, 'ONBOARDED', 'Manually marked as onboarded')} style={{ ...css.btn, ...css.ghost, padding: '6px 12px', fontSize: 12 }}>
                    Onboard →
                  </button>
                )}
                {entry.status === 'ONBOARDED' && (
                  <span style={{ fontSize: 12, color: T.teal, fontWeight: 500 }}>✓ Onboarded</span>
                )}
                <select value={entry.status} onChange={e => updateStatus(entry.id, e.target.value, null)}
                  style={{ padding: '5px 8px', border: `0.5px solid ${T.borderStrong}`, borderRadius: 6, fontFamily: 'inherit', fontSize: 11, background: T.surface, outline: 'none', color: T.textMuted }}>
                  <option value="PENDING">Pending</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="ONBOARDED">Onboarded</option>
                </select>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div style={{ ...css.card, padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
            {entries.length === 0 ? 'No enquiries yet — share the landing page to start receiving them.' : 'No enquiries match your search.'}
          </div>
        )}
      </div>

      {composing && (
        <SendMessageModal
          entry={composing}
          onClose={() => setComposing(null)}
          onSent={(id) => {
            setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'CONTACTED' } : e));
            setComposing(null);
          }}
        />
      )}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('tenants');
  return (
    <div style={{ display: 'flex', fontFamily: "'DM Sans', Arial, sans-serif", minHeight: '100vh' }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {page === 'tenants'  && <TenantsPage />}
        {page === 'waitlist' && <WaitlistPage />}
      </div>
    </div>
  );
}
