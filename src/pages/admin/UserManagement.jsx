import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';

const DEPARTMENTS = [
  'CGSD',
  'CAVD',
  'PAGASA',
  'BCWD',
  'CSWD',
  'BARANGAY',
  'CDRRMD'
];

const ROLES = ['ADMIN', 'SUPERVISOR', 'ENCODER', 'VIEWER'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, auth_user_id, full_name, email, role, department, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateDepartment = async (profileId, nextDept) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department: nextDept })
        .eq('id', profileId);

      if (error) throw error;
      setStatusMsg({ text: 'User department updated successfully.', type: 'success' });
      loadUsers();
    } catch (err) {
      setStatusMsg({ text: `Failed to update department: ${err.message}`, type: 'error' });
    }
  };

  const handleUpdateRole = async (profileId, nextRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', profileId);

      if (error) throw error;
      setStatusMsg({ text: 'User role updated successfully.', type: 'success' });
      loadUsers();
    } catch (err) {
      setStatusMsg({ text: `Failed to update role: ${err.message}`, type: 'error' });
    }
  };

  const handleUpdateStatus = async (profileId, nextStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: nextStatus })
        .eq('id', profileId);

      if (error) throw error;
      setStatusMsg({ text: `User status changed to ${nextStatus}.`, type: 'success' });
      loadUsers();
    } catch (err) {
      setStatusMsg({ text: `Failed to update status: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">User Roster & Department Governance</h2>
          <p className="text-xs text-slate-500">Authorize accounts and assign encoders to designated departments</p>
        </div>
        <button
          onClick={loadUsers}
          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
        >
          Refresh Roster
        </button>
      </div>

      {statusMsg.text && (
        <div
          className={`p-3 text-xs font-medium border-b ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Assigned Department</th>
              <th className="px-4 py-3.5">Account Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                  Loading user roster...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                  No registered profiles found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{u.full_name || 'No Name'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <select
                      value={u.role || 'VIEWER'}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-xs bg-white font-medium text-slate-800"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3.5">
                    <select
                      value={u.department || 'CDRRMD'}
                      onChange={(e) => handleUpdateDepartment(u.id, e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold text-blue-700"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.status || 'PENDING'}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    {u.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                      >
                        Activate
                      </button>
                    )}
                    {u.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(u.id, 'SUSPENDED')}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}