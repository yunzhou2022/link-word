import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { getWordDetail } from '../db/queries';
import type { WordDetailData } from '../db/types';

export function useWordDetail(lemma: string) {
  const [detail, setDetail] = useState<WordDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lemma) return;
    setLoading(true);
    getDatabase()
      .then((db) => getWordDetail(db, lemma))
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [lemma]);

  return { detail, loading };
}
