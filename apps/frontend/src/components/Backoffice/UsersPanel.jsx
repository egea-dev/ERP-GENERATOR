import React, { useState } from 'react';
import { dbService } from '../../dbService';

export default function UsersPanel({ profiles, onLoadProfiles }) {
    const [newUserState, setNewUserState] = useState({ email: '', password: '', fullName: '', role: 'user' });
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUserState.email || !newUserState.password || !newUserState.fullName) {
            alert("Rellena todos los campos");
            return;
        }
        setLoading(true);
        try {
            await dbService.createNewUser(newUserState.email, newUserState.password, newUserState.fullName, newUserState.role);
            setNewUserState({ email: '', password: '', fullName: '', role: 'user' });
            await onLoadProfiles();
            alert("Usuario creado con éxito");
        } catch (err) {
            alert("Error al crear usuario: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setLoading(true);
            await dbService.updateUserRole(userId, newRole);
            await onLoadProfiles();
            alert("Rol actualizado correctamente.");
        } catch (err) {
            alert("Error al actualizar rol: Verifica permisos de Admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Seguro que quieres borrar este usuario de forma permanente?")) return;
        setLoading(true);
        try {
            await dbService.deleteUser(userId);
            await onLoadProfiles();
            alert("Usuario eliminado correctamente");
        } catch (err) {
            alert("Error al borrar: " + (err.message || "Verifica tu Service Key"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                Gestión Avanzada de Usuarios
            </div>

            <div className="card" style={{ marginBottom: 20, padding: 20, background: 'var(--s1)' }}>
                <div className="stitle" style={{ fontSize: 13, marginBottom: 15, color: 'var(--acc)' }}>Dar de Alta Nuevo Usuario</div>
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, alignItems: 'end' }}>
                    <div>
                        <div style={{ fontSize: 10, marginBottom: 5, color: 'var(--tx3)' }}>Nombre Completo</div>
                        <input className="search-in" required placeholder="Ej: Juan Pérez" value={newUserState.fullName} onChange={e => setNewUserState({ ...newUserState, fullName: e.target.value })} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, marginBottom: 5, color: 'var(--tx3)' }}>Correo Electrónico</div>
                        <input type="email" required className="search-in" placeholder="juan@oko.com" value={newUserState.email} onChange={e => setNewUserState({ ...newUserState, email: e.target.value })} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, marginBottom: 5, color: 'var(--tx3)' }}>Contraseña Temporal</div>
                        <input type="password" required className="search-in" placeholder="Mínimo 6 caracteres" value={newUserState.password} onChange={e => setNewUserState({ ...newUserState, password: e.target.value })} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, marginBottom: 5, color: 'var(--tx3)' }}>Privilegios Iniciales</div>
                        <select className="search-in" value={newUserState.role} onChange={e => setNewUserState({ ...newUserState, role: e.target.value })}>
                            <option value="user">Usuario (Técnico Base)</option>
                            <option value="editor">Editor (Agente Mesa)</option>
                            <option value="admin">Administrador (Master)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-g" style={{ height: 35, width: '100%' }} disabled={loading}>CREAR CUENTA</button>
                </form>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: 'var(--br)' }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: 'left' }}>USUARIO (ID)</th>
                            <th style={{ padding: 12, textAlign: 'center' }}>NIVEL DE ACCESO</th>
                            <th style={{ padding: 12, textAlign: 'right' }}>FECHA DE ALTA</th>
                            <th style={{ padding: 12, textAlign: 'center' }}>ZONA ROJA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--br2)' }}>
                                <td style={{ padding: '15px 12px', textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{p.full_name}</div>
                                    <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--tx3)', marginTop: 4 }}>ID: {p.id?.split('-')[0]}***</div>
                                </td>
                                <td style={{ padding: 12, textAlign: 'center' }}>
                                    <select
                                        style={{ background: 'var(--s2)', color: 'var(--fg)', border: '1px solid var(--br)', padding: '4px 8px', borderRadius: 4, width: '100px', cursor: 'pointer' }}
                                        value={p.user_roles?.[0]?.role || 'user'}
                                        onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                    >
                                        <option value="user">USER</option>
                                        <option value="editor">EDITOR</option>
                                        <option value="admin">ADMIN</option>
                                    </select>
                                </td>
                                <td style={{ padding: 12, textAlign: 'right', color: 'var(--tx3)' }}>
                                    {new Date(p.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: 12, textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleDeleteUser(p.id)}
                                        style={{
                                            background: '#e0525220',
                                            border: '1px solid #e05252',
                                            color: '#e05252',
                                            padding: '4px 10px',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontSize: 10,
                                            fontWeight: 800
                                        }}
                                    >
                                        BORRAR CUENTA
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
