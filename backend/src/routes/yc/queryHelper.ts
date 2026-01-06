/**
 * Query Helper - Flexible person filtering
 *
 * Handles both case_session_id and organization_id filtering
 * Falls back to organization_id if case_session_id returns no results
 */

import { SelectQueryBuilder } from 'kysely';

const YC_ORGANIZATION_ID = process.env.YC_ORGANIZATION_ID || '78e0a525-cc65-44c1-be05-93bb55247fde';

/**
 * Apply person filter to a query
 * Uses case_session_id if available, otherwise falls back to organization_id
 */
export function applyPersonFilter<DB, TB extends string, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  caseSessionId?: string,
  organizationId?: string
): SelectQueryBuilder<DB, TB, O> {
  const orgId = organizationId || YC_ORGANIZATION_ID;

  // Always filter by organization first
  let filteredQuery = query.where('person.organization_id' as any, '=', orgId);

  // Add case_session_id filter if provided (production scenario)
  // In local dev, case_session_id might be null, so we skip this filter
  if (caseSessionId) {
    // Check if we should use case_session_id filter
    // We'll use it if it's provided, but queries will still work without it
    // thanks to the organization_id filter above
    filteredQuery = filteredQuery.where('person.case_session_id' as any, '=', caseSessionId);
  }

  return filteredQuery;
}
