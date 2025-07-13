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

## MCP Tools for AI Agents & Developers

Context Crystallizer provides 11 specialized MCP tools that work seamlessly with AI agents (like Claude) and can also be accessed by developers through the command line interface.

### For AI Agents
AI agents interact with Context Crystallizer through MCP (Model Context Protocol) when the server is running. The tools enable conversation-driven crystallization and knowledge search.

### For Developers  
Developers start the MCP server with `context-crystallizer` and can integrate with Claude Desktop, or use other MCP-compatible clients to access the tools programmatically.

| Tool | Purpose | Parameters | AI Agent Conversation Example | Developer Notes |
|------|---------|------------|-------------------------------|-----------------|
| **init_crystallization** | Initialize repository for crystallization analysis | `repoPath` (required)<br>`exclude` (array, optional) | **Developer**: "Set up this React project for crystallization"<br>**Claude**: "I'll initialize crystallization for your React project"<br>*Claude calls init_crystallization*<br>**Claude**: "✓ Queued 247 files for crystallization. Ready to start analyzing!" | Start with `context-crystallizer` then integrate with Claude Desktop config |
| **get_next_file_to_crystallize** | Get next file for AI analysis during crystallization | None | **Claude**: "Let me get the next file to analyze..."<br>*Claude calls get_next_file_to_crystallize*<br>**Claude**: "Analyzing src/components/Auth.tsx - this appears to be authentication UI logic..." | Used internally by AI during crystallization process |
| **store_crystallized_context** | Save AI-generated crystallized knowledge for a file | `filePath` (required)<br>`context` (object, required)<br>`fileContent` (string)<br>`fileMetadata` (object) | **Claude**: "I've analyzed the authentication component. Storing crystallized context..."<br>*Claude calls store_crystallized_context*<br>**Claude**: "✓ Crystallized context stored. Progress: 45/247 files" | AI automatically stores analysis results |
| **get_crystallization_progress** | Monitor crystallization completion status | None | **Developer**: "How's the crystallization going?"<br>**Claude**: "Let me check progress..."<br>*Claude calls get_crystallization_progress*<br>**Claude**: "Progress: 45/247 files (18% complete), ~2 hours remaining" | Use to track long-running crystallization sessions |
| **search_crystallized_contexts** | Find relevant knowledge by functionality | `query` (required)<br>`maxTokens` (number, default: 4000)<br>`category` (enum, optional) | **Developer**: "How does authentication work in this app?"<br>**Claude**: "Let me search the crystallized contexts..."<br>*Claude calls search_crystallized_contexts with query="authentication"*<br>**Claude**: "Found 5 auth-related files: JWT middleware, login component, auth context..." | Core search functionality for finding relevant code |
| **get_crystallized_bundle** | Combine multiple contexts for complex understanding | `files` (array, required)<br>`maxTokens` (number, default: 8000) | **Developer**: "Show me how the payment system works"<br>**Claude**: "I'll bundle all payment-related contexts..."<br>*Claude calls get_crystallized_bundle*<br>**Claude**: "The payment flow involves 4 components: PaymentForm, Stripe integration, order processing, and receipt generation..." | Assembles related files for comprehensive analysis |
| **find_related_crystallized_contexts** | Discover code relationships and dependencies | `filePath` (required)<br>`maxResults` (number, default: 5) | **Developer**: "What depends on this Auth.tsx file?"<br>**Claude**: "Let me find related contexts..."<br>*Claude calls find_related_crystallized_contexts*<br>**Claude**: "Found 3 related files: LoginPage uses Auth.tsx, ProtectedRoute depends on it, and UserProfile imports its types" | Explore code relationships and impacts |
| **search_by_complexity** | Find contexts by difficulty level for learning | `complexity` (enum: low/medium/high)<br>`maxResults` (number, default: 10) | **Developer**: "Show me simple files to understand first"<br>**Claude**: "Finding low-complexity files..."<br>*Claude calls search_by_complexity with complexity="low"*<br>**Claude**: "Here are 8 simple config files and utility functions to start with..." | Progressive learning of codebase complexity |
| **validate_crystallization_quality** | Assess context quality and get improvement suggestions | `filePath` (optional)<br>`generateReport` (boolean, default: false) | **Developer**: "Is the crystallization quality good?"<br>**Claude**: "Let me validate the crystallization quality..."<br>*Claude calls validate_crystallization_quality*<br>**Claude**: "Quality report: 89% completeness, 92% AI readability. Suggestions: Add more error handling patterns for 3 files" | Quality assurance for crystallized knowledge |
| **update_crystallized_contexts** | Refresh contexts for changed files | `forceUpdate` (boolean)<br>`includeUnchanged` (boolean)<br>`cleanupDeleted` (boolean)<br>`checkOnly` (boolean)<br>`generateReport` (boolean) | **Developer**: "Update crystallization after my changes"<br>**Claude**: "Detecting changed files and updating contexts..."<br>*Claude calls update_crystallized_contexts*<br>**Claude**: "Updated 3 changed files, removed 1 deleted file. Crystallization is current!" | Maintain accuracy after code changes |

