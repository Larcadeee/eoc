import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AccountPending() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const location = useLocation();
  const email = user?.email || location.state?.email;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-amber-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ⏳
        </div>
        <h2 className="text-xl font-bold text-slate-900">Account Pending Approval</h2>
        <p className="text-sm text-slate-600 mt-2">
          Your account{email ? <> registered with <strong>{email}</strong></> : ''} is awaiting verification by an EOC Administrator.
        </p>
        {user && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 text-left space-y-1">
            <div><strong>Status:</strong> {profile?.status || 'PENDING'}</div>
            <div><strong>Assigned Initial Role:</strong> {profile?.role || 'VIEWER'}</div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {user ? (
            <>
              <button
                onClick={() => refreshProfile()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Check Status Again
              </button>
              <button
                onClick={() => signOut()}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Return to Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}