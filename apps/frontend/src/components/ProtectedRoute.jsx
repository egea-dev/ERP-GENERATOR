import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrapper components para proteger rutas
 * @param {Array<string>} allowedRoles - Ejemplo: ['admin', 'editor']
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, role, loading } = useAuth();

    // 1. Si el estado aún está cargando la sesión inicial, no renderizamos nada (o un spinner)
    if (loading) {
        return <div style={{ color: 'var(--acc)', padding: 20, textAlign: 'center' }}>Validando sesión...</div>;
    }

    // 2. Si no hay usuario, mandamos a Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si se especifican roles permitidos y el usuario no tiene ninguno de ellos
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h2 style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>ACCESO DENEGADO</h2>
                <p style={{ color: 'var(--tx2)', marginTop: 10 }}>Tu rol actual ('{role}') no tiene permisos para ver este módulo.</p>
            </div>
        );
    }

    // 4. Si pasa las validaciones, renderizamos el módulo
    return children;
}
