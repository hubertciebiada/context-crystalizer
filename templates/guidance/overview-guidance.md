# Overview Template (≤50 tokens)

**Purpose**: Ultra-compact analysis for indexing and search. Focus on essential identification information.

## Required Fields

### purpose (required)
- **Max tokens**: 20
- **Format**: Single sentence describing what this file does
- **Focus**: Primary function, not implementation details
- **Example**: "Authentication middleware that validates JWT tokens for API requests"

### keyTerms (required)
- **Max tokens**: 25
- **Format**: Array of 3-6 searchable keywords (use FULL words, not abbreviations)
- **Focus**: Technologies, patterns, domain concepts that AI agents would search for
- **Storage**: Full terms are stored in metadata - system automatically abbreviates for index display
- **Priority**: These terms appear in the compact index - optimize for searchability
- **Ordering**: **CRITICAL** - Order from most important to least important (first terms show in truncated index)
- **Example**: ["authentication", "JWT", "middleware", "security", "API", "validation"] (auth most important)
- **Note**: Write "authentication" not "auth" - abbreviation happens automatically in index

### category (required)
- **Max tokens**: 5
- **Format**: Single category from: config, source, test, docs, other
- **Focus**: File classification for filtering

### complexity (required)
- **Max tokens**: 5
- **Format**: Single value from: low, medium, high
- **Focus**: Logical/cognitive complexity of content, NOT file size
- **Low**: Simple configs, basic utilities, straightforward documentation
- **Medium**: Standard business logic, moderate abstractions, typical components
- **High**: Complex algorithms, intricate state machines, dense abstractions

## Analysis Guidelines

1. **Be concise**: Every word must add search value
2. **Use searchable terms**: Include keywords AI agents would look for
3. **Focus on "what"**: Not "how" - describe function, not implementation
4. **Think search**: What would someone type to find this file?

## Expected JSON Output Structure
```json
{
  "purpose": "Authentication middleware that validates JWT tokens for API requests",
  "keyTerms": ["JWT", "authentication", "middleware", "API", "validation"],
  "category": "source",
  "complexity": "medium"
}
```

## Compact Index Integration
- **Always generate**: Overview analysis feeds into the compact AI index
- **Index format**: Your analysis appears as `🔴 [full/file/path.ext](./context/full/file/path.ext.context.md) (250t) auth,config,db`  
- **Term abbreviation**: Full keyTerms you provide get automatically shortened in index only
- **Abbreviation mapping**: authentication→auth, configuration→config, database→db, middleware→mw, management→mgmt, application→app, endpoint→ep, service→svc
- **Searchability**: keyTerms become the primary search mechanism for AI agents
- **File access**: Full paths preserved so AI tools can open files correctly
- **Prioritization**: Files sorted by complexity (high→medium→low) then token count

## When to Use
- **Always**: Generate overview for every file to create searchable index
- **Goal**: Enable semantic search across entire repository  
- **Benefit**: AI agents can quickly locate relevant files without reading full contexts