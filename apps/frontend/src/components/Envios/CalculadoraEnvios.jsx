import { useMemo } from 'react';
import { CONTAINER_TYPES, ENVIO_MODES, FIXED_ORIGINS } from './enviosConfig';
import {
  buildFieldKey,
  formatBreakdownValue,
  formatCurrency,
  formatModeLabel,
  formatNumber,
  getMetadataEntries,
} from './enviosUtils';
import { useEnviosCalculator } from './useEnviosCalculator';
import './envios.css';

function FieldShell({ label, htmlFor, hint, error, required, children }) {
  return (
    <div className="envios-field">
      <label className="envios-field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {error ? <span className="envios-field-error">{error}</span> : hint ? <span className="envios-field-hint">{hint}</span> : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="envios-loading">
      <div className="envios-loading-skeleton" style={{ width: '60%' }}></div>
      <div className="envios-loading-skeleton lg"></div>
      <div className="envios-loading-skeleton card"></div>
      <div className="envios-loading-skeleton grid">
        <div className="sk"></div>
        <div className="sk"></div>
      </div>
      <div className="envios-loading-skeleton list">
        <div className="sk"></div>
        <div className="sk"></div>
        <div className="sk"></div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="envios-result-empty">
      <div className="envios-result-empty-icon">
        <span style={{ fontSize: 32 }}>📦</span>
      </div>
      <h3>Calculadora de envíos</h3>
      <p>Completa los datos y pulsa calcular para ver el precio.</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="envios-error">
      <div className="envios-error-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>Error</h3>
      <p>{message}</p>
    </div>
  );
}

