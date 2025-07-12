# Context Crystallizer 💎

**AI Context Engineering for Large Codebases**

Transform massive repositories into crystallized, AI-consumable context. Like applying pressure to carbon to create diamonds, Context Crystallizer applies systematic analysis to code, producing clear, searchable context optimized for AI agents working with enterprise-scale projects.

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
│  .context-crystal/                  │
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

| Tool | Purpose | AI Usage |
|------|---------|----------|
| `init_crystallization(repo_path)` | Prepare codebase | Initialize large repo analysis |
| `get_next_file()` | Serve files systematically | Generate context progressively |
| `store_ai_context(file, context)` | Save optimized context | Store AI-generated analysis |
| `search_context(query, max_tokens)` | Find relevant context | Retrieve context for tasks |
| `get_context_bundle(files, max_tokens)` | Assemble multi-file context | Understand complex workflows |

## Performance Metrics

- **Token Efficiency**: 5:1 compression (source code → AI context)
- **Search Speed**: <100ms for semantic queries
- **Context Coverage**: >95% of public APIs documented
- **Relevance**: >90% accuracy for functional searches
- **Scale**: Handles 10,000+ file repositories

## Installation & Setup

```bash
# Install globally via NPM
npm install -g context-crystallizer

# Start the MCP server (connects to Claude Desktop, etc.)
context-crystallizer

# Or use directly with MCP clients
```

## Use Cases

### 🔧 **Feature Implementation**
AI agent needs to add OAuth login to existing auth system
```bash
search_context("authentication login OAuth", max_tokens=3000)
→ Returns relevant auth context within token limits
→ AI implements OAuth following existing patterns
```

### 🔍 **Code Review** 
AI reviewing changes to payment processing
```bash
get_context_bundle(["payments/", "api/billing/"], max_tokens=5000)
→ Returns comprehensive payment system context
→ AI reviews for security, patterns, integration issues
```

### 📚 **Documentation Generation**
AI creating API documentation
```bash
search_context("public API endpoints", max_tokens=8000)
→ Returns all public API context
→ AI generates comprehensive, accurate documentation
```

## Why "Crystallizer"? 

Like applying **pressure** to carbon creates diamonds, Context Crystallizer applies **systematic analysis** to code, producing **crystallized knowledge** that:

- ✨ **Preserves essential structure** while removing noise
- 💎 **Becomes more valuable** than the raw material  
- 🔍 **Enables clear vision** through complex systems
- ⚡ **Optimizes for AI consumption** with perfect clarity

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- 🐛 **Bug Reports**: Use our issue templates
- 💡 **Feature Requests**: Focus on AI workflow improvements  
- 🔧 **Pull Requests**: Include AI context validation tests
- 💬 **Discussions**: Share AI integration patterns

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 **Documentation**: [docs/](docs/)
- 💬 **Discussions**: GitHub Discussions
- 🐛 **Issues**: GitHub Issues
- 📧 **Email**: [support@context-crystallizer.dev](mailto:support@context-crystallizer.dev)

---

**Transform your large codebase into AI-consumable knowledge. Enable AI agents to work with enterprise-scale projects efficiently.**

⭐ **Star this repo** if Context Crystallizer helps your AI workflows!