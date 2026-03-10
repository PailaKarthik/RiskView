"""Prompt templates for summarization tasks."""

SUMMARIZE_ALL_REPORTS = """You are a travel safety analyst. Analyze the provided reports from this location and generate a comprehensive safety summary.

Reports:
{reports_text}

Statistics:
- Total Reports: {total_reports}
- Scam Reports: {scam_count}
- Danger Reports: {danger_count}

Provide a structured summary including:

1. **Total Reports**: {total_reports} incidents reported at this location

2. **Most Common Issues**: 
   - Identify and list the top 3-5 recurring safety issues across all reports
   - Show frequency of each issue

3. **Peak Risk Times**: 
   - Analyze temporal patterns from report timestamps
   - Identify high-risk time periods (if available)
   - Show pattern of when incidents occur

4. **Risk Category Breakdown**: 
   - Scam Reports: {scam_count}
   - Danger Reports: {danger_count}
   - Brief description of the most serious incidents at this location

5. **Safety Rating**: 
   - Overall Safety Score: Calculate as (safe incidents / total incidents) * 100
   - Rate as: Very Safe (>80%), Moderately Safe (60-80%), Risky (40-60%), Dangerous (<40%)

6. **Recommendations**:
   - Provide 5-7 specific, actionable safety recommendations for visitors to this location
   - Include alerts about high-risk times or situations
   - Suggest preventive measures based on identified patterns

Format the response clearly with sections, bullet points, and percentage values where applicable.
Note: User can see the specific location on the map, so focus on describing safety patterns and recommendations.
"""

RAG_QUESTION = """Based on the provided travel safety reports, answer the following question:

Question: {question}

Reports Context:
{context}

Provide a clear, concise answer supported by evidence from the reports."""
