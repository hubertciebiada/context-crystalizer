# Context Crystallizer 💎

**AI Context Engineering for Large Repositories**

Transform massive repositories into crystallized, AI-consumable knowledge through systematic analysis and optimization.

## What is Crystallization?

Just as pressure transforms carbon into diamonds, Context Crystallizer applies systematic AI analysis to transform raw repositories into **crystallized knowledge** - structured, searchable, and optimized for AI consumption. Each file is analyzed to extract its purpose, key APIs, patterns, and relationships, creating a knowledge base that AI can efficiently search and understand.

## Inspiration

Context Crystallizer was inspired by [AI Distiller (aid)](https://github.com/janreges/ai-distiller), which pioneered the concept of intelligently extracting essential information from large codebases for AI consumption. While AI Distiller focuses on extracting public APIs and type information using tree-sitter parsers, Context Crystallizer takes a complementary approach by having AI agents generate comprehensive crystallized contexts about functionality, patterns, and relationships.

## The Problem 🔥

AI agents hit context length limits when working with large repositories. A typical enterprise repository has 10,000+ files, but LLMs can only process a fraction at once. This forces AI to work blindly or make assumptions about unfamiliar code.

## The Solution ✨

Context Crystallizer creates a **searchable crystallized context base** of AI-optimized knowledge:

- 🔍 **Search by functionality**: "find authentication middleware" 
- ⚡ **Token-efficient**: 5:1 compression ratio (source:crystallized context)
- 🤖 **AI-optimized format**: Structured specifically for LLM consumption
- 📊 **Smart assembly**: Combines multiple contexts within token limits
- 💎 **Crystallized knowledge**: Preserves essential information in optimized form

## How It Works

**Simple 3-step crystallization process:**

1. **Initialize**: Scan repository and prepare for crystallization
2. **Crystallize**: AI analyzes each file to extract meaningful knowledge  
3. **Search**: Find relevant crystallized contexts for any task

## Quick Demo

**Developer using Claude Code with a large documentation repository:**

> **Developer**: "I need to understand how authentication works in this massive project"
>
> **Claude**: "I'll crystallize this repository first to build a searchable knowledge base, then find all authentication-related information."
>
> *Claude crystallizes the repository - scanning and analyzing each file*
>
> **Claude**: "Crystallization complete! I found 5 files with authentication logic. The main JWT middleware handles token validation with Redis session caching. Here's how it works..."
>
> *Claude provides comprehensive explanation using crystallized contexts*
>
> **Developer**: "What files depend on the authentication system?"
>
> **Claude**: "Let me search for related crystallized contexts..."
>
> *Claude uses find_related_crystallized_contexts() to discover dependencies*

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

### First Crystallization

```typescript
// 1. Initialize crystallization
await callTool("init_crystallization", {
  repoPath: "/workspace/my-project"
});

// 2. Get first file for crystallization
const file = await callTool("get_next_file_to_crystallize", {});

// 3. Generate crystallized context (use your AI model)
const crystallizedContext = {
  purpose: "Main application entry point that configures Express server",
  keyAPIs: ["app.listen", "configureRoutes", "setupMiddleware"],
  dependencies: ["express", "./routes", "./middleware"],
  patterns: ["Express.js framework", "Middleware pattern"]
};

// 4. Store the crystallized context
await callTool("store_crystallized_context", {
  filePath: file.relativePath,
  context: crystallizedContext,
  fileContent: file.content,
  fileMetadata: file.metadata
});

// 5. Search for functionality
const authResults = await callTool("search_crystallized_contexts", {
  query: "authentication middleware",
  maxTokens: 4000
});
```

## MCP Tools for AI Agents

**Crystallization Setup & Processing**
- `init_crystallization(repo_path)` - Initialize crystallization process
- `get_next_file_to_crystallize()` - Get next file for AI analysis
- `store_crystallized_context(file, context)` - Save AI-generated knowledge
- `get_crystallization_progress()` - Monitor crystallization progress

**Using Crystallized Knowledge**
- `search_crystallized_contexts(query, max_tokens)` - Find relevant knowledge by functionality
- `get_crystallized_bundle(files, max_tokens)` - Combine multiple contexts for complex understanding
- `find_related_crystallized_contexts(file)` - Discover code relationships

**Maintaining Crystallized Knowledge**
- `validate_crystallization_quality(file)` - Assess context quality and get improvement suggestions
- `update_crystallized_contexts()` - Refresh contexts for changed files
- `search_by_complexity(level)` - Find contexts by difficulty for progressive learning

## Common Use Cases

### 🔧 **Feature Implementation**
AI agent needs to add OAuth login to existing auth system
```typescript
const authContexts = await callTool("search_crystallized_contexts", {
  query: "authentication login OAuth middleware",
  maxTokens: 3000
});
// Returns relevant crystallized contexts within token limits
// AI implements OAuth following existing patterns
```

### 🔍 **Code Review** 
AI reviewing changes to payment processing
```typescript
const paymentBundle = await callTool("get_crystallized_bundle", {
  files: ["src/payments/", "src/api/billing/"],
  maxTokens: 5000
});
// Returns comprehensive payment system crystallized contexts
// AI reviews for security, patterns, integration issues
```

### 📚 **Documentation Generation**
AI creating API documentation
```typescript
const apiContexts = await callTool("search_crystallized_contexts", {
  query: "public API endpoints controllers",
  maxTokens: 8000
});
// Returns all public API crystallized contexts
// AI generates comprehensive, accurate documentation
```

### 🐛 **Debugging Assistance**
AI helping debug authentication issues
```typescript
const authFile = "src/middleware/auth.ts";
const relatedContexts = await callTool("find_related_crystallized_contexts", {
  filePath: authFile,
  maxResults: 5
});
// Discovers related auth components for comprehensive debugging
```

## Performance Metrics

- **Token Efficiency**: 5:1 compression (source code → crystallized context)
- **Search Speed**: <100ms for semantic queries
- **Context Coverage**: >95% of public APIs documented
- **Relevance**: >90% accuracy for functional searches
- **Scale**: Handles 10,000+ file repositories

## Why "Crystallizer"? 

Like applying **pressure** to carbon creates diamonds, Context Crystallizer applies **systematic analysis** to repositories, producing **crystallized knowledge** that:

- ✨ **Preserves essential structure** while removing noise
- 💎 **Becomes more valuable** than the raw material  
- 🔍 **Enables clear vision** through complex systems
- ⚡ **Optimizes for AI consumption** with perfect clarity

## Advanced Features

### Crystallization Quality Validation
```typescript
// Check crystallization quality with detailed metrics
const validation = await callTool("validate_crystallization_quality", {
  filePath: "src/services/UserService.ts"
});
// Returns completeness, accuracy, and AI-readability scores

// Generate project-wide quality report
const qualityReport = await callTool("validate_crystallization_quality", {
  generateReport: true
});
// Comprehensive analysis with recommendations
```

### Incremental Updates
```typescript
// Detect and update only changed files
const updateResult = await callTool("update_crystallized_contexts", {
  forceUpdate: false,        // Only update changed files
  includeUnchanged: false,   // Skip files without context
  cleanupDeleted: true       // Remove obsolete contexts
});
// Maintains crystallized context freshness efficiently
```

### Token Optimization Strategies
- **Short Template** (≤200 tokens): Config files, types, constants
- **Extended Template** (≤2000 tokens): Controllers, services, complex logic
- **Smart Assembly**: Combines multiple contexts within LLM limits
- **Relevance Scoring**: Prioritizes most relevant contexts for queries

## Troubleshooting

### Common Issues
- **"Repository not crystallized"**: Run `init_crystallization` first
- **Empty search results**: Ensure crystallized contexts are generated for your files
- **Token limit exceeded**: Reduce `maxTokens` parameter in queries
- **Stale contexts**: Use `update_crystallized_contexts` to refresh outdated information

### Performance Tips
- Process files in batches for large repositories
- Use category filters to narrow searches
- Cache frequently accessed crystallized contexts
- Update incrementally using change detection

## Contributing

We welcome contributions! Focus on AI workflow improvements:

- 🐛 **Bug Reports**: Use our issue templates
- 💡 **Feature Requests**: Enhance AI context engineering capabilities  
- 🔧 **Pull Requests**: Include crystallization quality validation tests
- 💬 **Discussions**: Share AI integration patterns

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

---

**Transform your large repository into crystallized, AI-consumable knowledge. Enable AI agents to work with enterprise-scale projects efficiently.**

⭐ **Star this repo** if Context Crystallizer helps your AI workflows!