# Context Crystallizer 💎

**AI Context Engineering for Large Codebases**

Transform massive repositories into crystallized, AI-consumable context through systematic analysis and optimization. Enable AI agents to work effectively with enterprise-scale projects by providing token-efficient, LLM-optimized context.

## The Problem 🔥

AI agents hit context length limits when working with large codebases. A typical enterprise repository has 10,000+ files, but LLMs can only process a fraction at once. This forces AI to work blindly or make assumptions about unfamiliar code.

## The Solution ✨

Context Crystallizer creates a **searchable knowledge base** of AI-optimized context:

- 🔍 **AI agents search by functionality**: "find authentication middleware" 
- ⚡ **Token-efficient context**: 5:1 compression ratio (source:context)
- 🤖 **LLM-optimized format**: Structured specifically for AI consumption
- 🪞 **Mirrored navigation**: Preserves codebase spatial relationships
- 📊 **Smart assembly**: Combines multiple contexts within token limits

## Quick Demo

```bash
# Install globally
npm install -g context-crystallizer

# AI agent workflow
AI → init_crystallization("/path/to/enterprise-repo")
Server → "✓ Queued 247 relevant files for analysis"

AI → get_next_file() 
Server → Returns file content + metadata
AI → Analyzes and generates compressed context
AI → store_ai_context(file_path, optimized_context)

# Later: AI needs authentication context
AI → search_context("JWT authentication middleware", max_tokens=4000)
Server → Returns ranked, token-optimized context bundle
AI → Uses context to implement features following existing patterns
```

## Architecture

```
┌─────────────────────────────────────┐
│            AI Agent                 │
│    "I need auth context"            │
└─────────────┬───────────────────────┘
              │ MCP Tools
┌─────────────┴───────────────────────┐
│      Context Crystallizer          │
│   • File scanning & queueing       │
│   • AI context optimization        │
│   • Semantic search engine         │
│   • Token-aware assembly           │
└─────────────┬───────────────────────┘
              │
┌─────────────┴───────────────────────┐
│    Crystallized Knowledge Base      │
│                                     │
│  .context-crystalizer/              │
│  ├── ai-index.md                    │
│  ├── context/                       │
│  │   └── src/auth/                  │
│  │       └── middleware.py.context.md │
│  └── ai-metadata/                   │
└─────────────────────────────────────┘
```

## AI Context Structure

### AI-Optimized Context Example
```markdown
# AI Context: src/auth/middleware.py

## Purpose
JWT authentication middleware for API requests

## Key APIs for AI
- authenticate_user(request) → validates JWT tokens
- refresh_session(user_id) → updates Redis session cache  
- handle_auth_failure(error) → standardized error responses

## Context Dependencies  
- jwt: token operations
- redis: session storage
- user_service: validation
- config.security: JWT secrets

## AI Implementation Patterns
- Error handling: Returns 401/403 responses
- Performance: 5min cache for validations
- Security: Rate limiting (100 req/min per IP)
- Integration: Used by all /api/protected/* routes

## Related Contexts
- [auth/models.py](./models.py.context.md) - User data models
- [api/routes.py](../api/routes.py.context.md) - Protected endpoints
```

## MCP Tools for AI Agents

10 specialized tools for systematic codebase analysis:

| Tool | Purpose | AI Usage |
|------|---------|----------|
| `init_crystallization(repo_path)` | Prepare codebase | Initialize large repo analysis |
| `get_next_file()` | Serve files systematically | Generate context progressively |
| `store_ai_context(file, context)` | Save optimized context | Store AI-generated analysis |
| `search_context(query, max_tokens)` | Find relevant context | Retrieve context for tasks |
| `get_context_bundle(files, max_tokens)` | Assemble multi-file context | Understand complex workflows |
| `find_related_contexts(file)` | Discover relationships | Explore code connections |
| `validate_context_quality(file)` | Check context quality | Ensure AI-consumable output |
| `update_context()` | Refresh stale contexts | Maintain accuracy over time |
| `search_by_complexity(level)` | Find by difficulty | Learn patterns systematically |
| `get_context_status()` | Monitor progress | Track analysis completion |

## Performance Metrics

- **Token Efficiency**: 5:1 compression (source code → AI context)
- **Search Speed**: <100ms for semantic queries
- **Context Coverage**: >95% of public APIs documented
- **Relevance**: >90% accuracy for functional searches
- **Scale**: Handles 10,000+ file repositories

## Installation & Setup

### Quick Start (5 minutes)

```bash
# Install globally via NPM
npm install -g context-crystallizer

# Navigate to your project
cd /path/to/your/project

# Start the MCP server
context-crystallizer
```

### Claude Desktop Integration

