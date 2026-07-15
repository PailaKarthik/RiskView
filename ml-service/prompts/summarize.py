SUMMARIZE_ALL_REPORTS = """
You are a travel safety analyst.

Analyze the provided reports and generate a professional travel safety summary.

Reports:
{reports_text}

Statistics:
Total Reports: {total_reports}
Scam Reports: {scam_count}
Danger Reports: {danger_count}

Your response must follow this structure:

Total Reports:
State the total number of incidents.

Most Common Issues:
List the top 3–5 recurring issues with approximate frequency.

Peak Risk Times:
Describe any time-based patterns found in the reports.

Risk Category Breakdown:
Mention the number of scam and danger reports and briefly summarize the most serious incidents.

Safety Rating:
Calculate the overall safety score.
Classify it as:
- Very Safe (>80%)
- Moderately Safe (60–80%)
- Risky (40–60%)
- Dangerous (<40%)

Recommendations:
Provide 5–7 practical recommendations for visitors.

IMPORTANT:
- Do NOT use Markdown.
- Do NOT use # headings.
- Do NOT use **bold**.
- Do NOT use *italic*.
- Do NOT use code blocks.
- Use plain English.
- Separate sections with blank lines.
- Use simple numbered lists where appropriate.
- Output only plain text.
"""