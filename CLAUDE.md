# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Context Crystallizer is an AI Context Engineering tool for large codebases. It transforms massive repositories into crystallized, AI-consumable context through systematic analysis and optimization. The tool creates searchable knowledge bases that enable AI agents to work effectively with enterprise-scale projects by providing token-efficient, LLM-optimized context.

## Development Status

This appears to be an early-stage project with primary documentation (README.md) but minimal implementation code. The repository currently contains:

- Project documentation and architecture description
- Configuration files for development tools (.taskmaster/, .claude/)
- Git repository structure ready for development

## Key Architecture Concepts

### Core Components (Planned)
1. **AI Context Optimization Engine**: Compresses source code into AI-consumable context with 5:1 compression ratio
2. **Semantic Search Engine**: Enables AI agents to search by functionality rather than file names
3. **Token-Aware Assembly**: Combines multiple contexts within LLM token limits
4. **MCP Tools Integration**: Provides standardized tools for AI agent interaction

### MCP Tools API (Planned)
The system will provide these tools for AI agents:
- `init_crystallization(repo_path)` - Prepare codebase for analysis
- `get_next_file()` - Serve files systematically for context generation
- `store_ai_context(file, context)` - Save AI-generated optimized context
- `search_context(query, max_tokens)` - Find relevant context for tasks
- `get_context_bundle(files, max_tokens)` - Assemble multi-file context

### Context Structure
AI-optimized context files follow this format:
- Purpose and functionality description
- Key APIs for AI consumption
- Context dependencies and relationships
- Implementation patterns and conventions
- Related contexts with cross-references

## Development Environment

### Configuration
- Uses Taskmaster for project management (`.taskmaster/`)
- Claude Code settings in `.claude/settings.local.json`
- Anthropic Claude 3.7 Sonnet as primary model
- Perplexity Sonar Pro for research tasks

### Project Structure
```
context-crystallizer/
├── README.md              # Primary project documentation
├── .claude/               # Claude Code configuration
├── .taskmaster/           # Task management configuration
└── .context-crystallizer/  # (Future) Crystallized knowledge base
    ├── ai-index.md
    ├── context/
    └── ai-metadata/
```

## Current Development Phase

This project is in the **conceptual/planning phase**. The README.md contains comprehensive architecture and feature descriptions, but implementation has not yet begun. Future development will likely involve:

1. Setting up the build system (package.json, dependencies)
2. Implementing the core context analysis engine
3. Building the MCP tools interface
4. Creating the semantic search functionality
5. Developing the token-aware assembly system

## Installation & Planned Usage

Per the README, the tool will be distributed as:
```bash
npm install -g context-crystallizer
context-crystallizer  # Start MCP server
```

Target integration is with Claude Desktop and other MCP-compatible AI clients.