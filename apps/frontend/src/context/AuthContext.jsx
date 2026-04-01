import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../dbService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkUser() {
            try {
                const { user: currentUser } = await dbService.getCurrentSession();
                setUser(currentUser);
                if (currentUser) {
                    const userRole = await dbService.getUserRole(currentUser.id);
                    setRole(userRole);
                }
            } catch (error) {
                console.error("Error al recuperar sesión:", error);
            } finally {
                setLoading(false);
            }
        }

        // Al cargar la SPA, verificamos si ya habría sesión guardada
        checkUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const authUser = await dbService.login(email, password);
            setUser(authUser);
            const userRole = await dbService.getUserRole(authUser.id);
            setRole(userRole);

            // Ejemplo: Registrar el log (Regla 3 de claude.md)
            await dbService.logSystemAction('LOGIN', 'Auth', { email });

            return true;
        } catch (error) {
            console.error("Error Login:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            if (user) {
                await dbService.logSystemAction('LOGOUT', 'Auth', { email: user.email });
            }
            await dbService.logout();
            setUser(null);
            setRole(null);
        } catch (error) {
            console.error("Error Logout:", error);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        role,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para usar el contexto más fácilmente
export function useAuth() {
    return useContext(AuthContext);
}
