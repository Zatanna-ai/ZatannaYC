/**
 * YC Founder Discovery - Search YC founders in our database
 *
 * discover-yc endpoint: Query our database of YC founders → Match by role → Rank by criteria → Return matches
 */

import { Router } from "express";
import { db } from "../../database/connection";
import { parseYCQuery } from "./ycQueryParser";
import { EmbeddingService } from "../../services/embedding/EmbeddingService";
import { sql } from "kysely";
import { routeLogger } from "../../utils/logger";

const router = Router();

/**
 * POST /api/v1/discover-yc
 *
 * Search YC founders in database:
 * 1. Parse query to extract subject (role/occupation) and criteria (interests/schools/etc)
 * 2. Find founders matching subject by comparing embeddings against canonical entities
 * 3. Rank founders by criteria relevance using canonical entity embeddings
 * 4. Return top matches with relevant datapoints
 *
 * Body: {
 *   "query": "CTOs who went to Michigan",
 *   "organization_id": "org-123",  // Optional, defaults to YC organization
 *   "num_results": 20
 * }
 * Returns: {
 *   query: string,
 *   parsed_query: { subject, criteria },
 *   founders_found: number,
 *   top_founders: [{ name, person_id, relevance_score, matching_entities, ... }]
 * }
 */
// YC Batch W26 Organization ID (default for discover-yc endpoint)
const YC_ORGANIZATION_ID = "78e0a525-cc65-44c1-be05-93bb55247fde";

