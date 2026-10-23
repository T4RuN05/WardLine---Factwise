import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function RequireRole({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center text-xs text-text-muted">
        Authenticating staff persona...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const role = user?.role || 'NURSE';

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-sm font-semibold text-brand-ink">Access Restricted</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your current persona ({user?.name}, {role}) does not have permission to access this clinical module. Switch to an authorized role using the persona menu above.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
