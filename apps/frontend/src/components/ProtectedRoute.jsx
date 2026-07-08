import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BYPASS_AUTH = true;

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, role, loading } = useAuth();

    if (BYPASS_AUTH) {
        return children;
    }

    if (loading) {
        return <div style={{ color: 'var(--acc)', padding: 20, textAlign: 'center' }}>Validando sesión...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2 style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>ACCESO DENEGADO</h2>
                <p style={{ color: 'var(--tx2)', marginTop: 10 }}>Tu rol actual ('{role}') no tiene permisos para ver este módulo.</p>
            </div>
        );
    }

    return children;
}
