import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PERMISSIONS = [
  'EMPLOYER_APPROVE',
  'EMPLOYER_REJECT',
  'EMPLOYER_VIEW_ALL',
  'EMPLOYER_DELETE',
];

export default function Team() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') {
      navigate('/auth');
    }
  }, [token, admin, navigate]);

  useEffect(() => {
    if (!token || admin?.role !== 'admin') return;
    fetchAdmins();
  }, [token, admin?.role]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data.data || []);
    } catch (err) {
      console.error(err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (adminId, permission) => {
    const adminToUpdate = admins.find((item) => item._id === adminId);
    if (!adminToUpdate) return;
    const nextPermissions = adminToUpdate.permissions.includes(permission)
      ? adminToUpdate.permissions.filter((item) => item !== permission)
      : [...adminToUpdate.permissions, permission];

    try {
      await axios.patch(
        `http://localhost:8000/api/admin/admins/${adminId}/permissions`,
        { permissions: nextPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert('Failed to update admin permissions.');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Admin Team</h1>
          <p style={subtitleStyle}>Manage admin users and permission sets for Applica moderation and employer workflows.</p>
        </div>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>Loading admin users...</div>
      ) : admins.length === 0 ? (
        <div style={emptyStateStyle}>No admin accounts found.</div>
      ) : (
        <div style={gridStyle}>
          {admins.map((adminItem) => (
            <div key={adminItem._id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={adminNameStyle}>{adminItem.email}</div>
                  <div style={adminMetaStyle}>Created: {new Date(adminItem.createdAt).toLocaleDateString()}</div>
                </div>
                <span style={badgeStyle}>Admin</span>
              </div>

              <div style={permissionListStyle}>
                {DEFAULT_PERMISSIONS.map((permission) => (
                  <label key={permission} style={permissionRowStyle}>
                    <input
                      type="checkbox"
                      checked={adminItem.permissions?.includes(permission)}
                      onChange={() => togglePermission(adminItem._id, permission)}
                      style={checkboxStyle}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const headerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: 30,
  color: '#111827',
};

const subtitleStyle = {
  margin: 0,
  color: '#475569',
  maxWidth: 660,
};

const gridStyle = {
  display: 'grid',
  gap: 18,
};

const cardStyle = {
  background: '#fff',
  padding: 22,
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18,
};

const adminNameStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#0f172a',
};

const adminMetaStyle = {
  color: '#64748b',
  fontSize: 14,
};

const badgeStyle = {
  background: '#e2e8f0',
  color: '#0f172a',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
};

const permissionListStyle = {
  display: 'grid',
  gap: 12,
};

const permissionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#334155',
};

const checkboxStyle = {
  width: 16,
  height: 16,
};

const emptyStateStyle = {
  padding: 40,
  textAlign: 'center',
  color: '#64748b',
  background: '#f8fafc',
  borderRadius: 20,
};
