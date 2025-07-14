# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Crystallizer is an AI Context Engineering tool that transforms large repositories into crystallized, AI-consumable knowledge through systematic analysis and optimization. It creates searchable knowledge bases that enable AI agents to work effectively with enterprise-scale projects by providing token-efficient, LLM-optimized context.

The system operates on the Model Context Protocol (MCP), providing tools for AI agents to crystallize repositories into structured, searchable context while maintaining a mirrored directory structure for intuitive navigation.

## Development Commands

### Build & Development
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Development with hot reload using tsx
npm run dev:mcp        # Development MCP server mode
npm run start          # Run production build
npm run clean          # Remove dist/ directory
```

### Code Quality
```bash
npm run lint           # ESLint check (.ts, .tsx files)
npm run typecheck      # TypeScript type checking without emit
```

### Application Modes
```bash
context-crystallizer                    # Start MCP server (default)
context-crystallizer <command>          # CLI mode with specific commands
context-crystallizer version            # Display version information
context-crystallizer init <repo-path>   # Initialize crystallization
context-crystallizer search <query>     # Search crystallized contexts
```

## Core Architecture

### Dual-Mode Entry Point
The application (`src/index.ts`) detects execution mode:
- **No arguments**: Starts MCP server for AI agent integration
- **With arguments**: Runs CLI commands for developer use

### Core Components Architecture

**CrystallizerCore** (`src/shared/crystallizer-core.ts`)
- Central orchestration class that coordinates all crystallization operations
- Manages the lifecycle: initialization → file processing → context storage → search/retrieval
- Provides unified interface for both MCP tools and CLI commands

**Core Processing Pipeline:**
1. **FileScanner** - Repository scanning with .gitignore support and intelligent filtering
2. **QueueManager** - Systematic file processing queue with concurrent agent support using p-limit
3. **ContextStorage** - Mirrored structure storage with AI-optimized markdown templates
4. **ContextSearch** - Semantic search engine for functionality-based queries
5. **ContextValidator** - Quality assessment and validation of crystallized contexts

### Key Architectural Concepts

**Crystallized Context Structure** (`src/types/index.ts`):
```typescript
interface CrystallizedContext {
  purpose: string;           // Primary functionality description
  keyTerms: string[];        // Searchable semantic terms (NOT technical APIs)
  dependencies: string[];    // File and module dependencies
  patterns: string[];        // Implementation patterns
  crossReferences: CrossReference[];  // Automatic code relationship analysis
  template: 'short' | 'extended';     // Context detail level
  complexity: 'low' | 'medium' | 'high';
  category: 'config' | 'source' | 'test' | 'docs' | 'other';
}
```

**Concurrent Agent Support:**
- File claiming system with timeout-based expiration (default 15 minutes)
- p-limit mutex protection for index operations and file claiming
- Claims automatically released on successful processing or errors

**Template System:**
- **Overview**: ≤50 tokens for indexing (purpose, keyTerms, category, complexity)
- **Standard**: ≤200 tokens for regular analysis  
- **Detailed**: ≤2000 tokens for complex files
- Templates stored in `.context-crystallizer/templates/` for user customization

### Storage Architecture

**Mirrored Structure:**
```
project/
├── .context-crystallizer/
│   ├── context/              # Mirrors source structure with .context.md files
│   ├── ai-metadata/          # JSON metadata for efficient operations
│   ├── templates/            # Customizable analysis templates
│   ├── ai-index.md          # Hierarchical overview with sub-bullet semantic terms
│   ├── processing-queue.json # Session recovery and progress tracking
│   └── crystallization_timeout.txt # Concurrent agent timeout config
```

### MCP Integration

**Server Implementation** (`src/mcp-server.ts`):
- 11 MCP tools for complete crystallization workflow
- JSON-RPC 2.0 protocol over stdio transport
- Tool discovery and execution for AI agents

**Key Tool Categories:**
- **Initialization**: `init_crystallization`, `get_crystallization_guidance`
- **Processing**: `get_next_file_to_crystallize`, `store_crystallized_context`
- **Search & Retrieval**: `search_crystallized_contexts`, `get_crystallized_bundle`
- **Analysis**: `find_related_crystallized_contexts`, `validate_crystallization_quality`

### CLI Commands Architecture

**Command Structure** (`src/commands/`):
- Each command is a separate module with consistent interface
- Uses Commander.js for argument parsing and help generation
- JSON output support for programmatic usage

### Recent Breaking Changes (v1.1.4)

**keyAPIs → keyTerms Migration:**
- Replaced code-focused `keyAPIs` with general-purpose `keyTerms`
- Updated all interfaces, validation, search logic, and console output
- Changed from "APIs:" to hierarchical display with semantic terms
- Makes the tool suitable for any file type (documents, configs, etc.), not just code

**Concurrent Agent Improvements:**
- Added try-catch-finally for guaranteed file claim release
- Fixed race conditions in index operations with p-limit mutex

## Important Technical Details

### Token Optimization
- 5:1 compression ratio target (source code to crystallized context)
- Smart truncation and token counting using custom TokenCounter
- Context bundling respects LLM token limits

### Cross-Reference Analysis
- Automatic detection of imports, exports, function calls, inheritance
- Creates relationship graph for semantic search and related context discovery

### Quality Validation
- Completeness, specificity, AI readability, and token efficiency metrics
- Validation scores and improvement suggestions for context quality

### Error Handling
- File claim cleanup on processing errors
- Session recovery for long-running crystallization processes
- Graceful degradation when template files are missing

### Performance Considerations
- Efficient file scanning with glob patterns and .gitignore parsing
- Incremental updates for changed files only
- Metadata caching for fast search operations
- Concurrent processing support with proper synchronization