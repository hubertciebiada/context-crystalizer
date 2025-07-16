# Standard Template (≤200 tokens)

**Purpose**: Regular analysis for most files. Balance between detail and efficiency.

## Required Fields

### purpose (required)
- **Max tokens**: 55
- **Format**: 2-3 sentences describing file's role and functionality
- **Focus**: What it does, why it exists, how it fits in the system
- **Example**: "React component for user authentication forms. Handles login, signup, and password reset flows. Integrates with authentication context and validates user input."

### keyTerms (required)
- **Max tokens**: 45
- **Format**: Array of searchable keywords, technologies, patterns, concepts (use FULL words)
- **Focus**: Terms that AI agents would search for to find this file
- **Storage**: Full terms stored in metadata - system auto-abbreviates for index display only
- **Priority**: Critical for compact index - these become the primary search mechanism
- **Ordering**: **ESSENTIAL** - Order from most important to least important (index shows first 8 terms)
- **Include**: Technologies, frameworks, domain concepts, main functions, patterns
- **Example**: ["authentication", "react", "forms", "validation", "hooks", "login", "signup", "ui"] (auth most critical)
- **Note**: Use "authentication" not "auth", "configuration" not "config" - abbreviation is automatic

## Optional Fields

### dependencies (optional)
- **Max tokens**: 30
- **Format**: Array of important imports and dependencies
- **Focus**: External libraries and internal modules this file relies on
- **Example**: ["react", "formik", "../hooks/useAuth", "../utils/validation"]

### patterns (optional)
- **Max tokens**: 40
- **Format**: Array of implementation patterns and conventions
- **Focus**: Architectural patterns, design principles, coding conventions
- **Example**: ["React hooks pattern", "Form validation with Formik", "Context API usage"]

### relatedContexts (optional)
- **Max tokens**: 30
- **Format**: Array of related files that work together
- **Focus**: Files that are commonly used together or depend on each other
- **Example**: ["components/UserProfile.tsx", "hooks/useAuth.ts", "contexts/AuthContext.tsx"]

### complexity (optional)
- **Max tokens**: 5
- **Format**: Single value from: low, medium, high
- **Focus**: Logical/cognitive complexity of content, NOT file size
- **Assessment**: Consider abstractions, algorithm complexity, business logic intricacy
- **Example**: "medium" for standard React component with hooks

## Analysis Guidelines

1. **Extract essentials**: Focus on information useful for AI understanding
2. **Be specific**: Use actual function names, not generic descriptions  
3. **Think integration**: How would other code interact with this file?
4. **Optimize for search**: keyTerms are compressed and indexed - choose terms AI agents would search for
5. **Prioritize keyTerms**: Order terms by importance - most critical terms first (index may truncate)
6. **Include patterns**: What architectural decisions were made?
7. **Consider compression**: Common terms get abbreviated (authentication→auth, database→db)

## When to Use
- **Config files**: Package.json, tsconfig, environment files
- **Simple components**: Basic UI components, utilities
- **Medium complexity**: Standard business logic, helpers
- **Default choice**: When in doubt, use standard template

## Example Output Structure
```json
{
  "purpose": "React component for user authentication forms. Handles login, signup, and password reset flows with validation.",
  "keyTerms": ["react", "authentication", "forms", "validation", "hooks", "login", "signup"],
  "dependencies": ["react", "formik", "../hooks/useAuth"],
  "patterns": ["React hooks pattern", "Form validation", "Context API"],
  "relatedContexts": ["hooks/useAuth.ts", "contexts/AuthContext.tsx"],
  "complexity": "medium"
}
```