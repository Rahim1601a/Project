import { useState, useCallback, useMemo } from 'react';
import type { ADTDensity } from '../types/types';
import { getDensityCssVariables } from '../utils/density.utils';

export function useDensity(initialDensity: ADTDensity = 'comfortable') {
  const [density, setDensity] = useState<ADTDensity>(initialDensity);

  const densityStyles = useMemo(() => getDensityCssVariables(density), [density]);

  const handleDensityChange = useCallback((newDensity: ADTDensity) => {
    setDensity(newDensity);
  }, []);

  return {
    density,
    setDensity: handleDensityChange,
    densityStyles,
  };
}
