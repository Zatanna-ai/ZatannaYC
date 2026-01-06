/**
 * YC Founders Directory API
 *
 * Provides endpoints for browsing and viewing YC founder profiles:
 * - List all founders with key info
 * - Get individual founder details
 */

import { Router } from "express";
import { db } from "../../database/connection";
import { routeLogger } from "../../utils/logger";

const router = Router();

// YC Batch W26 Organization ID (default for YC endpoints)
const YC_ORGANIZATION_ID = "78e0a525-cc65-44c1-be05-93bb55247fde";

/**
 * GET /api/v1/yc-founders
 *
 * Returns a list of all YC founders with key information:
 * - Name
 * - Current company/occupation
 * - Profile picture
 * - LinkedIn URL
 * - Brief summary
 *
 * Query params:
 * - organization_id: Optional, defaults to YC W26
 * - limit: Number of founders to return (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * - search: Optional search term to filter by name
 */
router.get("/", async (req, res) => {
    try {
        const {
            organization_id,
            limit = 50,
            offset = 0,
            search,
            case_session_id
        } = req.query;

        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const limitNum = Math.min(parseInt(limit as string, 10), 200);
        const offsetNum = parseInt(offset as string, 10);
        const searchTerm = search as string | undefined;
        const caseSessionId = case_session_id as string;

        if (!caseSessionId) {
            return res.status(400).json({
                success: false,
                error: "case_session_id is required"
            });
        }

        routeLogger.info({ 
            organization_id: orgId, 
            limit: limitNum, 
            offset: offsetNum, 
            search: searchTerm 
        }, "Fetching founders list");

        const dbInstance = await db;

        // Helper function to build base query with filters
        const buildBaseQuery = () => {
            let query = dbInstance
                .selectFrom("person")
                .where("person.case_session_id", "=", caseSessionId);

            // Add search filter if provided
            if (searchTerm) {
                query = query.where((eb) =>
                    eb.or([
                        eb("person.first_name", "ilike", `%${searchTerm}%`),
                        eb("person.last_name", "ilike", `%${searchTerm}%`),
                        eb("person.occupation", "ilike", `%${searchTerm}%`),
                        eb("person.employer", "ilike", `%${searchTerm}%`),
                    ])
                );
            }

            return query;
        };

        // Get total count for pagination (separate query without column selects)
        const countQuery = await buildBaseQuery()
            .select((eb) => eb.fn.countAll<number>().as("total"))
            .executeTakeFirst();
        const totalCount = Number(countQuery?.total || 0);

        // Build the actual data query with column selects (fresh query builder)
        let query = buildBaseQuery()
            .select([
                "person.id",
                "person.first_name",
                "person.middle_name",
                "person.last_name",
                "person.occupation",
                "person.employer",
                "person.location",
            ]);

        // Get paginated founders
        const founders = await query
            .orderBy("person.created_at", "desc")
            .limit(limitNum)
            .offset(offsetNum)
            .execute();

        routeLogger.debug({ 
            found: founders.length, 
            total: totalCount 
        }, "Found founders");

        // For each founder, get their profile picture, LinkedIn URL, and top occupation
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Get profile picture from datapoints (prioritize LinkedIn)
                let profilePictureUrl: string | null = null;

                const profileDatapoints = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["type", "structured_data"])
                    .where("person_id", "=", founder.id)
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
                    } else if (platform === "instagram" && profile.profile_picture_url) {
                        profilePictureUrl = profile.profile_picture_url;
                    } else if (platform === "facebook" && profile.profile_picture_url) {
                        profilePictureUrl = profile.profile_picture_url;
                    } else if (platform === "twitter" && profile.profile_image_url) {
                        profilePictureUrl = profile.profile_image_url;
                    }
                }

                // Get LinkedIn URL from datapoint_entity_index
                const linkedinEntity = await dbInstance
                    .selectFrom("datapoint_entity_index")
                    .select("source_url")
                    .where("person_id", "=", founder.id)
                    .where("source_name", "=", "linkedin_enrichment")
                    .executeTakeFirst();

                // Get top occupation from entity index (most confident one)
                const topOccupation = await dbInstance
                    .selectFrom("datapoint_entity_index")
                    .select(["entity_value", "confidence"])
                    .where("person_id", "=", founder.id)
                    .where("entity_type", "=", "occupation")
                    .orderBy("confidence", "desc")
                    .executeTakeFirst();

                // Get top company from entity index
                const topCompany = await dbInstance
                    .selectFrom("datapoint_entity_index")
                    .select((eb) => [
                        eb.fn.coalesce("canonical_name", "entity_value").as("name"),
                        "confidence",
                    ])
                    .where("person_id", "=", founder.id)
                    .where("entity_type", "=", "company")
                    .orderBy("confidence", "desc")
                    .executeTakeFirst();

                // Get all companies for this founder (for list view)
                const allCompanyEntities = await dbInstance
                    .selectFrom("datapoint_entity_index")
                    .select((eb) => [
                        eb.fn.coalesce("canonical_name", "entity_value").as("name"),
                    ])
                    .where("person_id", "=", founder.id)
                    .where("entity_type", "=", "company")
                    .where("confidence", ">", 0.35)
                    .execute();

                // Extract unique company names (deduplicate in JavaScript)
                const companyNamesSet = new Set<string>();
                allCompanyEntities.forEach(c => {
                    if (c.name) companyNamesSet.add(c.name as string);
                });
                const companyNames = Array.from(companyNamesSet).sort();
                const currentCompanyName = topCompany?.name || founder.employer || null;
                const previousCompanies = companyNames.filter(name => name !== currentCompanyName);

                // Get top universities (linked to canonical entities)
                const universityEntities = await dbInstance
                    .selectFrom("datapoint_entity_index as dei")
                    .innerJoin("canonical_entities as ce", "ce.id", "dei.canonical_entity_id")
                    .select(["ce.name"])
                    .where("dei.person_id", "=", founder.id)
                    .where("dei.entity_type", "=", "university")
                    .where("dei.confidence", ">", 0.4)
                    .orderBy("dei.confidence", "desc")
                    .limit(3)
                    .execute();

                const universities = universityEntities.map(u => u.name as string);

                // Get top interests (linked to canonical entities)
                const interestEntities = await dbInstance
                    .selectFrom("datapoint_entity_index as dei")
                    .innerJoin("canonical_entities as ce", "ce.id", "dei.canonical_entity_id")
                    .select(["ce.name"])
                    .where("dei.person_id", "=", founder.id)
                    .where("dei.entity_type", "=", "interest")
                    .where("dei.confidence", ">", 0.35)
                    .where("ce.type", "=", "interest_subcategory")
                    .orderBy("dei.confidence", "desc")
                    .limit(5)
                    .execute();

                const interests = interestEntities.map(i => i.name as string);

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    current_role: topOccupation?.entity_value || founder.occupation || "Founder",
                    current_company: currentCompanyName,
                    previous_companies: previousCompanies,
                    companies: companyNames, // All companies including current
                    universities: universities,
                    interests: interests,
                    location: founder.location || null,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinEntity?.source_url || null,
                };
            })
        );

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                pagination: {
                    total: totalCount,
                    limit: limitNum,
                    offset: offsetNum,
                    has_more: offsetNum + limitNum < totalCount,
                },
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders",
        });
    }
});

