/**
 * This file is a backward-compatible re-export barrel.
 * The actual implementation has been split into the MRTLikeTable/ directory.
 * Existing imports from './MRTLikeTable' continue to work unchanged.
 */
export { MRTLikeTable } from './MRTLikeTable/MRTLikeTable';
export type { MRTLikeColumnDef, MRTLikeTableProps, MRTValidationErrors, MRTLikeTableMeta } from './MRTLikeTable/types';
export { filterFnByVariant } from './MRTLikeTable/filters';
