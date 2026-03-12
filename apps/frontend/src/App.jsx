import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import { useAuth } from "./context/AuthContext";
import DirectoryGenerator from './components/DirectoryGenerator';
import Backoffice from './components/Backoffice';
import TicketModal from './components/TicketModal';
import ChatPanel from './components/Chat/ChatPanel';
import { dbService } from './dbService';

// Importaciones Modulares
import "./App.styles.css";
import { FAMILIAS } from "./config/erp_constants";
import ViewCrear from "./components/RefGen/ViewCrear";
import ViewHist from "./components/RefGen/ViewHist";

// ─── COMPONENTES DE ESTRUCTURA ────────────────────────────────────────────────

function Panel({ id, active, title, icon, children, onToggle, headerRight }) {
  if (!active) {
    return (
      <div className="panel collapsed" onClick={onToggle}>
        <div className="p-hdr-vert">
          <div className="p-icon">{icon}</div>
          <span>{title}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="panel active">
      <div className="p-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }} onClick={onToggle}>
          <div className="p-icon" style={{ opacity: 0.8 }}>{icon}</div>
          <span style={{ fontSize: 11, letterSpacing: '1.5px' }}>{title}</span>
        </div>
        {headerRight && <div className="p-nav" style={{ display: 'flex', alignItems: 'center' }}>{headerRight}</div>}
        <button className="collapse-btn" onClick={onToggle} title="Colapsar Panel">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
        </button>
      </div>
      <div className="p-content">
        {children}
      </div>
    </div>
  );
}

function GeneradorNombres({ tab, setTab, db, addArt }) {
  function loadArt(a) {
    setTab("crear");
    setTimeout(() => window.dispatchEvent(new CustomEvent("__load", { detail: a })), 40);
  }
  return (
    <div className="app">
      {tab === "crear" && <ViewCrear db={db} addArt={addArt} />}
      {tab === "hist" && <ViewHist db={db} loadArt={loadArt} />}
    </div>
  );
}

function Dashboard() {
  const { user, role, logout } = useAuth();
  const [panels, setPanels] = useState({ refgen: false, urlgen: false, chat: false });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  // States compartidos
  const [refTab, setRefTab] = useState("crear");
  const [urlTab, setUrlTab] = useState("crear");
  const [backTab, setBackTab] = useState("logs");
  const [db, setDb] = useState([]);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [clientTickets, setClientTickets] = useState([]);
  const addArt = (a) => setDb(p => [a, ...p]);

  useEffect(() => {
    async function init() {
      const [artData, ticketData] = await Promise.all([
        dbService.getArticulos(),
        dbService.getTickets()
      ]);

      const mapped = artData.map(a => ({
        id: a.id,
        ref: a.referencia,
        desc: a.descripcion,
        familia: a.familia,
        tipo: a.tipo,
        variante: a.variante,
        ancho: a.ancho,
        alto: a.alto,
        fecha: a.fecha_creacion,
        user: a.creado_por
      }));
      setDb(mapped);

      const pendingCount = ticketData.filter(t => t.estado === 'Pendiente').length;
      setPendingTickets(pendingCount);

      const myOwnTickets = ticketData.filter(t => t.user_id === user?.id);
      const now = new Date();
      for (const t of myOwnTickets) {
        if (t.estado === 'Resuelto' && t.resuelto_at) {
          const resTime = new Date(t.resuelto_at);
          if ((now - resTime) / (1000 * 60 * 60) >= 24) {
            dbService.updateTicketStatus(t.id, 'Archivado');
            t.estado = 'Archivado';
          }
        }
      }
      setClientTickets(myOwnTickets.filter(t => t.estado !== 'Archivado'));
    }
    init();
  }, [showAdmin, backTab, user]);

  const toggle = (k) => setPanels(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="dash-wrap">
      <header className="dash-hdr">
        <div className="logo-main" style={{ fontSize: 14, letterSpacing: '1px', fontWeight: 900 }}>
          <div className="logo-dot" />
          EGEA-DEV SOLUTION
        </div>
        <div className="nav" style={{ alignItems: 'center', gap: 15 }}>
          <span style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'var(--mono)', opacity: 0.6 }}>{user?.email}</span>
          {clientTickets.length > 0 && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--br2)' }}>
              {clientTickets.slice(0, 3).map(t => (
                <div key={t.id} title={`${t.titulo}: ${t.estado}`} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.estado === 'Resuelto' ? '#52c97e' : (t.estado === 'En proceso' ? '#a852e0' : (t.prioridad === 'Normal' ? '#f0c040' : '#e05252')),
                  boxShadow: `0 0 5px ${t.estado === 'Resuelto' ? '#52c97e' : (t.estado === 'En proceso' ? '#a852e0' : (t.prioridad === 'Normal' ? '#f0c040' : '#e05252'))}`
                }} />
              ))}
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--tx2)', marginLeft: 2 }}>{clientTickets.length} INCID.</span>
            </div>
          )}
          <button className="nav-btn" onClick={() => setShowTickets(true)}
            style={{ background: 'rgba(240, 192, 64, 0.1)', color: 'var(--acc)', border: '1px solid var(--acc2)' }}>
            REPORTAR INCIDENCIA
          </button>
          {(role === 'admin' || user?.email === 'admin@oko.com') && (
            <button className={`nav-btn ${showAdmin ? 'on' : ''}`}
              onClick={() => setShowAdmin(!showAdmin)}
              style={{ border: '1px solid var(--acc2)', color: 'var(--acc2)', fontSize: 9, fontWeight: 700 }}>
              {showAdmin ? 'CERRAR ADMIN' : 'BACKOFFICE'}
            </button>
          )}
          <button className="nav-btn" onClick={logout} style={{ border: '1px solid var(--br)', fontSize: 9 }}>CERRAR SESIÓN</button>
        </div>
      </header>

      <TicketModal isOpen={showTickets} onClose={() => setShowTickets(false)} />

      {showAdmin ? (
        <div className="dash-body" style={{ overflowY: 'auto', display: 'block', background: 'var(--bg)' }}>
          <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--br)', display: 'flex', gap: 20, background: 'var(--s1)' }}>
            <button className={`nav-btn ${backTab === 'logs' ? 'on' : ''}`} onClick={() => setBackTab("logs")}>Auditoría</button>
            <button className={`nav-btn ${backTab === 'users' ? 'on' : ''}`} onClick={() => setBackTab("users")}>Usuarios</button>
            <button className={`nav-btn ${backTab === 'stats' ? 'on' : ''}`} onClick={() => setBackTab("stats")}>Analíticas</button>
            <button className={`nav-btn ${backTab === 'tickets' ? 'on' : ''} ${pendingTickets > 0 ? 'pulse' : ''}`} onClick={() => setBackTab("tickets")}>
              Tickets {pendingTickets > 0 && <span>({pendingTickets})</span>}
            </button>
            <button className="nav-btn" onClick={() => setShowAdmin(false)} style={{ marginLeft: 'auto', color: 'var(--tx2)' }}>VOLVER AL DASHBOARD</button>
          </div>
          <div style={{ padding: 40 }}>
            <Backoffice tab={backTab} setTab={setBackTab} />
          </div>
        </div>
      ) : (
        <div className="dash-body">
          <Panel id="refgen" active={panels.refgen} onToggle={() => toggle("refgen")} title="REFGEN"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}
            headerRight={
              <div className="nav" style={{ marginRight: 15, gap: 6, paddingRight: 15, borderRight: '1px solid var(--br)' }}>
                <button className={`nav-btn${refTab === "crear" ? " on" : ""} `} onClick={() => setRefTab("crear")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button className={`nav-btn${refTab === "hist" ? " on" : ""} `} onClick={() => setRefTab("hist")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </button>
                <div style={{ marginLeft: 5, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--tx3)', opacity: 0.6 }}><span>{db.length}</span></div>
              </div>
            }>
            <GeneradorNombres tab={refTab} setTab={setRefTab} db={db} addArt={addArt} />
          </Panel>

          <Panel id="urlgen" active={panels.urlgen} onToggle={() => toggle("urlgen")} title="URLGEN"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>}
            headerRight={
              <div className="nav" style={{ marginRight: 15, gap: 6, paddingRight: 15, borderRight: '1px solid var(--br)' }}>
                <button className={`nav-btn${urlTab === "crear" ? " on" : ""} `} onClick={() => setUrlTab("crear")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button className={`nav-btn${urlTab === "hist" ? " on" : ""} `} onClick={() => setUrlTab("hist")}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </button>
              </div>
            }>
            <DirectoryGenerator tab={urlTab} setTab={setUrlTab} />
          </Panel>

          <Panel id="chat" active={panels.chat} onToggle={() => toggle("chat")} title="CONSULTAS IA"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}>
            <ChatPanel />
          </Panel>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}
