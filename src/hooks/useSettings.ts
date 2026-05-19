import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, type AppSettings } from '../storage/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    graphMode: 'force',
    nodeLimit: 20,
    darkMode: true,
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const updated = await saveSettings(patch);
    setSettings(updated);
  }, []);

  return { settings, update };
}
