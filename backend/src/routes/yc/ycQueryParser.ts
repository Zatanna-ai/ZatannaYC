import { callLLMWithSchema, MODELS, LLMMessage } from "../../llm/llmProvider";
import { ExecutionContextBuilder } from "../../core/ExecutionContext";
import { z } from "zod";
import { routeLogger } from "../../utils/logger";

/**
 * Parse YC founder search queries into structured components
 *
 * Examples:
 * - "CTOs who went to Michigan" → { subject: "CTO", criteria: ["University of Michigan", "Michigan State University"] }
 * - "founders interested in AI from Stanford" → { subject: "founder", criteria: ["AI", "Stanford University"] }
 * - "engineers who like weightlifting" → { subject: "engineer", criteria: ["weightlifting"] }
 */

const YCQuerySchema = z.object({
    subject: z.string().describe("The role, occupation, or type of person (e.g., 'CTO', 'founder', 'engineer')"),
    subject_variations: z.array(z.string()).describe("Variations and related terms for the subject (e.g., for 'CTO': ['Chief Technology Officer', 'technology executive', 'technical lead'])"),
    criteria: z.array(z.string()).describe("The interests, locations, schools, or other attributes to match (expanded with variations)"),
    criteria_type: z.enum(["interest", "education", "location", "company", "mixed"]).describe("Primary type of criteria being searched"),
    reasoning: z.string().describe("Brief explanation of the parsing"),
});

export type YCQuery = z.infer<typeof YCQuerySchema>;

export async function parseYCQuery(query: string): Promise<YCQuery> {
    routeLogger.debug({ query }, "Parsing YC query");

    const prompt = `QUERY: "${query}"

STEP 1: Find occupation word
- Look for: engineer, CTO, founder, CEO, developer, designer, etc.
- This becomes SUBJECT

STEP 2: Split remaining words into separate criteria items
- Each company = separate item
- Each school = separate item with variations
- Each location = separate item

STEP 3: Expand each criteria item with variations

EXAMPLE 1:
INPUT: "coinbase engineer from michigan"
STEP 1: occupation = "engineer"
STEP 2: remaining = "coinbase" + "michigan"
STEP 3: expand
OUTPUT:
{
  "subject": "engineer",
  "subject_variations": ["software engineer", "developer", "programmer"],
  "criteria": ["Coinbase", "Coinbase Inc", "University of Michigan", "Michigan State", "UMich"],
  "criteria_type": "mixed"
}

EXAMPLE 2:
INPUT: "Meta CTO from Stanford"
STEP 1: occupation = "CTO"
STEP 2: remaining = "Meta" + "Stanford"
STEP 3: expand
OUTPUT:
{
  "subject": "CTO",
  "subject_variations": ["Chief Technology Officer", "VP Engineering"],
  "criteria": ["Meta", "Facebook", "Meta Platforms", "Stanford University", "Stanford"],
  "criteria_type": "mixed"
}

NOW PARSE: "${query}"`;


    try {
        const context = ExecutionContextBuilder.fromParams({
            personId: "system",
            userId: "system",
            organizationId: "system",
        });

        const messages: LLMMessage[] = [
                {
                    role: "system",
                    content: "You are a query parser specialized in understanding YC founder search queries. Extract structured components and expand search terms with relevant variations.",
                },
                {
                    role: "user",
                    content: prompt,
                },
        ];

        const result = await callLLMWithSchema<YCQuery>(
            messages,
            MODELS.gemini.flash25,
            "yc_query_parsing",
            context,
            "other",
            YCQuerySchema,
            "YCQuery",
            {},
            {
                temperature: 0.3,
            }
        );

        routeLogger.debug({
            subject: result.content.subject,
            subject_variations: result.content.subject_variations,
            criteria: result.content.criteria,
            criteria_type: result.content.criteria_type,
        }, "YC query parsed");

        return result.content;
    } catch (error) {
        routeLogger.error({ error }, "YC query parsing failed, using fallback");
        // Simple fallback
        return {
            subject: "founder",
            subject_variations: ["co-founder", "startup founder"],
            criteria: [query],
            criteria_type: "mixed",
            reasoning: "Fallback parsing due to LLM error",
        };
    }
}
