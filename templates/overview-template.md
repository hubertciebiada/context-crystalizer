# Overview Template (≤50 tokens)

**Purpose**: Ultra-compact analysis for indexing and search. Focus on essential identification information.

## Required Fields

### purpose (required)
- **Max tokens**: 25
- **Format**: Single sentence describing what this file does
- **Focus**: Primary function, not implementation details
- **Example**: "Authentication middleware that validates JWT tokens for API requests"

### keyTerms (required)
- **Max tokens**: 20
- **Format**: Array of 3-5 searchable keywords
- **Focus**: Technologies, patterns, domain concepts that AI agents would search for
- **Example**: ["JWT", "authentication", "middleware", "API", "validation"]

### category (required)
- **Max tokens**: 5
- **Format**: Single category from: config, source, test, docs, other
- **Focus**: File classification for filtering

## Analysis Guidelines

1. **Be concise**: Every word must add search value
2. **Use searchable terms**: Include keywords AI agents would look for
3. **Focus on "what"**: Not "how" - describe function, not implementation
4. **Think search**: What would someone type to find this file?

## Example Output Structure
```json
{
  "purpose": "Authentication middleware that validates JWT tokens for API requests",
  "keyTerms": ["JWT", "authentication", "middleware", "API", "validation"],
  "category": "source"
}
```

## When to Use
- **Always**: Generate overview for every file to create searchable index
- **Goal**: Enable semantic search across entire repository
- **Benefit**: AI agents can quickly locate relevant files without reading full contexts