router.post("/", async (req, res) => {
    try {
        const { query, organization_id, num_results = 20 } = req.body;
        const { case_session_id } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: "query is required",
            });
        }

        if (!case_session_id) {
            return res.status(400).json({
                success: false,
                error: "case_session_id is required as query parameter",
            });
        }

        // Default to YC organization ID if not provided
        const orgId = organization_id || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        routeLogger.info({ query, organization_id: orgId }, "Starting YC discover search");
        const startTime = Date.now();

        // Step 1: Parse the query
        routeLogger.debug("Parsing query");
        const parsedQuery = await parseYCQuery(query);
        routeLogger.debug({
            subject: parsedQuery.subject,
            subject_variations: parsedQuery.subject_variations,
            criteria_type: parsedQuery.criteria_type,
            criteria_count: parsedQuery.criteria.length,
            criteria: parsedQuery.criteria,
        }, "Query parsed");

        // Step 2: Generate embeddings for query terms using 512-dim embeddings
        const embeddingService = new EmbeddingService("text-embedding-3-small", 512);
        const dbInstance = await db;

        // Generate embeddings for subject variations and criteria
        const subjectTexts = [parsedQuery.subject, ...parsedQuery.subject_variations];
        // Step 3: Use Postgres vector search to find similar canonical entities for subject
        routeLogger.debug({ count: subjectTexts.length }, "Generating embeddings for subject variations");
        const subjectEmbeddings = await embeddingService.embedBatch(subjectTexts);

        // Find top N similar canonical entities for subject using vector search
        const SUBJECT_LIMIT = 100; // Top 100 similar occupation entities
        const subjectCanonicalEntities: Array<{
            id: string;
            name: string;
            type: string;
            similarity: number;
        }> = [];

        for (const subjectEmbedding of subjectEmbeddings) {
            const embeddingVector = `[${subjectEmbedding.join(",")}]`;
            const results = await dbInstance
                .selectFrom("canonical_entities")
                .select([
                    "id",
                    "name",
                    "type",
                    sql<number>`1 - (embedding_512 <=> ${embeddingVector}::vector)`.as("similarity"),
                ])
                .where("embedding_512", "is not", null)
                .where("type", "=", "occupation") // Subject is typically occupation/role
                .orderBy(sql`embedding_512 <=> ${embeddingVector}::vector`)
                .limit(SUBJECT_LIMIT)
                .execute();

            subjectCanonicalEntities.push(...results);
        }

        // Dedupe and keep highest similarity for each canonical entity
        const subjectCanonicalMap = new Map<string, typeof subjectCanonicalEntities[0]>();
        for (const entity of subjectCanonicalEntities) {
            const existing = subjectCanonicalMap.get(entity.id);
            if (!existing || entity.similarity > existing.similarity) {
                subjectCanonicalMap.set(entity.id, entity);
            }
        }
        const uniqueSubjectCanonicals = Array.from(subjectCanonicalMap.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, SUBJECT_LIMIT);

        routeLogger.debug({ count: uniqueSubjectCanonicals.length }, "Found similar canonical subject entities");
        routeLogger.debug({
            top_entities: uniqueSubjectCanonicals.slice(0, 5).map(e => ({
                name: e.name,
                type: e.type,
                similarity: e.similarity,
            }))
        }, "Top subject canonical entities");

        // Step 4: Use Postgres vector search to find similar canonical entities for criteria
        routeLogger.debug({ count: parsedQuery.criteria.length }, "Generating embeddings for criteria");
        const criteriaEmbeddings = await embeddingService.embedBatch(parsedQuery.criteria);

        // Find top N similar canonical entities for criteria using vector search
        const CRITERIA_LIMIT = 100; // Top 100 similar location/school/company entities
        const criteriaCanonicalEntities: Array<{
            id: string;
            name: string;
            type: string;
            similarity: number;
        }> = [];

        for (const criteriaEmbedding of criteriaEmbeddings) {
            const embeddingVector = `[${criteriaEmbedding.join(",")}]`;
            const results = await dbInstance
                .selectFrom("canonical_entities")
                .select([
                    "id",
                    "name",
                    "type",
                    sql<number>`1 - (embedding_512 <=> ${embeddingVector}::vector)`.as("similarity"),
                ])
                .where("embedding_512", "is not", null)
                // Criteria can be location, company, university, etc.
                .where("type", "in", ["location", "company", "university", "high_school", "interest_subcategory"])
                .orderBy(sql`embedding_512 <=> ${embeddingVector}::vector`)
                .limit(CRITERIA_LIMIT)
                .execute();

            criteriaCanonicalEntities.push(...results);
        }

        // Dedupe and keep highest similarity for each canonical entity
        const criteriaCanonicalMap = new Map<string, typeof criteriaCanonicalEntities[0]>();
        for (const entity of criteriaCanonicalEntities) {
            const existing = criteriaCanonicalMap.get(entity.id);
            if (!existing || entity.similarity > existing.similarity) {
                criteriaCanonicalMap.set(entity.id, entity);
            }
        }
        const uniqueCriteriaCanonicals = Array.from(criteriaCanonicalMap.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, CRITERIA_LIMIT);

        routeLogger.debug({ count: uniqueCriteriaCanonicals.length }, "Found similar canonical criteria entities");
        routeLogger.debug({
            top_entities: uniqueCriteriaCanonicals.slice(0, 5).map(e => ({
                name: e.name,
                type: e.type,
                similarity: e.similarity,
            }))
        }, "Top criteria canonical entities");

        // Step 5: Look backwards - find people who have these canonical entities
        const subjectCanonicalIds = uniqueSubjectCanonicals.map(e => e.id);
        const criteriaCanonicalIds = uniqueCriteriaCanonicals.map(e => e.id);
        const allCanonicalIds = [...subjectCanonicalIds, ...criteriaCanonicalIds];

        routeLogger.debug({ count: allCanonicalIds.length }, "Finding people with canonical entities");

        const personEntitiesRaw = await dbInstance
            .selectFrom("datapoint_entity_index as dei")
            .innerJoin("person", "person.id", "dei.person_id")
            .select([
                "dei.person_id",
                "dei.entity_type",
                "dei.entity_value",
                "dei.canonical_name",
                "dei.canonical_entity_id",
                "dei.confidence",
                "dei.datapoint_id",
            ])
            .where("dei.canonical_entity_id", "in", allCanonicalIds)
            .where("dei.confidence", ">", 0.35)
            .where("person.case_session_id", "=", caseSessionId)
            .execute();

        routeLogger.debug({ count: personEntitiesRaw.length }, "Found entity matches across people");

        // Group by person
        const entitiesByPerson = new Map<string, typeof personEntitiesRaw>();
        for (const entity of personEntitiesRaw) {
            if (!entitiesByPerson.has(entity.person_id)) {
                entitiesByPerson.set(entity.person_id, []);
            }
            entitiesByPerson.get(entity.person_id)!.push(entity);
        }

        routeLogger.debug({ count: entitiesByPerson.size }, "Found unique people with matching entities");

        // Step 6: Score each person based on their matched canonical entities
        // Create lookup maps for similarity scores
        const subjectSimilarityMap = new Map(uniqueSubjectCanonicals.map(e => [e.id, e.similarity]));
        const criteriaSimilarityMap = new Map(uniqueCriteriaCanonicals.map(e => [e.id, e.similarity]));

        const personScores = new Map<string, {
            subjectScore: number;
            criteriaScore: number;
            combinedScore: number;
            subjectMatches: Array<{ entity_value: string; entity_type: string; similarity: number; datapoint_id: string | null }>;
            criteriaMatches: Array<{ entity_value: string; entity_type: string; similarity: number; datapoint_id: string | null }>;
            matchedOccupation: string;
            matchedEntityType: string;
        }>();

        for (const [personId, personEntities] of entitiesByPerson.entries()) {
            const subjectMatches: Array<{ entity_value: string; entity_type: string; similarity: number; datapoint_id: string | null }> = [];
            const criteriaMatches: Array<{ entity_value: string; entity_type: string; similarity: number; datapoint_id: string | null }> = [];

            for (const entity of personEntities) {
                const canonicalId = entity.canonical_entity_id;
                if (!canonicalId) continue;

                // Check if this entity matches subject canonical entities
                const subjectSimilarity = subjectSimilarityMap.get(canonicalId);
                if (subjectSimilarity !== undefined && subjectSimilarity > 0.3) {
                    subjectMatches.push({
                        entity_value: entity.entity_value,
                        entity_type: entity.entity_type,
                        similarity: subjectSimilarity,
                        datapoint_id: entity.datapoint_id,
                    });
                }

                // Check if this entity matches criteria canonical entities
                const criteriaSimilarity = criteriaSimilarityMap.get(canonicalId);
                if (criteriaSimilarity !== undefined && criteriaSimilarity > 0.4) {
                    criteriaMatches.push({
                        entity_value: entity.canonical_name || entity.entity_value,
                        entity_type: entity.entity_type,
                        similarity: criteriaSimilarity,
                        datapoint_id: entity.datapoint_id,
                    });
                }
            }

            // Get top 5 subject matches (by similarity)
            const top5Subject = subjectMatches
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
            const subjectScore = top5Subject.reduce((sum, m) => sum + m.similarity, 0);

            // Get top 5 criteria matches (by similarity)
            const top5Criteria = criteriaMatches
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 5);
            const criteriaScore = top5Criteria.reduce((sum, m) => sum + m.similarity, 0);

            // Combined score = sum of both
            const combinedScore = subjectScore + criteriaScore;

            // Find best matching occupation for display
            const bestSubjectMatch = top5Subject[0];
            const matchedOccupation = bestSubjectMatch?.entity_value || "unknown";
            const matchedEntityType = bestSubjectMatch?.entity_type || "unknown";

            // Only add to scores if person has at least one match
            if (subjectMatches.length > 0 || criteriaMatches.length > 0) {
                personScores.set(personId, {
                    subjectScore,
                    criteriaScore,
                    combinedScore,
                    subjectMatches: top5Subject,
                    criteriaMatches: top5Criteria,
                    matchedOccupation,
                    matchedEntityType,
                });
            }
        }

        routeLogger.debug({ 
            with_matches: personScores.size, 
            total_people: entitiesByPerson.size 
        }, "People with matches");

        // Debug: Show distribution of match counts
        let peopleWithSubjectMatches = 0;
        let peopleWithCriteriaMatches = 0;
        let peopleWithBothMatches = 0;
        for (const [_, scores] of personScores) {
            const hasSubject = scores.subjectMatches.length > 0;
            const hasCriteria = scores.criteriaMatches.length > 0;
            if (hasSubject) peopleWithSubjectMatches++;
            if (hasCriteria) peopleWithCriteriaMatches++;
            if (hasSubject && hasCriteria) peopleWithBothMatches++;
        }
        routeLogger.debug({
            with_subject: peopleWithSubjectMatches,
            with_criteria: peopleWithCriteriaMatches,
            with_both: peopleWithBothMatches,
        }, "Match breakdown");

        // Sort by combined score and take top results
        const allCandidates = Array.from(personScores.entries())
            .sort((a, b) => b[1].combinedScore - a[1].combinedScore)
            .slice(0, num_results * 2) // Take 2x for final processing
            .map(([person_id, data]) => ({
                person_id,
                ...data,
            }));

        routeLogger.debug({ count: allCandidates.length }, "Found candidates");
        routeLogger.debug({
            top_scores: allCandidates.slice(0, 3).map(c => ({
                person_id: c.person_id,
                subject: c.subjectScore,
                criteria: c.criteriaScore,
                combined: c.combinedScore,
            }))
        }, "Top combined scores");

        if (allCandidates.length === 0) {
            return res.json({
                success: true,
                data: {
                    query,
                    parsed_query: parsedQuery,
                    founders_found: 0,
                    top_founders: [],
                    message: `No founders found`,
                    elapsed_time_ms: Date.now() - startTime,
                },
            });
        }

        // Step 5: Process top candidates to get full details
        const rankedFounders = await Promise.all(
            allCandidates.map(async (candidate) => {
                // Combine subject and criteria matches for display
                const allMatches = [
                    ...candidate.subjectMatches.map(m => ({
                        ...m,
                        match_type: 'subject' as const,
                    })),
                    ...candidate.criteriaMatches.map(m => ({
                        ...m,
                        match_type: 'criteria' as const,
                    })),
                ].sort((a, b) => b.similarity - a.similarity);

                // Get unique datapoint IDs from top 5 subject matches (preserve order)
                const seenSubjectDatapoints = new Set<string>();
                const topSubjectDatapointIds: string[] = [];
                for (const match of candidate.subjectMatches) {
                    if (match.datapoint_id && !seenSubjectDatapoints.has(match.datapoint_id) && topSubjectDatapointIds.length < 5) {
                        topSubjectDatapointIds.push(match.datapoint_id);
                        seenSubjectDatapoints.add(match.datapoint_id);
                    }
                }

                // Get unique datapoint IDs from top 5 criteria matches (preserve order)
                const seenCriteriaDatapoints = new Set<string>();
                const topCriteriaDatapointIds: string[] = [];
                for (const match of candidate.criteriaMatches) {
                    if (match.datapoint_id && !seenCriteriaDatapoints.has(match.datapoint_id) && topCriteriaDatapointIds.length < 5) {
                        topCriteriaDatapointIds.push(match.datapoint_id);
                        seenCriteriaDatapoints.add(match.datapoint_id);
                    }
                }

                // Fetch top 5 subject datapoints (preserve order)
                let subjectDatapoints: Array<{
                    id: string;
                    url: string;
                    title: string | null;
                    snippet: string | null;
                }> = [];

                if (topSubjectDatapointIds.length > 0) {
                    const datapointsWithData = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["id", "url", "title", "snippet"])
                        .where("id", "in", topSubjectDatapointIds)
                        .execute();

                    // Create a map for quick lookup
                    const datapointMap = new Map(datapointsWithData.map(dp => [dp.id, dp]));

                    // Preserve the order from topSubjectDatapointIds
                    subjectDatapoints = topSubjectDatapointIds
                        .map(id => datapointMap.get(id))
                        .filter((dp): dp is typeof datapointsWithData[0] => dp !== undefined)
                        .map(dp => ({
                            id: dp.id,
                            url: dp.url,
                            title: dp.title,
                            snippet: dp.snippet,
                        }));
                }

                // Fetch top 5 criteria datapoints (preserve order)
                let criteriaDatapoints: Array<{
                    id: string;
                    url: string;
                    title: string | null;
                    snippet: string | null;
                }> = [];

                if (topCriteriaDatapointIds.length > 0) {
                    const datapointsWithData = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["id", "url", "title", "snippet"])
                        .where("id", "in", topCriteriaDatapointIds)
                        .execute();

                    // Create a map for quick lookup
                    const datapointMap = new Map(datapointsWithData.map(dp => [dp.id, dp]));

                    // Preserve the order from topCriteriaDatapointIds
                    criteriaDatapoints = topCriteriaDatapointIds
                        .map(id => datapointMap.get(id))
                        .filter((dp): dp is typeof datapointsWithData[0] => dp !== undefined)
                        .map(dp => ({
                            id: dp.id,
                            url: dp.url,
                            title: dp.title,
                            snippet: dp.snippet,
                        }));
                }

                // Always fetch profile picture from ALL profile datapoints (not just top 5)
                // Prioritize LinkedIn, then Instagram, Facebook, Twitter
                let profilePictureUrl: string | null = null;

                const profileDatapoints = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["id", "type", "structured_data", "data_category"])
                    .where("person_id", "=", candidate.person_id)
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .execute();

                // Priority order: LinkedIn > Instagram > Facebook > Twitter
                const platformPriority = ["linkedin", "instagram", "facebook", "twitter"];

                for (const platform of platformPriority) {
                    if (profilePictureUrl) break;

                    const platformDatapoint = profileDatapoints.find(
                        dp => dp.type === platform || (dp.structured_data as any)?.platform === platform
                    );

                    if (!platformDatapoint?.structured_data) continue;

                    const structuredData = platformDatapoint.structured_data as any;
                    const profile = structuredData.profile;

                    if (!profile) continue;

                    // Extract profile picture based on platform
                    if (platform === "linkedin" && profile.profile_image_url) {
                        profilePictureUrl = profile.profile_image_url;
                        break;
                    } else if (platform === "instagram" && profile.profile_picture_url) {
                        profilePictureUrl = profile.profile_picture_url;
                        break;
                    } else if (platform === "facebook" && profile.profile_picture_url) {
                        profilePictureUrl = profile.profile_picture_url;
                        break;
                    } else if (platform === "twitter" && profile.profile_image_url) {
                        profilePictureUrl = profile.profile_image_url;
                        break;
                    }
                }

                // Get LinkedIn URL from datapoint_entity_index
                const linkedinEntity = await dbInstance
                    .selectFrom("datapoint_entity_index")
                    .select("source_url")
                    .where("person_id", "=", candidate.person_id)
                    .where("source_name", "=", "linkedin_enrichment")
                    .executeTakeFirst();

                // Calculate normalized scores for display
                // Subject score: sum of top 5 (already calculated)
                // Criteria score: sum of top 5 (already calculated)
                // Normalize both to 0-1 range for display (divide by 5.0 max possible)
                const normalizedSubjectScore = candidate.subjectScore / 5.0;
                const normalizedCriteriaScore = candidate.criteriaScore / 5.0;

                // Combined score is already the sum of both (no weighting needed)
                // This ensures someone with strong criteria but moderate subject can still rank high

                // Get person details
                const person = await dbInstance
                    .selectFrom("person")
                    .select(["id", "first_name", "last_name", "middle_name"])
                    .where("id", "=", candidate.person_id)
                    .executeTakeFirst();

                return {
                    person_id: candidate.person_id,
                    name: person ? `${person.first_name} ${person.middle_name || ""} ${person.last_name}`.trim() : "Unknown",
                    linkedin_url: linkedinEntity?.source_url || null,
                    profile_picture_url: profilePictureUrl,
                    matched_occupation: candidate.matchedOccupation,
                    occupation_score: normalizedSubjectScore,
                    criteria_score: normalizedCriteriaScore,
                    combined_score: candidate.combinedScore,
                    matching_entities: allMatches.slice(0, 10).map(({ datapoint_id, match_type, ...rest }) => rest), // Top 10 without datapoint_id
                    subject_datapoints: subjectDatapoints,
                    criteria_datapoints: criteriaDatapoints,
                };
            })
        );

        // Sort by combined score and take top results
        const topFounders = rankedFounders
            .sort((a, b) => b.combined_score - a.combined_score)
            .slice(0, num_results);

        routeLogger.info({
            founders_found: topFounders.length,
            elapsed_ms: Date.now() - startTime,
        }, "YC discover search completed");

        const elapsedMs = Date.now() - startTime;

        return res.json({
            success: true,
            data: {
                query,
                parsed_query: {
                    subject: parsedQuery.subject,
                    criteria: parsedQuery.criteria,
                    criteria_type: parsedQuery.criteria_type,
                },
                founders_found: topFounders.length,
                top_founders: topFounders,
                elapsed_time_ms: elapsedMs,
                elapsed_time_seconds: Math.round(elapsedMs / 1000),
            },
        });
    } catch (error) {
        routeLogger.error({ err: error }, "YC discover search failed");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to search YC founders",
        });
    }
});

export default router;
