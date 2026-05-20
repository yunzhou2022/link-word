import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { getWordGraph } from '../db/queries';
import type { GraphData } from '../graph/graphTypes';
import type { AppSettings } from '../storage/storage';

export function useWordGraph(lemma: string, settings: AppSettings) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lemma) return;
    setLoading(true);
    getDatabase()
      .then((db) => getWordGraph(db, lemma, settings.nodeLimit))
      .then(setGraphData)
      .finally(() => setLoading(false));
  }, [lemma, settings.nodeLimit]);

  return { graphData, loading };
}
