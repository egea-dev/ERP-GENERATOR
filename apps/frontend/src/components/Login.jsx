import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            await login(email, password);
            navigate('/'); // Redirigir al dashboard principal si es exitoso
        } catch (error) {
            setErrorMsg(error.message || 'Error al iniciar sesiÃ³n. Revisa tus credenciales.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg)' }}>
            <div className="card" style={{ maxWidth: 400, width: '100%', padding: '30px' }}>
                <h2 className="stitle" style={{ fontSize: 18, color: 'var(--acc)', justifyContent: 'center', marginBottom: 30 }}>
                    INICIAR SESIÓN
                </h2>

                {errorMsg && <div className="alert a-e">{errorMsg}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="mod-field">
                        <label className="mod-lbl">Email Corporativo</label>
                        <input
                            className="mod-in"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@egea.com"
                            style={{ textTransform: 'none' }}
                        />
                    </div>

                    <div className="mod-field">
                        <label className="mod-lbl">Contraseña</label>
                        <input
                            className="mod-in"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{ textTransform: 'none' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-p"
                        disabled={isSubmitting}
                        style={{ marginTop: 10, justifyContent: 'center' }}
                    >
                        {isSubmitting ? 'VERIFICANDO...' : 'ENTRAR AL HUB'}
                    </button>
                </form>

                <footer style={{ marginTop: 40, textAlign: 'center', borderTop: '1px solid var(--br)', paddingTop: 20 }}>
                    <p style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 10, fontFamily: 'var(--mono)', letterSpacing: 1 }}>Versión 3.4 - Estable</p>
                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--tx2)' }}>
                        Hecho con
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--red)" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 5px rgba(224, 82, 82, 0.4))' }}>
                            <path d="M12.39 20.87a.696.696 0 0 1-.78 0C9.764 19.637 2 14.15 2 8.973c0-6.68 7.85-7.75 10-3.25 2.15-4.5 10-3.43 10 3.25 0 5.178-7.764 10.664-9.61 11.895z"></path>
                        </svg>
                        por Hacchi
                    </p>
                </footer>
            </div>
        </div>
    );
}