function ResultsPanel({ mode, quoteStatus, quoteResult, quoteError }) {
  if (quoteStatus === 'loading') return <LoadingState />;
  if (quoteStatus === 'not-found') return <ErrorState message={quoteError || 'Ruta no encontrada'} />;
  if (quoteStatus === 'error') return <ErrorState message={quoteError || 'No se pudo calcular el envío'} />;
  if (quoteStatus !== 'success' || !quoteResult) return <EmptyState />;

  const currency = quoteResult.currency || 'EUR';
  const metadata = getMetadataEntries(quoteResult.metadata);

  return (
    <div className="envios-result-success" role="region" aria-live="polite">
      <div className="envios-result-header">
        <div className="envios-result-total">
          <span>Cotización</span>
          <strong>{formatCurrency(quoteResult.total, currency)}</strong>
        </div>
        <span className="envios-result-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Listo
        </span>
      </div>

      <div className="envios-result-route">
        <strong>{quoteResult.route || `${quoteResult.origin} → ${quoteResult.destination}`}</strong>
        <span>
          {quoteResult.carrier || 'Sin carrier'}
          {quoteResult.airline ? ` · ${quoteResult.airline}` : ''}
          {quoteResult.transit ? ` · ${quoteResult.transit}` : ''}
        </span>
      </div>

      <div className="envios-stats-grid">
        <div className="envios-stat-card">
          <span>Carrier</span>
          <strong>{quoteResult.carrier || '-'}</strong>
        </div>
        <div className="envios-stat-card">
          <span>Tipo</span>
          <strong>{formatModeLabel(mode)}</strong>
        </div>
        {quoteResult.frequency && (
          <div className="envios-stat-card">
            <span>Frecuencia</span>
            <strong>{quoteResult.frequency}</strong>
          </div>
        )}
        {quoteResult.container_type && (
          <div className="envios-stat-card">
            <span>Contenedor</span>
            <strong>{quoteResult.container_type}</strong>
          </div>
        )}
      </div>

      <div className="envios-section">
        <h3>Desglose</h3>
        <div className="envios-breakdown">
          {(quoteResult.breakdown || []).map((item) => (
            <div key={item.code || item.label} className="envios-breakdown-row">
              <span>{item.label}</span>
              <strong>{formatBreakdownValue(item, currency)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="envios-section">
        <h3>Vigencia</h3>
        <div className="envios-meta-grid">
          {metadata.validityEntries.map((v) => (
            <div key={v.label} className="envios-meta-card">
              <span>{v.label}</span>
              <strong>{v.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {mode === 'aereo' && Array.isArray(quoteResult.alternatives) && quoteResult.alternatives.length > 0 && (
        <div className="envios-alternatives">
          <h3>Alternativas</h3>
          <div className="envios-alt-grid">
            {quoteResult.alternatives.map((alt, i) => (
              <div key={i} className="envios-alt-card">
                <span>Opción {i + 1}</span>
                <strong>{alt.carrier || 'Carrier'}</strong>
                <div className="price">{formatCurrency(alt.total, currency)}</div>
                <span>{alt.airline}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalculadoraEnvios() {
  const {
    mode,
    form,
    originOptions,
    destinationOptions,
    routesLoading,
    routesError,
    quoteStatus,
    quoteResult,
    quoteLoading,
    quoteError,
    visibleErrors,
    canSubmit,
    packagesCbm,
    selectedRoute,
    updateField,
    updatePackage,
    addPackage,
    removePackage,
    markTouched,
    handleModeChange,
    resetForm,
    submitQuote,
  } = useEnviosCalculator();

  const helperMsg = Object.values(visibleErrors)[0] || (quoteError && quoteStatus === 'idle' ? quoteError : '');

  const onSubmit = async (e) => {
    e.preventDefault();
    await submitQuote();
  };

  const currentOriginOptions = originOptions.length > 0 ? originOptions : (FIXED_ORIGINS[mode] ? [{ value: FIXED_ORIGINS[mode], label: FIXED_ORIGINS[mode] }] : []);

  return (
    <div className="main">
      <div className="stitle">ENVÍOS</div>
      <div className="envios-layout">
        <form className="card" onSubmit={onSubmit}>
          <div className="sec-lbl">Modo de envío</div>
          <div className="envios-mode-grid">
            {ENVIO_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`chip${mode === m.value ? ' on' : ''} envios-mode-chip`}
                onClick={() => handleModeChange(m.value)}
              >
                <span>{m.emoji}</span>
                <div>
                  <span>{m.label}</span>
                  <span className="chip-sub">{m.eyebrow}</span>
                </div>
              </button>
            ))}
          </div>

          {routesError && (
            <div className="alert a-e" style={{ marginTop: 12 }}>
              {routesError}
            </div>
          )}

          <div className="envios-form-grid">
              <FieldShell label="Origen" htmlFor="envios-origin" required error={visibleErrors.origin} hint={mode === 'grupaje' ? 'Origen fijo' : 'Selecciona origen'}>
                <select
                  id="envios-origin"
                  className={`search-sel${visibleErrors.origin ? ' error' : ''}`}
                  value={form.origin}
                  onChange={(e) => updateField('origin', e.target.value)}
                  onBlur={() => markTouched('origin')}
                  disabled={routesLoading || mode === 'grupaje'}
                >
                  <option value="">Selecciona...</option>
                  {currentOriginOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldShell>

              <FieldShell label="Destino" htmlFor="envios-dest" required error={visibleErrors.destination} hint="Selecciona destino">
                <select
                  id="envios-dest"
                  className={`search-sel${visibleErrors.destination ? ' error' : ''}`}
                  value={form.destination}
                  onChange={(e) => updateField('destination', e.target.value)}
                  onBlur={() => markTouched('destination')}
                  disabled={routesLoading || !form.origin}
                >
                  <option value="">Selecciona...</option>
                  {destinationOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </FieldShell>

              {(mode === 'aereo' || mode === 'grupaje' || mode === 'contenedor') && (
                <>
                  {mode === 'aereo' && (
                    <FieldShell label="Kg tasables" htmlFor="envios-chargeable" required error={visibleErrors.chargeable_kg} hint="Peso facturable">
                      <input
                        id="envios-chargeable"
                        type="number"
                        className={`envios-field-input${visibleErrors.chargeable_kg ? ' error' : ''}`}
                        value={form.chargeable_kg}
                        onChange={(e) => updateField('chargeable_kg', e.target.value)}
                        onBlur={() => markTouched('chargeable_kg')}
                        placeholder="Ej: 450"
                        min="0"
                        step="0.01"
                      />
                    </FieldShell>
                  )}

                  {mode === 'grupaje' && (
                    <FieldShell label="CBM" htmlFor="envios-cbm" required error={visibleErrors.cbm} hint="Volumen en m³">
                      <input
                        id="envios-cbm"
                        type="number"
                        className={`envios-field-input${visibleErrors.cbm ? ' error' : ''}`}
                        value={form.cbm}
                        onChange={(e) => updateField('cbm', e.target.value)}
                        onBlur={() => markTouched('cbm')}
                        placeholder="Ej: 4.55"
                        min="0"
                        step="0.01"
                      />
                    </FieldShell>
                  )}

                  {mode === 'contenedor' && (
                    <FieldShell label="Contenedor" htmlFor="envios-container" required error={visibleErrors.container_type}>
                      <select
                        id="envios-container"
                        className={`search-sel${visibleErrors.container_type ? ' error' : ''}`}
                        value={form.container_type}
                        onChange={(e) => updateField('container_type', e.target.value)}
                        onBlur={() => markTouched('container_type')}
                      >
                        {CONTAINER_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </FieldShell>
                  )}
                </>
              )}
            </div>

            {(mode === 'nacional' || mode === 'canarias') && (
              <>
                <div className="envios-form-grid single" style={{ marginTop: 14 }}>
                  <FieldShell label="Peso total (kg)" htmlFor="envios-weight" required error={visibleErrors.weight_kg} hint="Peso total del envío">
                    <input
                      id="envios-weight"
                      type="number"
                      className={`envios-field-input${visibleErrors.weight_kg ? ' error' : ''}`}
                      value={form.weight_kg}
                      onChange={(e) => updateField('weight_kg', e.target.value)}
                      onBlur={() => markTouched('weight_kg')}
                      placeholder="Ej: 200"
                      min="0"
                      step="0.01"
                    />
                  </FieldShell>
                </div>

                <div className="envios-packages">
                  <div className="envios-packages-header">
                    <div>
                      <h3>Bultos</h3>
                      <p>Dimensiones de cada paquete</p>
                    </div>
                    <button type="button" className="btn btn-g" onClick={addPackage}>+ Añadir</button>
                  </div>

                  <div className="envios-package-list">
                    {form.packages.map((pkg, idx) => (
                      <div key={pkg.id} className="envios-package-card">
                        <div className="envios-package-header">
                          <strong>Bulto {idx + 1}</strong>
                          {form.packages.length > 1 && (
                            <button type="button" className="switch-btn" onClick={() => removePackage(idx)}>Eliminar</button>
                          )}
                        </div>
                        <div className="envios-package-dims">
                          {['length_cm', 'width_cm', 'height_cm'].map((field) => {
                            const fk = buildFieldKey(idx, field);
                            const label = field === 'length_cm' ? 'Largo' : field === 'width_cm' ? 'Ancho' : 'Alto';
                            return (
                              <FieldShell
                                key={field}
                                label={label}
                                htmlFor={`envios-${field}-${idx}`}
                                error={visibleErrors[fk]}
                              >
                                <input
                                  id={`envios-${field}-${idx}`}
                                  type="number"
                                  className={`envios-field-input${visibleErrors[fk] ? ' error' : ''}`}
                                  value={pkg[field]}
                                  onChange={(e) => updatePackage(idx, field, e.target.value)}
                                  onBlur={() => markTouched(fk)}
                                  placeholder="cm"
                                  min="0"
                                  step="0.1"
                                />
                              </FieldShell>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="envios-package-summary">
                    <span className="envios-chip">Bultos: {form.packages.length}</span>
                    <span className="envios-chip">Volumen: {formatNumber(packagesCbm, 3)} m³</span>
                  </div>
                </div>
              </>
            )}

          {selectedRoute && form.destination && (
            <div className="envios-route-info">
              <strong>{form.origin} → {form.destination}</strong>
              {selectedRoute.transit && <span>Trnsito: {selectedRoute.transit}</span>}
            </div>
          )}

          <div className="envios-actions">
            <div className="envios-actions-hint">
              {helperMsg && <strong>{helperMsg}</strong>}
            </div>
            <div className="envios-actions-buttons">
              <button type="button" className="btn btn-g" onClick={resetForm}>Limpiar</button>
              <button type="submit" className="btn btn-p" disabled={!canSubmit || quoteLoading}>
                {quoteLoading ? 'Calculando...' : 'Calcular'}
              </button>
            </div>
          </div>
        </form>

        <aside className="envios-results-panel card">
          <ResultsPanel mode={mode} quoteStatus={quoteStatus} quoteResult={quoteResult} quoteError={quoteError} />
        </aside>
      </div>
    </div>
  );
}