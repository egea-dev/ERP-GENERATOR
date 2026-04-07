import { useState, useMemo } from "react";
import * as XLSX from 'xlsx';
import { FAMILIAS, norm } from "../../config/erp_constants";
import { dbService } from '../../dbService';

export default function ViewHist({ db, loadArt }) {
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState("");

  const rows = useMemo(() => {
    const nq = norm(q);
    return db.filter((a) => {
      const mq = !nq || norm(a.ref).includes(nq) || norm(a.desc).includes(nq);
      const mf = !filt || a.familia === filt;
      return mq && mf;
    });
  }, [db, q, filt]);

  const counts = useMemo(() => {
    const c = {};
    db.forEach((a) => { c[a.familia] = (c[a.familia] || 0) + 1; });
    return c;
  }, [db]);

  return (
    <div>
      <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Historial
        <button className="btn btn-g" style={{ padding: '6px 12px' }} onClick={() => {
          const ws = XLSX.utils.json_to_sheet(db);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Referencias");
          XLSX.writeFile(wb, "Egea_Referencias.xlsx");
          dbService.insertLog('XLS_EXPORT', 'REFGEN', { count: db.length });
        }}>
          <svg style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          EXPORTAR EXCEL
        </button>
      </div>
      <div className="stats-row">
        <div className={`stat ${!filt ? "on" : ""} `} onClick={() => setFilt("")}>
          <div className="stat-n">{db.length}</div><div className="stat-l">Total</div>
        </div>
        {Object.entries(counts).map(([f, c]) => (
          <div key={f} className={`stat ${filt === f ? "on" : ""} `} onClick={() => setFilt(filt === f ? "" : f)}>
            <div className="stat-n" style={{ fontSize: 16 }}>{c}</div>
            <div className="stat-l">{FAMILIAS.find((x) => x.codigo === f)?.desc || f}</div>
          </div>
        ))}
      </div>
      <div className="search-row">
        <input className="search-in" placeholder="Buscar referencia o descripcion…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="search-sel" value={filt} onChange={(e) => setFilt(e.target.value)}>
          <option value="">Todas las familias</option>
          {FAMILIAS.map((f) => <option key={f.codigo} value={f.codigo}>{f.codigo} · {f.desc}</option>)}
        </select>
      </div>
      <div className="h-list">
        {rows.length === 0 && <div className="empty">Sin resultados</div>}
        {rows.map((a) => (
          <div key={a.id} className="h-row" onDoubleClick={() => loadArt(a)}>
            <div className="h-ref">{a.ref}</div>
            <div className="h-desc">{a.desc}</div>
            <div className="h-tags">
              <span className="seg seg-f" style={{ fontSize: 9 }}>{a.familia}</span>
              <span className="seg seg-t" style={{ fontSize: 9 }}>{a.tipo}</span>
            </div>
            <div className="h-date">{a.fecha}</div>
            <div className="h-use" onClick={(e) => { e.stopPropagation(); loadArt(a); }}>Cargar</div>
          </div>
        ))}
      </div>
      <div className="foot">{rows.length} / {db.length} · Doble clic en cualquier fila para editarla</div>
    </div>
  );
}
