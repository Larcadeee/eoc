import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { user: currentAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Fetch all user records
  const loadProfiles = async () => {
    setLoading(true);
    setActionMessage({ text: '', type: '' });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setActionMessage({ text: err.message || 'Unable to retrieve personnel list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Update profile status and optional role
  const handleUpdateStatus = async (targetProfileId, nextStatus, nextRole = null) => {
    setActionMessage({ text: '', type: '' });
    try {
      const payload = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (nextStatus === 'ACTIVE') {
        payload.approved_at = new Date().toISOString();
        payload.approved_by = currentAdmin.id;
      }

      if (nextRole) {
        payload.role = nextRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', targetProfileId);

      if (error) throw error;

      setActionMessage({ text: 'User profile updated successfully.', type: 'success' });
      await loadProfiles();
    } catch (err) {
      setActionMessage({ text: err.message || 'Operation failed', type: 'error' });
    }
  };

  // Change user role
  const handleRoleChange = async (targetProfileId, newRole) => {
    setActionMessage({ text: '', type: '' });
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetProfileId);

      if (error) throw error;

      setActionMessage({ text: 'Role updated successfully.', type: 'success' });
      await loadProfiles();
    } catch (err) {
      setActionMessage({ text: err.message || 'Failed to update role', type: 'error' });
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Personnel & Access Management</h2>
          <p className="text-xs text-slate-500">Approve registrations and control system clearances</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-slate-500">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All ({profiles.length})</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={loadProfiles}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {actionMessage.text && (
        <div
          className={`p-3 text-xs border-b ${
            actionMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Full Name & Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered At</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-5 py-6 text-center text-slate-400">
                  Loading user records...
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-6 text-center text-slate-400">
                  No records found matching status: {statusFilter}
                </td>
              </tr>
            ) : (
              filteredProfiles.map((p) => {
                const isSelf = p.auth_user_id === currentAdmin?.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{p.full_name || 'No Name Provided'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{p.email}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.role}
                        </span>
                      ) : (
                        <select
                          value={p.role}
                          onChange={(e) => handleRoleChange(p.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="VIEWER">VIEWER</option>
                          <option value="ENCODER">ENCODER</option>
                          <option value="SUPERVISOR">SUPERVISOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      {!isSelf && p.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'ACTIVE')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {!isSelf && p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'INACTIVE')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                        >
                          Deactivate
                        </button>
                      )}

                      {!isSelf && (p.status === 'INACTIVE' || p.status === 'REJECTED') && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'ACTIVE')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}