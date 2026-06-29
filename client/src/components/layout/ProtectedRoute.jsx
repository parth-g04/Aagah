import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Spinner from '../shared/Spinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F3EDE0' }}>
        <Spinner />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'mp') {
      return <Navigate to="/mp" replace />;
    } else if (user.role === 'officer' || user.role === 'admin') {
      return <Navigate to="/officer" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
