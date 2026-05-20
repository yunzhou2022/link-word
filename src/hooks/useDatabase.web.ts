import { useState, useEffect, useRef } from 'react';
import { initDatabaseWithProgress, type ProgressCallback } from '../db/database.web';

type Status = 'checking' | 'downloading' | 'extracting' | 'ready' | 'error';

export function useDatabase() {
  const [status, setStatus] = useState<Status>('checking');
  const [progress, setProgress] = useState(0);
  const [loadedMB, setLoadedMB] = useState(0);
  const [totalMB, setTotalMB] = useState(0);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const onProgress: ProgressCallback = (opts) => {
      setStatus(opts.status);
      setProgress(opts.progress);
      setLoadedMB(opts.loadedMB);
      setTotalMB(opts.totalMB);
      if (opts.error) setError(opts.error);
    };

    initDatabaseWithProgress(onProgress).catch((e: Error) => {
      setStatus('error');
      setError(e.message);
    });
  }, []);

  return { ready: status === 'ready', progress, status, loadedMB, totalMB, error };
}