/**
 * GET /api/v1/yc-founders/:id
 *
 * Returns detailed information about a specific founder:
 * - Full profile data
 * - All datapoints (education, companies, interests, etc.)
 * - Aggregated entities (schools, companies, locations)
 * - Social media links
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        if (!caseSessionId) {
            return res.status(400).json({
                success: false,
                error: "case_session_id is required"
            });
        }

        routeLogger.info({ founder_id: id }, "Fetching founder details");

        const dbInstance = await db;

        // Get founder basic info
        const founder = await dbInstance
            .selectFrom("person")
            .selectAll()
            .where("id", "=", id)
            .where("case_session_id", "=", caseSessionId)
            .executeTakeFirst();

        if (!founder) {
            return res.status(404).json({
                success: false,
                error: "Founder not found",
            });
        }

        // Helper function to parse interest compound value
        // Format: intensity_category_subcategory (e.g., "serious_physical_sports_running")
        const parseInterestValue = (entityValue: string, canonicalName: string | null): { name: string; intensity?: string; category?: string } => {
            // If we have a canonical_name, use it (it should be the clean subcategory)
            if (canonicalName) {
                // Capitalize first letter and replace underscores with spaces
                const displayName = canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1).replace(/_/g, ' ');
                return { name: displayName };
            }

            // Otherwise, parse the compound value
            const parts = entityValue.split('_');
            const intensityMap: Record<string, string> = {
                'casual': 'Casual',
                'enthusiast': 'Enthusiast',
                'serious': 'Serious',
                'professional': 'Professional',
            };

            // Check if first part is an intensity
            const intensity = intensityMap[parts[0]];
            if (intensity && parts.length >= 3) {
                // Format: intensity_category_subcategory
                // Extract subcategory (last part) as the interest name
                const subcategory = parts[parts.length - 1];
                const displayName = subcategory.charAt(0).toUpperCase() + subcategory.slice(1).replace(/_/g, ' ');
                return {
                    name: displayName,
                    intensity: intensity,
                    category: parts.slice(1, -1).join('_'), // Everything between intensity and subcategory
                };
            } else {
                // Not in compound format, use as-is
                const displayName = entityValue.charAt(0).toUpperCase() + entityValue.slice(1).replace(/_/g, ' ');
                return { name: displayName };
            }
        };

        // Get all entities for this founder, grouped by type
        const entities = await dbInstance
            .selectFrom("datapoint_entity_index")
            .select((eb) => [
                "entity_type",
                "entity_value",
                "canonical_name",
                "confidence",
                "source_url",
            ])
            .where("person_id", "=", id)
            .where("confidence", ">", 0.35)
            .orderBy("entity_type")
            .orderBy("confidence", "desc")
            .execute();

        // Group entities by type
        const groupedEntities: Record<string, Array<{ name: string; confidence: number; source_url: string | null; intensity?: string; category?: string }>> = {};

        for (const entity of entities) {
            if (!groupedEntities[entity.entity_type]) {
                groupedEntities[entity.entity_type] = [];
            }

            // For interests, parse the compound value
            if (entity.entity_type === 'interest') {
                const parsed = parseInterestValue(entity.entity_value, entity.canonical_name);
                groupedEntities[entity.entity_type].push({
                    name: parsed.name,
                    confidence: entity.confidence,
                    source_url: entity.source_url,
                    intensity: parsed.intensity,
                    category: parsed.category,
                });
            } else {
                // For other entity types, use canonical_name or entity_value
                const displayName = entity.canonical_name || entity.entity_value;
                groupedEntities[entity.entity_type].push({
                    name: displayName,
                    confidence: entity.confidence,
                    source_url: entity.source_url,
                });
            }
        }

        // Get all datapoints for this founder
        const datapoints = await dbInstance
            .selectFrom("person_datapoints")
            .select([
                "id",
                "url",
                "title",
                "snippet",
                "type",
                "platform_type",
                "data_category",
                "structured_data",
                "confidence",
                "status",
                "created_at",
            ])
            .where("person_id", "=", id)
            .where("status", "!=", "rejected")
            .orderBy("confidence", "desc")
            .execute();

        // Extract profile pictures, social links, and LinkedIn bio
        let profilePictureUrl: string | null = null;
        let linkedinBio: string | null = null;
        const socialLinks: Record<string, string> = {};

        for (const datapoint of datapoints) {
            if (datapoint.data_category === "profile" && datapoint.structured_data) {
                const structuredData = datapoint.structured_data as any;
                const profile = structuredData.profile;

                if (profile) {
                    const platform = datapoint.type;

                    // Store social link
                    if (datapoint.url) {
                        socialLinks[platform] = datapoint.url;
                    }

                    // Get profile picture (prioritize LinkedIn)
                    if (!profilePictureUrl || platform === "linkedin") {
                        if (platform === "linkedin" && profile.profile_image_url) {
                            profilePictureUrl = profile.profile_image_url;
                        } else if (platform === "instagram" && profile.profile_picture_url) {
                            profilePictureUrl = profile.profile_picture_url;
                        } else if (platform === "facebook" && profile.profile_picture_url) {
                            profilePictureUrl = profile.profile_picture_url;
                        } else if (platform === "twitter" && profile.profile_image_url) {
                            profilePictureUrl = profile.profile_image_url;
                        }
                    }

                    // Get LinkedIn bio/summary
                    if (platform === "linkedin" && profile.summary) {
                        linkedinBio = profile.summary;
                    }
                }
            }
        }

        // Format datapoints for response
        const formattedDatapoints = datapoints.map(dp => ({
            id: dp.id,
            url: dp.url,
            title: dp.title,
            snippet: dp.snippet,
            type: dp.type,
            platform_type: dp.platform_type,
            category: dp.data_category,
            confidence: dp.confidence,
            created_at: dp.created_at.toISOString(),
        }));

        // Extract companies separately - all companies (not just current)
        const allCompanies = groupedEntities.company || [];
        // Current company is the one in person.employer or the most confident company
        const currentCompanyName = founder.employer || (allCompanies.length > 0 ? allCompanies[0].name : null);
        // Previous companies are all companies except the current one
        const previousCompanies = allCompanies
            .filter(company => company.name !== currentCompanyName)
            .map(company => ({
                name: company.name,
                confidence: company.confidence,
                source_url: company.source_url,
            }));

        return res.json({
            success: true,
            data: {
                id: founder.id,
                name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                first_name: founder.first_name,
                middle_name: founder.middle_name,
                last_name: founder.last_name,
                age: founder.age,
                location: founder.location,
                occupation: founder.occupation,
                employer: founder.employer,
                current_company: currentCompanyName,
                previous_companies: previousCompanies,
                bias_score: founder.bias_score,
                profile_picture_url: profilePictureUrl,
                linkedin_bio: linkedinBio,
                social_links: socialLinks,
                entities: groupedEntities,
                datapoints: formattedDatapoints,
                datapoint_count: datapoints.length,
                created_at: founder.created_at.toISOString(),
                updated_at: founder.updated_at.toISOString(),
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founder details");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founder details",
        });
    }
});

export default router;
