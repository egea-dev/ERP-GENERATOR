import { useEffect, useMemo, useState } from 'react';
import { dbService } from '../../dbService';
import { createEmptyPackage, createInitialEnviosForm, getModeDefinition } from './enviosConfig';
import {
  buildQuotePayload,
  calculatePackagesCbm,
  getDestinationOptions,
  getFirstValidationError,
  getOriginOptions,
  getSelectedRouteInfo,
  getUserFacingEnviosError,
  normalizeRouteItems,
  resolvePreferredOrigin,
  shouldLoadTariffPreview,
  validateEnviosForm,
} from './enviosUtils';

const DEFAULT_MODE = 'nacional';

export function useEnviosCalculator() {
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [form, setForm] = useState(() => createInitialEnviosForm(DEFAULT_MODE));
  const [originOptions, setOriginOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationRoutes, setDestinationRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const [tariffPreview, setTariffPreview] = useState(null);
  const [tariffLoading, setTariffLoading] = useState(false);
  const [tariffError, setTariffError] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('idle');
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [touched, setTouched] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  const modeMeta = useMemo(() => getModeDefinition(mode), [mode]);

  const validationErrors = useMemo(() => validateEnviosForm(mode, form), [mode, form]);

  const visibleErrors = useMemo(() => {
    if (showValidation) return validationErrors;

    return Object.fromEntries(
      Object.entries(validationErrors).filter(([key]) => touched[key])
    );
  }, [showValidation, touched, validationErrors]);

  const canSubmit = Object.keys(validationErrors).length === 0 && !quoteLoading && !routesLoading;
  const packagesCbm = useMemo(() => calculatePackagesCbm(form.packages), [form.packages]);
  const selectedRoute = useMemo(
    () => getSelectedRouteInfo(destinationRoutes, form.destination),
    [destinationRoutes, form.destination]
  );

  useEffect(() => {
    dbService.logSystemAction('VIEW_ENVIOS', 'Envios', { mode: DEFAULT_MODE }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModeRoutes() {
      setRoutesLoading(true);
      setRoutesError('');

      try {
        const data = await dbService.getEnviosRoutes({ mode });
        if (cancelled) return;

        const items = normalizeRouteItems(data);
        const nextOriginOptions = getOriginOptions(items);
        const preferredOrigin = resolvePreferredOrigin(mode, nextOriginOptions, form.origin);

        setOriginOptions(nextOriginOptions);
        setDestinationRoutes([]);
        setDestinationOptions([]);
        setForm((current) => ({
          ...current,
          origin: preferredOrigin,
          destination: preferredOrigin === current.origin ? current.destination : '',
        }));
      } catch (error) {
        if (cancelled) return;
        setOriginOptions([]);
        setDestinationRoutes([]);
        setDestinationOptions([]);
        setRoutesError(getUserFacingEnviosError(error));
      } finally {
        if (!cancelled) {
          setRoutesLoading(false);
        }
      }
    }

    loadModeRoutes();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!form.origin) {
      setDestinationRoutes([]);
      setDestinationOptions([]);
      return undefined;
    }

    let cancelled = false;

    async function loadDestinationRoutes() {
      setRoutesLoading(true);
      setRoutesError('');

      try {
        const data = await dbService.getEnviosRoutes({ mode, origin: form.origin });
        if (cancelled) return;

        const items = normalizeRouteItems(data);
        const nextDestinationOptions = getDestinationOptions(items);
        const hasCurrentDestination = nextDestinationOptions.some((item) => item.value === form.destination);
        const autoDestination = hasCurrentDestination
          ? form.destination
          : nextDestinationOptions.length === 1
            ? nextDestinationOptions[0].value
            : '';

        setDestinationRoutes(items);
        setDestinationOptions(nextDestinationOptions);
        setForm((current) => (
          current.destination === autoDestination
            ? current
            : { ...current, destination: autoDestination }
        ));
      } catch (error) {
        if (cancelled) return;
        setDestinationRoutes([]);
        setDestinationOptions([]);
        setRoutesError(getUserFacingEnviosError(error));
      } finally {
        if (!cancelled) {
          setRoutesLoading(false);
        }
      }
    }

    loadDestinationRoutes();

    return () => {
      cancelled = true;
    };
  }, [mode, form.origin]);

  useEffect(() => {
    if (!shouldLoadTariffPreview(form)) {
      setTariffPreview(null);
      setTariffError('');
      return undefined;
    }

    let cancelled = false;

    async function loadTariffPreview() {
      setTariffLoading(true);
      setTariffError('');

      try {
        const data = await dbService.getEnviosTariffs({
          mode,
          origin: form.origin,
          destination: form.destination,
        });

        if (!cancelled) {
          setTariffPreview(data);
        }
      } catch (error) {
        if (cancelled) return;
        setTariffPreview(null);
        setTariffError(getUserFacingEnviosError(error));
      } finally {
        if (!cancelled) {
          setTariffLoading(false);
        }
      }
    }

    loadTariffPreview();

    return () => {
      cancelled = true;
    };
  }, [mode, form.origin, form.destination]);

  function clearComputedState() {
    setQuoteResult(null);
    setQuoteError('');
    setQuoteStatus('idle');
  }

  function markTouched(fieldName) {
    setTouched((current) => ({ ...current, [fieldName]: true }));
  }

  function handleModeChange(nextMode) {
    if (nextMode === mode) return;

    setMode(nextMode);
    setForm(createInitialEnviosForm(nextMode));
    setTouched({});
    setShowValidation(false);
    setRoutesError('');
    setTariffPreview(null);
    setTariffError('');
    clearComputedState();

    dbService.logSystemAction('CHANGE_ENVIO_MODE', 'Envios', { mode: nextMode }).catch(() => {});
  }

  function updateField(fieldName, value) {
    clearComputedState();

    if (fieldName === 'origin') {
      setDestinationRoutes([]);
      setDestinationOptions([]);
      setTariffPreview(null);
      setTariffError('');
    }

    if (fieldName === 'destination') {
      setTariffPreview(null);
      setTariffError('');
    }

    setForm((current) => {
      const nextState = { ...current, [fieldName]: value };

      if (fieldName === 'origin' && current.origin !== value) {
        nextState.destination = '';
      }

      return nextState;
    });
  }

  function updatePackage(packageIndex, fieldName, value) {
    clearComputedState();
    setForm((current) => ({
      ...current,
      packages: current.packages.map((pkg, index) => (
        index === packageIndex ? { ...pkg, [fieldName]: value } : pkg
      )),
    }));
  }

  function addPackage() {
    clearComputedState();
    setForm((current) => ({
      ...current,
      packages: [...current.packages, createEmptyPackage()],
    }));
  }

  function removePackage(packageIndex) {
    clearComputedState();
    setForm((current) => ({
      ...current,
      packages: current.packages.filter((_, index) => index !== packageIndex),
    }));
  }

  function resetForm() {
    setForm(createInitialEnviosForm(mode));
    setTouched({});
    setShowValidation(false);
    setTariffPreview(null);
    setTariffError('');
    setRoutesError('');
    clearComputedState();
  }

  async function submitQuote() {
    setShowValidation(true);

    const nextErrors = validateEnviosForm(mode, form);
    if (Object.keys(nextErrors).length > 0) {
      setQuoteStatus('idle');
      setQuoteError(getFirstValidationError(nextErrors));
      return;
    }

    const payload = buildQuotePayload(mode, form);

    setQuoteLoading(true);
    setQuoteStatus('loading');
    setQuoteError('');

    try {
      const data = await dbService.createEnviosQuote(payload);
      setQuoteResult(data);
      setQuoteStatus('success');

      dbService.logSystemAction('QUOTE_ENVIOS_SUCCESS', 'Envios', {
        mode,
        origin: payload.origin,
        destination: payload.destination,
        total: data?.total || null,
      }).catch(() => {});
    } catch (error) {
      const message = getUserFacingEnviosError(error);
      setQuoteResult(null);
      setQuoteError(message);
      setQuoteStatus(error?.status === 404 ? 'not-found' : 'error');

      dbService.logSystemAction('QUOTE_ENVIOS_ERROR', 'Envios', {
        mode,
        origin: payload.origin,
        destination: payload.destination,
        status: error?.status || null,
        error: message,
      }).catch(() => {});
    } finally {
      setQuoteLoading(false);
    }
  }

  return {
    mode,
    modeMeta,
    form,
    originOptions,
    destinationOptions,
    routesLoading,
    routesError,
    tariffPreview,
    tariffLoading,
    tariffError,
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
  };
}
