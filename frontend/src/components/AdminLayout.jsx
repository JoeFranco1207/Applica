import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    document.body.style.backgroundColor = '#eef2f8';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
    }
  }, [navigate, user]);

  const links = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Moderation', path: '/admin/moderation' },
    { label: 'Employers', path: '/admin/employers' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Subscribers', path: '/admin/subscriptions' },
    { label: 'Notifications', path: '/admin/notifications' },
    { label: 'Maintenance', path: '/admin/maintenance' },
    { label: 'Admin Team', path: '/admin/team' },
  ];

  return (
    <div style={outerStyle}>
      <aside style={sidebarStyle}>
        <div style={brandBlockStyle}>
          <div style={sidebarLogoStyle}>Applica</div>
          <div style={sidebarTextStyle}>Admin Panel</div>
        </div>

        <div style={navGroupStyle}>
          <div style={navGroupTitleStyle}>MAIN</div>
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  ...navButtonStyle,
                  ...(active ? navButtonActiveStyle : {}),
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div style={sidebarFooterStyle}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Admin</div>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>{user?.email || 'admin@applica.local'}</div>
        </div>
      </aside>

      <section style={contentStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={dashboardTitleStyle}>Admin Dashboard</div>
            <div style={dashboardSubtitleStyle}>Manage moderation and employer approvals from one place.</div>
          </div>
          <div style={topActionsStyle}>
            <button style={topActionButtonStyle}>Reports</button>
            <button style={topActionButtonStyle}>Settings</button>
          </div>
        </div>

        <div style={mainContentStyle}>
          <Outlet />
        </div>
      </section>
    </div>
  );
}

const outerStyle = {
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  background: '#eef2f8',
};

const sidebarStyle = {
  width: 240,
  minHeight: '100vh',
  padding: '32px 24px',
  background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
  color: '#d1d5db',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRight: '1px solid rgba(148, 163, 184, 0.18)',
  overflowY: 'auto',
};

const brandBlockStyle = {
  marginBottom: 34,
};

const sidebarLogoStyle = {
  color: '#60a5fa',
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: '0.08em',
};

const sidebarTextStyle = {
  marginTop: 8,
  color: '#94a3b8',
  letterSpacing: '0.08em',
  fontSize: 11,
  textTransform: 'uppercase',
};

const navGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const navGroupTitleStyle = {
  marginBottom: 12,
  color: '#94a3b8',
  fontSize: 12,
  letterSpacing: '0.08em',
};

const navButtonStyle = {
  width: '100%',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  color: '#cbd5e1',
  padding: '14px 18px',
  borderRadius: 14,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 600,
  transition: 'all 0.2s ease',
};

const navButtonActiveStyle = {
  background: 'rgba(96, 165, 250, 0.12)',
  color: '#ffffff',
  borderLeft: '4px solid #60a5fa',
};

const sidebarFooterStyle = {
  marginTop: 30,
  padding: '18px 18px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const contentStyle = {
  flex: 1,
  padding: 28,
};

const topBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 28,
  padding: '24px 28px',
  borderRadius: 24,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
};

const dashboardTitleStyle = {
  fontSize: 28,
  fontWeight: 700,
  color: '#0f172a',
};

const dashboardSubtitleStyle = {
  marginTop: 8,
  color: '#64748b',
  fontSize: 14,
};

const topActionsStyle = {
  display: 'flex',
  gap: 12,
};

const topActionButtonStyle = {
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  color: '#0f172a',
  padding: '10px 18px',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
};

const mainContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};
