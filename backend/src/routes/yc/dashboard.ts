/**
 * YC Dashboard Stats API
 *
 * Provides aggregated statistics for the YC founders dashboard:
 * - Top schools/universities
 * - Top previous companies
 * - Total founders count
 */

import { Router } from "express";
import { db } from "../../database/connection";
import { routeLogger } from "../../utils/logger";

const router = Router();

// YC Batch W26 Organization ID (default for YC endpoints)
const YC_ORGANIZATION_ID = "78e0a525-cc65-44c1-be05-93bb55247fde";

/**
 * GET /api/v1/yc-dashboard/stats
 *
 * Returns aggregated statistics about YC founders:
 * - Top schools (universities)
 * - Top previous companies
 * - Total founders count
 *
 * Query params:
 * - organization_id: Optional, defaults to YC W26
 * - limit: Number of top items to return (default: 10)
 */
router.get("/stats", async (req, res) => {
    routeLogger.info({ query: req.query }, "YC Dashboard stats request");
    try {
        const { organization_id, limit = 10, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const limitNum = parseInt(limit as string, 10);
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        routeLogger.debug({ organization_id: orgId, case_session_id: caseSessionId }, "Fetching dashboard stats");

        const dbInstance = await db;

        // Get top schools from canonical_entities, counting back to datapoint_entity_index
        // Start with canonical entities and count how many datapoint entries link to them
        const topSchools = await dbInstance
            .selectFrom("canonical_entities as ce")
            .innerJoin("datapoint_entity_index as dei", "dei.canonical_entity_id", "ce.id")
            .innerJoin("person", "person.id", "dei.person_id")
            .select((eb) => [
                "ce.name",
                eb.fn.count<number>("person.id").distinct().as("count"),
            ])
            .where("person.organization_id", "=", orgId)
            .where("ce.type", "=", "university")
            .where("dei.entity_type", "=", "university")
            .where("dei.confidence", ">", 0.4)
            .groupBy("ce.name")
            .orderBy("count", "desc")
            .limit(limitNum)
            .execute();

        // Get top companies from canonical_entities, counting back to datapoint_entity_index
        // Start with canonical entities and count distinct founders (person_id) who worked at each company
        const topCompanies = await dbInstance
            .selectFrom("canonical_entities as ce")
            .innerJoin("datapoint_entity_index as dei", "dei.canonical_entity_id", "ce.id")
            .innerJoin("person", "person.id", "dei.person_id")
            .select((eb) => [
                "ce.name",
                eb.fn.count("person.id").distinct().as("founder_count"),
            ])
            .where("person.organization_id", "=", orgId)
            .where("ce.type", "=", "company")
            .where("dei.entity_type", "=", "company")
            .where("dei.confidence", ">", 0.4)
            .groupBy("ce.name")
            .orderBy("founder_count", "desc")
            .limit(limitNum)
            .execute();

        // Get total founders count
        const foundersCount = await dbInstance
            .selectFrom("person")
            .select((eb) => eb.fn.countAll<number>().as("count"))
            .where("organization_id", "=", orgId)
            .executeTakeFirst();

        // Get founders with profile pictures count (for data completeness)
        const foundersWithDataCount = await dbInstance
            .selectFrom("person")
            .innerJoin("person_datapoints", "person_datapoints.person_id", "person.id")
            .select((eb) => eb.fn.count("person.id").distinct().as("count"))
            .where("person.organization_id", "=", orgId)
            .where("person_datapoints.status", "!=", "rejected")
            .executeTakeFirst();

        // Helper function to parse interest compound value
        // Format: intensity_category_subcategory (e.g., "serious_physical_sports_running")
        const parseInterestValue = (entityValue: string, canonicalName: string | null): string => {
            // If we have a canonical_name, use it (it should be the clean subcategory)
            if (canonicalName) {
                // Capitalize first letter and replace underscores with spaces
                return canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1).replace(/_/g, ' ');
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
                return subcategory.charAt(0).toUpperCase() + subcategory.slice(1).replace(/_/g, ' ');
            } else {
                // Not in compound format, use as-is
                return entityValue.charAt(0).toUpperCase() + entityValue.slice(1).replace(/_/g, ' ');
            }
        };

        // Get top interests from canonical_entities, counting distinct founders
        // Count how many unique founders have each interest (not total datapoint entries)
        const topInterestsQuery = await dbInstance
            .selectFrom("canonical_entities as ce")
            .innerJoin("datapoint_entity_index as dei", "dei.canonical_entity_id", "ce.id")
            .innerJoin("person", "person.id", "dei.person_id")
            .select((eb) => [
                "ce.name",
                eb.fn.count<number>("person.id").distinct().as("count"),
            ])
            .where("person.organization_id", "=", orgId)
            .where("ce.type", "=", "interest_subcategory")
            .where("dei.entity_type", "=", "interest")
            .where("dei.confidence", ">", 0.35)
            .groupBy("ce.name")
            .orderBy("count", "desc")
            .limit(limitNum)
            .execute();

        // Format interest names: capitalize first letter and replace underscores with spaces
        // Include both formatted name (for display) and original name (for API calls)
        const topInterests = topInterestsQuery.map(interest => ({
            name: interest.name.charAt(0).toUpperCase() + interest.name.slice(1).replace(/_/g, ' '),
            original_name: interest.name, // Keep original database name for API lookups
            count: Number(interest.count),
        }));

        // Get total interest count for average calculation
        const totalInterestEntities = await dbInstance
            .selectFrom("canonical_entities as ce")
            .innerJoin("datapoint_entity_index as dei", "dei.canonical_entity_id", "ce.id")
            .innerJoin("person", "person.id", "dei.person_id")
            .select((eb) => eb.fn.countAll<number>().as("count"))
            .where("person.organization_id", "=", orgId)
            .where("ce.type", "=", "interest_subcategory")
            .where("dei.entity_type", "=", "interest")
            .where("dei.confidence", ">", 0.35)
            .executeTakeFirst();

        // Calculate average interests per founder
        const totalFounders = Number(foundersCount?.count || 0);
        const totalInterests = Number(totalInterestEntities?.count || 0);
        const avgInterestsPerFounder = totalFounders > 0 
            ? Math.round((totalInterests / totalFounders) * 10) / 10 
            : 0;

        routeLogger.debug({
            total_founders: totalFounders,
            top_schools_count: topSchools.length,
            top_companies_count: topCompanies.length,
            top_interests_count: topInterests.length,
            total_interests: totalInterests,
            avg_interests_per_founder: avgInterestsPerFounder,
        }, "Dashboard stats calculated");

        return res.json({
            success: true,
            data: {
                total_founders: totalFounders,
                founders_with_data: Number(foundersWithDataCount?.count || 0),
                top_schools: topSchools.map(s => ({
                    name: s.name,
                    count: Number(s.count),
                })),
                top_companies: topCompanies.map(c => ({
                    name: c.name,
                    count: Number(c.founder_count),
                })),
                top_interests: topInterests,
                avg_interests_per_founder: avgInterestsPerFounder,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch dashboard stats");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch dashboard stats",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/companies
 *
 * Returns top companies that founders have worked at:
 * - Queries canonical_entities for companies
 * - Counts distinct founders who worked at each company
 * - Returns sorted by founder count
 *
 * Query params:
 * - organization_id: Optional, defaults to YC W26
 * - limit: Number of top companies to return (default: 50)
 */
router.get("/companies", async (req, res) => {
    routeLogger.info({ query: req.query }, "YC Dashboard companies request");
    try {
        const { organization_id, limit = 50, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const limitNum = parseInt(limit as string, 10);
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        routeLogger.debug({ organization_id: orgId }, "Fetching companies");

        const dbInstance = await db;

        // Get total founders count for percentage calculation
        const foundersCount = await dbInstance
            .selectFrom("person")
            .select((eb) => eb.fn.countAll<number>().as("count"))
            .where("organization_id", "=", orgId)
            .executeTakeFirst();

        const totalFounders = Number(foundersCount?.count || 0);

        // Get top companies from canonical_entities, counting distinct founders
        // Start with canonical entities and count how many distinct founders worked at each
        const topCompanies = await dbInstance
            .selectFrom("canonical_entities as ce")
            .innerJoin("datapoint_entity_index as dei", "dei.canonical_entity_id", "ce.id")
            .innerJoin("person", "person.id", "dei.person_id")
            .select((eb) => [
                "ce.name",
                "ce.id",
                eb.fn.count("person.id").distinct().as("founder_count"),
            ])
            .where("person.organization_id", "=", orgId)
            .where("ce.type", "=", "company")
            .where("dei.entity_type", "=", "company")
            .where("dei.confidence", ">", 0.4)
            .groupBy("ce.name")
            .groupBy("ce.id")
            .orderBy("founder_count", "desc")
            .limit(limitNum)
            .execute();

        routeLogger.debug({ count: topCompanies.length }, "Found companies");

        return res.json({
            success: true,
            data: {
                companies: topCompanies.map(c => ({
                    id: c.id,
                    name: c.name,
                    founder_count: Number(c.founder_count),
                    percentage: totalFounders > 0 
                        ? Math.round((Number(c.founder_count) / totalFounders) * 100 * 10) / 10 
                        : 0,
                })),
                total_founders: totalFounders,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch companies");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch companies",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/companies/:companyName/founders
 *
 * Returns founders who worked at a specific company:
 * - Queries datapoint_entity_index for the company
 * - Returns list of founders with their basic info
 *
 * Query params:
 * - organization_id: Optional, defaults to YC W26
 */
router.get("/companies/:companyName/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard company founders request");
    try {
        const { companyName } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        // Decode the company name (URL encoded)
        const decodedCompanyName = decodeURIComponent(companyName);

        routeLogger.debug({ company_name: decodedCompanyName }, "Fetching founders for company");

        const dbInstance = await db;

        // Find the canonical entity for this company
        const canonicalCompany = await dbInstance
            .selectFrom("canonical_entities")
            .selectAll()
            .where("type", "=", "company")
            .where("name", "=", decodedCompanyName)
            .executeTakeFirst();

        if (!canonicalCompany) {
            return res.json({
                success: true,
                data: {
                    founders: [],
                    company_name: decodedCompanyName,
                },
            });
        }

        // Get all founders who worked at this company
        const founders = await dbInstance
            .selectFrom("person")
            .innerJoin("datapoint_entity_index as dei", "dei.person_id", "person.id")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("dei.canonical_entity_id", "=", canonicalCompany.id)
            .where("dei.entity_type", "=", "company")
            .where("dei.confidence", ">", 0.4)
            .groupBy("person.id")
            .groupBy("person.first_name")
            .groupBy("person.last_name")
            .groupBy("person.middle_name")
            .groupBy("person.occupation")
            .groupBy("person.employer")
            .execute();

        // Get profile pictures and LinkedIn URLs from datapoints
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Try to get profile picture from LinkedIn datapoint
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                // If no LinkedIn profile picture, try other platforms
                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({ 
            company_name: decodedCompanyName, 
            founder_count: foundersWithDetails.length 
        }, "Found founders for company");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                company_name: decodedCompanyName,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for company");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for company",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/schools/:schoolName/founders
 * Get all founders who attended a specific school
 */
router.get("/schools/:schoolName/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard school founders request");
    try {
        const { schoolName } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        // Decode the school name (URL encoded)
        const decodedSchoolName = decodeURIComponent(schoolName);

        routeLogger.debug({ school_name: decodedSchoolName }, "Fetching founders for school");

        const dbInstance = await db;

        // Find the canonical entity for this school
        const canonicalSchool = await dbInstance
            .selectFrom("canonical_entities")
            .selectAll()
            .where("type", "in", ["university", "high_school"])
            .where("name", "=", decodedSchoolName)
            .executeTakeFirst();

        if (!canonicalSchool) {
            return res.json({
                success: true,
                data: {
                    founders: [],
                    school_name: decodedSchoolName,
                },
            });
        }

        // Get all founders who attended this school
        const founders = await dbInstance
            .selectFrom("person")
            .innerJoin("datapoint_entity_index as dei", "dei.person_id", "person.id")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("dei.canonical_entity_id", "=", canonicalSchool.id)
            .where("dei.entity_type", "in", ["university", "high_school"])
            .where("dei.confidence", ">", 0.4)
            .groupBy("person.id")
            .groupBy("person.first_name")
            .groupBy("person.last_name")
            .groupBy("person.middle_name")
            .groupBy("person.occupation")
            .groupBy("person.employer")
            .execute();

        // Get profile pictures and LinkedIn URLs from datapoints
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Try to get profile picture from LinkedIn datapoint
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                // If no LinkedIn profile picture, try other platforms
                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({ 
            school_name: decodedSchoolName, 
            founder_count: foundersWithDetails.length 
        }, "Found founders for school");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                school_name: decodedSchoolName,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for school");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for school",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/locations/:locationName/founders
 * Get all founders from a specific location
 */
router.get("/locations/:locationName/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard location founders request");
    try {
        const { locationName } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        // Decode the location name (URL encoded)
        const decodedLocationName = decodeURIComponent(locationName);

        routeLogger.debug({ location_name: decodedLocationName }, "Fetching founders for location");

        const dbInstance = await db;

        // Find the canonical entity for this location
        const canonicalLocation = await dbInstance
            .selectFrom("canonical_entities")
            .selectAll()
            .where("type", "=", "location")
            .where("name", "=", decodedLocationName)
            .executeTakeFirst();

        if (!canonicalLocation) {
            return res.json({
                success: true,
                data: {
                    founders: [],
                    location_name: decodedLocationName,
                },
            });
        }

        // Get all founders from this location
        const founders = await dbInstance
            .selectFrom("person")
            .innerJoin("datapoint_entity_index as dei", "dei.person_id", "person.id")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("dei.canonical_entity_id", "=", canonicalLocation.id)
            .where("dei.entity_type", "=", "location")
            .where("dei.confidence", ">", 0.4)
            .groupBy("person.id")
            .groupBy("person.first_name")
            .groupBy("person.last_name")
            .groupBy("person.middle_name")
            .groupBy("person.occupation")
            .groupBy("person.employer")
            .execute();

        // Get profile pictures and LinkedIn URLs from datapoints
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Try to get profile picture from LinkedIn datapoint
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                // If no LinkedIn profile picture, try other platforms
                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({ 
            location_name: decodedLocationName, 
            founder_count: foundersWithDetails.length 
        }, "Found founders for location");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                location_name: decodedLocationName,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for location");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for location",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/interests/:interestName/founders
 * Get all founders interested in a specific topic
 */
router.get("/interests/:interestName/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard interest founders request");
    try {
        const { interestName } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        // Decode the interest name (URL encoded)
        const decodedInterestName = decodeURIComponent(interestName);

        routeLogger.debug({ interest_name: decodedInterestName }, "Fetching founders for interest");

        const dbInstance = await db;

        // Find the canonical entity for this interest
        // Interest names are stored in lowercase with underscores (e.g., "machine_learning")
        // The frontend sends formatted names (e.g., "Programming" or "Machine Learning")
        // We need to normalize back to database format (e.g., "programming" or "machine_learning")
        
        // Normalize: lowercase, replace spaces with underscores, trim
        const normalizedInterestName = decodedInterestName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, ''); // Remove any special characters
        
        routeLogger.debug({ 
            original: decodedInterestName,
            normalized: normalizedInterestName 
        }, "Normalizing interest name");

        const canonicalInterest = await dbInstance
            .selectFrom("canonical_entities")
            .selectAll()
            .where("type", "=", "interest_subcategory")
            .where("name", "=", normalizedInterestName)
            .executeTakeFirst();

        if (!canonicalInterest) {
            routeLogger.warn({ 
                interest_name: decodedInterestName,
                normalized_name: normalizedInterestName,
                case_session_id: caseSessionId
            }, "No canonical interest entity found - returning empty results");
            return res.json({
                success: true,
                data: {
                    founders: [],
                    interest_name: decodedInterestName,
                },
            });
        }

        routeLogger.debug({ 
            interest_name: decodedInterestName,
            canonical_id: canonicalInterest.id,
            canonical_name: canonicalInterest.name
        }, "Found canonical interest entity");

        // Get all founders with this interest
        const founders = await dbInstance
            .selectFrom("person")
            .innerJoin("datapoint_entity_index as dei", "dei.person_id", "person.id")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("dei.canonical_entity_id", "=", canonicalInterest.id)
            .where("dei.entity_type", "=", "interest")
            .where("dei.confidence", ">", 0.35)
            .groupBy("person.id")
            .groupBy("person.first_name")
            .groupBy("person.last_name")
            .groupBy("person.middle_name")
            .groupBy("person.occupation")
            .groupBy("person.employer")
            .execute();

        // Get profile pictures and LinkedIn URLs from datapoints
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Try to get profile picture from LinkedIn datapoint
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                // If no LinkedIn profile picture, try other platforms
                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({
            interest_name: decodedInterestName,
            founder_count: foundersWithDetails.length
        }, "Found founders for interest");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                interest_name: decodedInterestName,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for interest");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for interest",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/occupations/:occupationTitle/founders
 * Get all founders with a specific occupation/role
 */
router.get("/occupations/:occupationTitle/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard occupation founders request");
    try {
        const { occupationTitle } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        // case_session_id is now optional, falls back to organization_id

        // Decode the occupation title (URL encoded)
        const decodedOccupationTitle = decodeURIComponent(occupationTitle);

        routeLogger.debug({ occupation_title: decodedOccupationTitle }, "Fetching founders for occupation");

        const dbInstance = await db;

        // Find the canonical entity for this occupation
        // Occupation titles are stored in lowercase with underscores (e.g., "software_engineer")
        const normalizedOccupationTitle = decodedOccupationTitle.toLowerCase().replace(/ /g, '_');

        const canonicalOccupation = await dbInstance
            .selectFrom("canonical_entities")
            .selectAll()
            .where("type", "=", "occupation")
            .where("name", "=", normalizedOccupationTitle)
            .executeTakeFirst();

        if (!canonicalOccupation) {
            return res.json({
                success: true,
                data: {
                    founders: [],
                    occupation_title: decodedOccupationTitle,
                },
            });
        }

        // Get all founders with this occupation
        const founders = await dbInstance
            .selectFrom("person")
            .innerJoin("datapoint_entity_index as dei", "dei.person_id", "person.id")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("person.organization_id", "=", orgId)
            .where("dei.canonical_entity_id", "=", canonicalOccupation.id)
            .where("dei.entity_type", "=", "occupation")
            .where("dei.confidence", ">", 0.4)
            .groupBy("person.id")
            .groupBy("person.first_name")
            .groupBy("person.last_name")
            .groupBy("person.middle_name")
            .groupBy("person.occupation")
            .groupBy("person.employer")
            .execute();

        // Get profile pictures and LinkedIn URLs from datapoints
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                // Try to get profile picture from LinkedIn datapoint
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                // If no LinkedIn profile picture, try other platforms
                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({
            occupation_title: decodedOccupationTitle,
            founder_count: foundersWithDetails.length
        }, "Found founders for occupation");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                occupation_title: decodedOccupationTitle,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for occupation");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for occupation",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/education-levels
 *
 * Returns education level distribution from LinkedIn data:
 * - Bachelor's, Master's, MBA, PhD, MD, JD
 * - Counts unique founders with each degree type
 */
router.get("/education-levels", async (req, res) => {
    routeLogger.info({ query: req.query }, "YC Dashboard education levels request");
    try {
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        routeLogger.debug({ organization_id: orgId, case_session_id: caseSessionId }, "Fetching education levels");

        const dbInstance = await db;

        // Get total founders count for percentage calculation
        const foundersCount = await dbInstance
            .selectFrom("person")
            .select((eb) => eb.fn.countAll<number>().as("count"))
            .where("organization_id", "=", orgId)
            .executeTakeFirst();

        const totalFounders = Number(foundersCount?.count || 0);

        // Get all LinkedIn profile datapoints
        const linkedinProfiles = await dbInstance
            .selectFrom("person_datapoints")
            .innerJoin("person", "person.id", "person_datapoints.person_id")
            .select(["person.id as person_id", "person_datapoints.structured_data"])
            .where("person.organization_id", "=", orgId)
            .where("person_datapoints.type", "=", "linkedin")
            .where("person_datapoints.data_category", "=", "profile")
            .where("person_datapoints.status", "!=", "rejected")
            .execute();

        // Categorize founders by highest education level
        const educationLevelCounts: Record<string, Set<string>> = {
            "PhD / Doctorate": new Set(),
            "MBA": new Set(),
            "Master's Degree": new Set(),
            "Bachelor's Degree": new Set(),
        };

        for (const profile of linkedinProfiles) {
            if (!profile.structured_data) continue;

            const sd = profile.structured_data as any;
            const education = sd.profile?.education || [];

            let highestLevel: string | null = null;

            // Check each education entry and track the highest level
            for (const edu of education) {
                const degree = (edu.degree_name || edu.degree || "").toLowerCase();

                if (degree.includes("phd") || degree.includes("ph.d") || degree.includes("doctor")) {
                    highestLevel = "PhD / Doctorate";
                    break; // PhD is highest, stop searching
                } else if (degree.includes("mba") || degree.includes("m.b.a")) {
                    if (!highestLevel || highestLevel === "Master's Degree" || highestLevel === "Bachelor's Degree") {
                        highestLevel = "MBA";
                    }
                } else if (degree.includes("master") || degree.includes("ms") || degree.includes("ma ") || degree.includes("m.s") || degree.includes("m.a")) {
                    if (!highestLevel || highestLevel === "Bachelor's Degree") {
                        highestLevel = "Master's Degree";
                    }
                } else if (degree.includes("bachelor") || degree.includes("bs") || degree.includes("ba ") || degree.includes("b.s") || degree.includes("b.a") || degree.includes("undergraduate")) {
                    if (!highestLevel) {
                        highestLevel = "Bachelor's Degree";
                    }
                }
            }

            // Add founder to their highest education level category
            if (highestLevel && profile.person_id) {
                educationLevelCounts[highestLevel].add(profile.person_id);
            }
        }

        // Convert to array format with counts and percentages
        const educationLevels = Object.entries(educationLevelCounts)
            .map(([level, people]) => ({
                level,
                count: people.size,
                percentage: totalFounders > 0
                    ? Math.round((people.size / totalFounders) * 100 * 10) / 10
                    : 0,
            }))
            .filter(item => item.count > 0) // Only include levels with at least one founder
            .sort((a, b) => b.count - a.count); // Sort by count descending

        routeLogger.debug({
            total_founders: totalFounders,
            education_levels_count: educationLevels.length,
        }, "Education levels calculated");

        return res.json({
            success: true,
            data: {
                education_levels: educationLevels,
                total_founders: totalFounders,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch education levels");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch education levels",
        });
    }
});

/**
 * GET /api/v1/yc-dashboard/education-levels/:levelName/founders
 * Get all founders with a specific education level
 */
router.get("/education-levels/:levelName/founders", async (req, res) => {
    routeLogger.info({ params: req.params, query: req.query }, "YC Dashboard education level founders request");
    try {
        const { levelName } = req.params;
        const { organization_id, case_session_id } = req.query;
        const orgId = (organization_id as string) || YC_ORGANIZATION_ID;
        const caseSessionId = case_session_id as string;

        const decodedLevelName = decodeURIComponent(levelName);
        routeLogger.debug({ level_name: decodedLevelName }, "Fetching founders for education level");

        const dbInstance = await db;

        // Get all LinkedIn profile datapoints
        const linkedinProfiles = await dbInstance
            .selectFrom("person_datapoints")
            .innerJoin("person", "person.id", "person_datapoints.person_id")
            .select(["person.id as person_id", "person_datapoints.structured_data"])
            .where("person.organization_id", "=", orgId)
            .where("person_datapoints.type", "=", "linkedin")
            .where("person_datapoints.data_category", "=", "profile")
            .where("person_datapoints.status", "!=", "rejected")
            .execute();

        // Find founders with the requested education level
        const matchingPersonIds = new Set<string>();

        for (const profile of linkedinProfiles) {
            if (!profile.structured_data || !profile.person_id) continue;

            const sd = profile.structured_data as any;
            const education = sd.profile?.education || [];

            let highestLevel: string | null = null;

            // Check each education entry and track the highest level
            for (const edu of education) {
                const degree = (edu.degree_name || edu.degree || "").toLowerCase();

                if (degree.includes("phd") || degree.includes("ph.d") || degree.includes("doctor")) {
                    highestLevel = "PhD / Doctorate";
                    break;
                } else if (degree.includes("mba") || degree.includes("m.b.a")) {
                    if (!highestLevel || highestLevel === "Master's Degree" || highestLevel === "Bachelor's Degree") {
                        highestLevel = "MBA";
                    }
                } else if (degree.includes("master") || degree.includes("ms") || degree.includes("ma ") || degree.includes("m.s") || degree.includes("m.a")) {
                    if (!highestLevel || highestLevel === "Bachelor's Degree") {
                        highestLevel = "Master's Degree";
                    }
                } else if (degree.includes("bachelor") || degree.includes("bs") || degree.includes("ba ") || degree.includes("b.s") || degree.includes("b.a") || degree.includes("undergraduate")) {
                    if (!highestLevel) {
                        highestLevel = "Bachelor's Degree";
                    }
                }
            }

            if (highestLevel === decodedLevelName) {
                matchingPersonIds.add(profile.person_id);
            }
        }

        if (matchingPersonIds.size === 0) {
            return res.json({
                success: true,
                data: {
                    founders: [],
                    level_name: decodedLevelName,
                },
            });
        }

        // Get founder details for matching person IDs
        const founders = await dbInstance
            .selectFrom("person")
            .select([
                "person.id",
                "person.first_name",
                "person.last_name",
                "person.middle_name",
                "person.occupation",
                "person.employer",
            ])
            .where("person.organization_id", "=", orgId)
            .where("person.id", "in", Array.from(matchingPersonIds))
            .execute();

        // Get profile pictures and LinkedIn URLs
        const foundersWithDetails = await Promise.all(
            founders.map(async (founder) => {
                const linkedinDatapoint = await dbInstance
                    .selectFrom("person_datapoints")
                    .select(["structured_data"])
                    .where("person_id", "=", founder.id)
                    .where("type", "=", "linkedin")
                    .where("data_category", "=", "profile")
                    .where("status", "!=", "rejected")
                    .orderBy("confidence", "desc")
                    .limit(1)
                    .executeTakeFirst();

                let profilePictureUrl: string | null = null;
                let linkedinUrl: string | null = null;

                if (linkedinDatapoint?.structured_data) {
                    const structuredData = linkedinDatapoint.structured_data as any;
                    profilePictureUrl = structuredData.profile?.profile_image_url || null;
                    linkedinUrl = structuredData.profile?.profile_url || null;
                }

                if (!profilePictureUrl) {
                    const otherDatapoint = await dbInstance
                        .selectFrom("person_datapoints")
                        .select(["structured_data", "type"])
                        .where("person_id", "=", founder.id)
                        .where("data_category", "=", "profile")
                        .where("status", "!=", "rejected")
                        .where("type", "in", ["instagram", "facebook", "twitter"])
                        .orderBy("confidence", "desc")
                        .limit(1)
                        .executeTakeFirst();

                    if (otherDatapoint?.structured_data) {
                        const structuredData = otherDatapoint.structured_data as any;
                        profilePictureUrl = structuredData.profile?.profile_picture_url ||
                                          structuredData.profile?.profile_image_url ||
                                          null;
                    }
                }

                return {
                    id: founder.id,
                    name: `${founder.first_name} ${founder.middle_name || ""} ${founder.last_name}`.trim(),
                    first_name: founder.first_name,
                    last_name: founder.last_name,
                    profile_picture_url: profilePictureUrl,
                    linkedin_url: linkedinUrl,
                    current_role: founder.occupation || "Founder",
                    current_company: founder.employer,
                };
            })
        );

        routeLogger.debug({
            level_name: decodedLevelName,
            founder_count: foundersWithDetails.length
        }, "Found founders for education level");

        return res.json({
            success: true,
            data: {
                founders: foundersWithDetails,
                level_name: decodedLevelName,
            },
        });
    } catch (error) {
        routeLogger.error({ error }, "Failed to fetch founders for education level");
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch founders for education level",
        });
    }
});

export default router;
