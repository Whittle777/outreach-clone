import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const IntegrationContext = createContext({
  integrations: [],
  isConfigured: () => false,
  reload: () => {},
});

export function IntegrationProvider({ children }) {
  const [integrations, setIntegrations] = useState([]);

  const load = () =>
    api.get('/integrations')
      .then(r => setIntegrations(r.data || []))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const isConfigured = (provider) =>
    integrations.some(i => i.provider === provider);

  return (
    <IntegrationContext.Provider value={{ integrations, isConfigured, reload: load }}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegrations() {
  return useContext(IntegrationContext);
}