### Usage Patterns

**🔄 Initial Setup & Crystallization**
```
Developer → Start: context-crystallizer
Developer → Configure: Claude Desktop with MCP
Developer → Request: "Crystallize this repository"
Claude → Calls: init_crystallization, get_next_file_to_crystallize, store_crystallized_context
Claude → Reports: Progress and completion
```

**🔍 Daily Development Workflow**  
```
Developer → Ask: "How does feature X work?"
Claude → Calls: search_crystallized_contexts
Claude → Explains: Using found crystallized knowledge

Developer → Ask: "What will this change affect?"
Claude → Calls: find_related_crystallized_contexts  
Claude → Warns: About potential impacts
```

**🔧 Maintenance & Updates**
```
Developer → Notification: "I changed some files"
Claude → Calls: update_crystallized_contexts
Claude → Reports: "Updated 3 contexts, all current"

Developer → Question: "Is crystallization still good quality?"
Claude → Calls: validate_crystallization_quality
Claude → Reports: Quality metrics and suggestions
```

## CLI & Developer Usage

### Starting the MCP Server

```bash
# Install globally
npm install -g context-crystallizer

# Navigate to your project directory
cd /path/to/your/project

# Start the MCP server (required for AI agent integration)
context-crystallizer
```

The server will start and display:
```
Context Crystallizer MCP server running... Ready to transform repositories into crystallized knowledge!
```

### Integration Options

**1. Claude Desktop Integration**

Add to `~/claude_desktop_config.json`:
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

**2. MCP-Compatible Clients**

Any MCP-compatible client can connect to the server and use the 11 crystallization tools. The server implements the standard MCP protocol for tool discovery and execution.

**3. Direct Development**

For development and testing:
```bash
# Development with hot reload
npm run dev

# Production build
npm run build
npm start

# TypeScript development
npm run dev:mcp
```

### Command Line Workflow

```bash
# 1. Start in project directory
cd my-large-repo
context-crystallizer &

# 2. Open Claude Desktop (configured with MCP)
# 3. Ask Claude to crystallize your repository
# "Please crystallize this repository for better understanding"

# 4. Claude will use the MCP tools to:
#    - Initialize crystallization (init_crystallization) 
#    - Process each file (get_next_file_to_crystallize, store_crystallized_context)
#    - Build searchable knowledge base

# 5. Use crystallized knowledge
# "How does authentication work?" 
# "What files depend on the user model?"
# "Show me all the API endpoints"
```

### Developer Notes

- **Server Lifecycle**: The MCP server must be running for AI agent integration
- **Project Context**: Always start the server from your project root directory  
- **Persistent Storage**: Crystallized contexts are saved in `.context-crystallizer/` directory
- **File Watching**: Use `update_crystallized_contexts` tool after making code changes
- **Quality Monitoring**: Regular quality validation ensures accurate crystallized knowledge

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