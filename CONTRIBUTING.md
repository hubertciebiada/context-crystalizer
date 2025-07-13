# Contributing to Context Crystallizer

Thank you for your interest in contributing to Context Crystallizer! We welcome contributions that enhance AI context engineering capabilities and improve workflows for AI agents working with large repositories through crystallization.

## Table of Contents

- [Terminology Dictionary](#terminology-dictionary)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [AI Context Engineering Focus](#ai-context-engineering-focus)
- [Contribution Types](#contribution-types)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Terminology Dictionary

**Core Terms for Context Crystallizer:**

- **Repository**: Any large collection of readable files (code, documentation, markdown, config files, etc.) - not limited to source code
- **Crystallization**: The systematic process of scanning a repository and analyzing each file to extract meaningful, AI-consumable knowledge. Like how pressure transforms carbon into diamonds, crystallization transforms raw files into structured, optimized knowledge
- **Crystallized Context**: The AI-optimized knowledge extracted and stored from files - our structured output that makes large repositories understandable to AI
- **Context** (alone): The raw data/content within the repository before crystallization
- **Crystallized Context Base**: The `.context-crystallizer/` directory containing all crystallized contexts and metadata
- **Crystallized Context Index**: Searchable catalog of all crystallized contexts in the repository

**Consistency Rules:**
- Always use "crystallized context" when referring to our processed output
- Use "context" alone only when referring to raw repository content
- "Crystallization" describes the transformation process
- Package name: "context-crystallizer" (with double 'l')
- Directory: `.context-crystallizer/` (never `.context-crystal/`)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher
- **TypeScript** knowledge for core development
- **Understanding of AI/LLM workflows** for crystallization engineering contributions

### Quick Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/yourusername/context-crystallizer.git
cd context-crystallizer

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Start development server
npm run dev
```

## AI Crystallization Engineering Focus

Context Crystallizer is specifically designed for **AI crystallization engineering**. When contributing, please consider:

### Core Principles

1. **AI-First Design**: Features should primarily benefit AI agents and LLM workflows
2. **Token Efficiency**: Optimize for LLM token usage and context windows
3. **Semantic Understanding**: Enable AI agents to find and understand repository content by functionality
4. **Scalability**: Support enterprise-scale repositories (10,000+ files)
5. **Quality Assurance**: Maintain high-quality, AI-consumable crystallized contexts

### AI Workflow Considerations

- **Crystallization Quality**: How does this improve AI's understanding of repository content?
- **Search Relevance**: Does this help AI agents find relevant crystallized contexts faster?
- **Token Optimization**: Does this reduce token usage while maintaining crystallization quality?
- **Integration Patterns**: How does this fit with existing AI agent workflows?

## Contribution Types

### 🔧 Core Development

**MCP Tools Enhancement**
- Improve existing tools (search_context, get_context_bundle, etc.)
- Add new tools for AI workflows
- Optimize performance for large repositories

**Crystallization Generation**
- Enhance AI crystallized context templates
- Improve cross-reference analysis
- Add support for new file types and programming languages

**Search & Retrieval**
- Improve semantic search algorithms
- Enhance relevance scoring
- Add category-based filtering

### 🤖 AI Integration

**AI System Support**
- Add integrations with new AI platforms
- Improve existing integrations (Claude Desktop, etc.)
- Create example AI agent implementations

**Workflow Optimization**
- Develop AI-specific optimization strategies
- Create workflow templates
- Add performance profiling tools

### 📚 Documentation & Examples

**AI-Focused Documentation**
- Improve setup guides for AI agents
- Add workflow examples
- Create troubleshooting guides

**Integration Examples**
- Claude Desktop configurations
- Custom AI agent implementations
- API integration patterns

### 🧪 Testing & Quality

**AI Crystallization Testing**
- Develop crystallized context quality metrics
- Add AI workflow test cases
- Create performance benchmarks

**Integration Testing**
- Test with various AI systems
- Validate MCP tool functionality
- Add end-to-end workflow tests

## Development Workflow

### 1. Issue Assignment

- Browse [open issues](https://github.com/yourusername/context-crystallizer/issues)
- Comment on issues you'd like to work on
- Wait for assignment to avoid duplicate work
- For new features, create an issue first to discuss

### 2. Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# For bugs
git checkout -b fix/issue-description

# For AI integrations
git checkout -b ai/integration-name
```

### 3. Development Process

```bash
# Make your changes
# Run linting
npm run lint

# Build to check for errors
npm run build

# Test with a real repository
npm run dev
# In another terminal, test your changes
```

## Manual Testing Guidelines

### AI Context Quality Testing

For this MVP, testing is done manually:

1. **Build and lint checks**: Run `npm run build` and `npm run lint`
2. **CLI functionality**: Test the MCP server with real repositories
3. **Context generation**: Verify context quality with sample codebases
4. **Integration testing**: Test with Claude Desktop or other MCP clients

### Test Requirements for AI Features

1. **Crystallization Tests**
   - Validate crystallized context completeness and accuracy
   - Check token efficiency (target 5:1 compression)
   - Verify AI-readability scores

2. **MCP Tool Tests**
   - Test all tool parameters and responses
   - Validate error handling
   - Check token limits and truncation

3. **Integration Tests**
   - Test with realistic repository sizes
   - Validate end-to-end AI workflows
   - Check performance with large codebases

### Writing Tests for AI Features

```typescript
// Example: Testing crystallization quality
describe('AI Crystallization', () => {
  test('should generate high-quality crystallized context for complex files', async () => {
    const crystallizedContext = await generateCrystallizedContext(complexFile);
    
    // Quality checks
    expect(crystallizedContext.purpose).toBeTruthy();
    expect(crystallizedContext.keyAPIs.length).toBeGreaterThan(0);
    expect(crystallizedContext.tokenCount).toBeLessThanOrEqual(2000);
    
    // AI-specific validations
    const validation = await validateCrystallizationQuality(crystallizedContext);
    expect(validation.score).toBeGreaterThan(80);
    expect(validation.aiReadability).toBeGreaterThan(85);
  });
});
```

## Code Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Document AI-specific interfaces

```typescript
// Good: AI-focused interface design
interface AICrystallizationRequest {
  query: string;
  maxTokens: number;
  category?: ContextCategory;
  relevanceThreshold?: number;
}

// Good: Comprehensive type for AI consumption
interface CrystallizedContext {
  purpose: string;           // Required: AI needs clear purpose
  keyAPIs: string[];         // Required: AI needs interface info
  dependencies: string[];    // Optional: help AI understand relationships
  patterns: string[];        // Optional: help AI follow conventions
  aiGuidance?: string;       // Optional: specific AI instructions
  tokenCount?: number;       // Optional: help AI manage token budgets
}
```

### AI Crystallization Engineering Standards

1. **Crystallized Context Templates**
   - Short template: ≤200 tokens (config, types, constants)
   - Extended template: ≤2000 tokens (services, controllers, complex logic)

2. **Quality Metrics**
   - Completeness: >80% for core files
   - AI Readability: >85% for all crystallized contexts
   - Token Efficiency: 5:1 compression ratio target

3. **Search Relevance**
   - Precision@5: >70% for functional queries
   - Response time: <100ms for semantic searches

### Documentation Standards

- Focus on AI agent workflows
- Provide copy-paste examples
- Include token usage estimates
- Show integration patterns

## Pull Request Process

### Before Submitting

1. **Test Thoroughly**
   ```bash
   # Build and verify
   npm run build && npm run lint
   
   # Test with real repositories
   node dist/index.js
   ```

2. **Validate AI Focus**
   - Does this improve AI agent workflows?
   - Is it optimized for LLM consumption?
   - Does it maintain or improve crystallized context quality?

3. **Check Performance**
   - Test with large repositories (1000+ files)
   - Validate token efficiency
   - Check memory usage

### Pull Request Template

Your PR should include:

- **Clear description** of changes and AI workflow impact
- **Test results** showing improved AI crystallized context quality
- **Performance metrics** for large repositories
- **Integration examples** showing AI agent usage
- **Breaking changes** clearly documented

### Review Process

1. **Automated Checks**
   - TypeScript compilation
   - Test suite passes
   - Linting compliance
   - AI crystallization quality validation

2. **Manual Review**
   - Code quality and architecture
   - AI workflow impact assessment
   - Documentation completeness
   - Integration testing

3. **AI Integration Testing**
   - Test with Claude Desktop (if applicable)
   - Validate MCP tool functionality
   - Check token optimization

## Community

### Getting Help

- **GitHub Discussions**: General questions and ideas
- **Issues**: Bug reports and feature requests  
- **Discord** (coming soon): Real-time collaboration

### AI Community Focus

We're building a community focused on **AI crystallization engineering**:

- Share AI integration patterns
- Discuss crystallization optimization strategies
- Collaborate on AI workflow improvements
- Contribute to AI-focused testing

### Recognition

Contributors who significantly improve AI workflows will be:

- Featured in release notes
- Added to the contributors list
- Invited to beta test new AI integrations
- Given priority support for their AI projects

## Development Tips

### Testing with Real Repositories

```bash
# Test with various repository types
cd /path/to/nodejs-project && npx context-crystallizer
cd /path/to/python-project && npx context-crystallizer
cd /path/to/large-enterprise-repo && npx context-crystallizer
```

### AI Integration Development

```bash
# Test with Claude Desktop
# Update your claude_desktop_config.json with local build
{
  "mcpServers": {
    "context-crystallizer-dev": {
      "command": "node",
      "args": ["/path/to/context-crystallizer/dist/index.js"],
      "cwd": "/path/to/test-repository"
    }
  }
}
```

### Performance Profiling

```bash
# Profile memory usage with large repositories
node --inspect dist/index.js

# Monitor manually by testing with real repositories
# and verifying context quality
```

## Questions?

- 📧 **Email**: [contributors@context-crystallizer.dev](mailto:contributors@context-crystallizer.dev)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/context-crystallizer/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/context-crystallizer/issues)

Thank you for contributing to Context Crystallizer and helping improve AI crystallization engineering for large repositories! 🚀