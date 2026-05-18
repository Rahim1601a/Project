import { useMemo } from 'react';
import type { ADTDensity } from '../types/types';
import { getDensityCssVariables } from '../utils/density.utils';

export function useDensity(density: ADTDensity = 'comfortable') {
  const densityStyles = useMemo(() => getDensityCssVariables(density), [density]);

  return {
    densityStyles,
  };
}