Add to your Claude Desktop configuration (`~/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "context-crystallizer": {
      "command": "npx",
      "args": ["context-crystallizer"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### First Analysis

```typescript
// 1. Initialize repository
await callTool("init_crystallization", {
  repoPath: "/workspace/my-project"
});

// 2. Get first file for analysis
const file = await callTool("get_next_file", {});

// 3. Generate AI context (use your AI model)
const context = {
  purpose: "Main application entry point that configures Express server",
  keyAPIs: ["app.listen", "configureRoutes", "setupMiddleware"],
  dependencies: ["express", "./routes", "./middleware"],
  patterns: ["Express.js framework", "Middleware pattern"]
};

// 4. Store the optimized context
await callTool("store_ai_context", {
  filePath: file.relativePath,
  context,
  fileContent: file.content,
  fileMetadata: file.metadata
});

// 5. Search for functionality
const authResults = await callTool("search_context", {
  query: "authentication middleware",
  maxTokens: 4000
});
```

## Common Use Cases

### 🔧 **Feature Implementation**
AI agent needs to add OAuth login to existing auth system
```typescript
const authContext = await callTool("search_context", {
  query: "authentication login OAuth middleware",
  maxTokens: 3000
});
// Returns relevant auth context within token limits
// AI implements OAuth following existing patterns
```

### 🔍 **Code Review** 
AI reviewing changes to payment processing
```typescript
const paymentBundle = await callTool("get_context_bundle", {
  files: ["src/payments/", "src/api/billing/"],
  maxTokens: 5000
});
// Returns comprehensive payment system context
// AI reviews for security, patterns, integration issues
```

### 📚 **Documentation Generation**
AI creating API documentation
```typescript
const apiContext = await callTool("search_context", {
  query: "public API endpoints controllers",
  maxTokens: 8000
});
// Returns all public API context
// AI generates comprehensive, accurate documentation
```

### 🐛 **Debugging Assistance**
AI helping debug authentication issues
```typescript
const authFile = "src/middleware/auth.ts";
const relatedContexts = await callTool("find_related_contexts", {
  filePath: authFile,
  maxResults: 5
});
// Discovers related auth components for comprehensive debugging
```

### 🔄 **Refactoring Support**
AI analyzing complex files for improvement opportunities
```typescript
const complexFiles = await callTool("search_by_complexity", {
  complexity: "high",
  maxResults: 10
});
// Identifies candidates for refactoring based on complexity
```

## Why "Crystallizer"? 

Like applying **pressure** to carbon creates diamonds, Context Crystallizer applies **systematic analysis** to code, producing **crystallized knowledge** that:

- ✨ **Preserves essential structure** while removing noise
- 💎 **Becomes more valuable** than the raw material  
- 🔍 **Enables clear vision** through complex systems
- ⚡ **Optimizes for AI consumption** with perfect clarity

## Advanced Features

### Context Quality Validation
```typescript
// Check context quality with detailed metrics
const validation = await callTool("validate_context_quality", {
  filePath: "src/services/UserService.ts"
});
// Returns completeness, accuracy, and AI-readability scores

// Generate project-wide quality report
const qualityReport = await callTool("validate_context_quality", {
  generateReport: true
});
// Comprehensive analysis with recommendations
```

### Incremental Updates
```typescript
// Detect and update only changed files
const updateResult = await callTool("update_context", {
  forceUpdate: false,        // Only update changed files
  includeUnchanged: false,   // Skip files without context
  cleanupDeleted: true       // Remove obsolete contexts
});
// Maintains context freshness efficiently
```

### Token Optimization Strategies
- **Short Template** (≤200 tokens): Config files, types, constants
- **Extended Template** (≤2000 tokens): Controllers, services, complex logic
- **Smart Assembly**: Combines multiple contexts within LLM limits
- **Relevance Scoring**: Prioritizes most relevant contexts for queries

## Troubleshooting

### Common Issues
- **"Repository not initialized"**: Run `init_crystallization` first
- **Empty search results**: Ensure contexts are generated for your files
- **Token limit exceeded**: Reduce `maxTokens` parameter in queries
- **Stale contexts**: Use `update_context` to refresh outdated information

### Performance Tips
- Process files in batches for large repositories
- Use category filters to narrow searches
- Cache frequently accessed contexts
- Update incrementally using change detection

## Contributing

We welcome contributions! Focus on AI workflow improvements:

- 🐛 **Bug Reports**: Use our issue templates
- 💡 **Feature Requests**: Enhance AI context engineering capabilities  
- 🔧 **Pull Requests**: Include AI context validation tests
- 💬 **Discussions**: Share AI integration patterns

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

---

**Transform your large codebase into AI-consumable knowledge. Enable AI agents to work with enterprise-scale projects efficiently.**

⭐ **Star this repo** if Context Crystallizer helps your AI workflows!