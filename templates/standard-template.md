# Standard Template (≤200 tokens)

**Purpose**: Regular analysis for most files. Balance between detail and efficiency.

## Required Fields

### purpose (required)
- **Max tokens**: 60
- **Format**: 2-3 sentences describing file's role and functionality
- **Focus**: What it does, why it exists, how it fits in the system
- **Example**: "React component for user authentication forms. Handles login, signup, and password reset flows. Integrates with authentication context and validates user input."

### keyAPIs (required)
- **Max tokens**: 40
- **Format**: Array of key functions, classes, exports, or API endpoints
- **Focus**: Entry points that other code would use or call
- **Example**: ["LoginForm", "SignupForm", "validateEmail", "handleSubmit", "useAuth"]

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
4. **Prioritize APIs**: What can other files call or import from here?
5. **Include patterns**: What architectural decisions were made?

## When to Use
- **Config files**: Package.json, tsconfig, environment files
- **Simple components**: Basic UI components, utilities
- **Medium complexity**: Standard business logic, helpers
- **Default choice**: When in doubt, use standard template

## Example Output Structure
```json
{
  "purpose": "React component for user authentication forms. Handles login, signup, and password reset flows with validation.",
  "keyAPIs": ["LoginForm", "SignupForm", "validateEmail", "handleSubmit"],
  "dependencies": ["react", "formik", "../hooks/useAuth"],
  "patterns": ["React hooks pattern", "Form validation", "Context API"],
  "relatedContexts": ["hooks/useAuth.ts", "contexts/AuthContext.tsx"],
  "complexity": "medium"
}
```