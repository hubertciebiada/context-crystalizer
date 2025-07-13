# Detailed Template (≤2000 tokens)

**Purpose**: Comprehensive analysis for complex, high-value files. Maximum detail while maintaining token efficiency.

## Required Fields

### purpose (required)
- **Max tokens**: 200
- **Format**: Detailed explanation of file's role, responsibilities, and place in architecture
- **Focus**: What it does, why it's important, how it fits in the larger system
- **Include**: Main responsibilities, key behaviors, architectural significance

### keyAPIs (required)
- **Max tokens**: 400
- **Format**: Detailed array of functions, classes, methods, endpoints with brief descriptions
- **Focus**: All public interfaces, main entry points, important internal functions
- **Include**: Function signatures, purposes, key parameters
- **Example**: ["authenticate(token: string): Promise<User> - Validates JWT and returns user", "refreshToken(user: User): string - Generates new access token"]

## Optional Fields (High Value)

### dependencies (optional)
- **Max tokens**: 200
- **Format**: Comprehensive list of imports with purposes
- **Focus**: External libraries, internal modules, their roles
- **Include**: Why each dependency is used
- **Example**: ["jsonwebtoken - JWT token generation and validation", "../models/User - User data structure and validation"]

### patterns (optional)
- **Max tokens**: 400
- **Format**: Detailed architectural patterns, design decisions, conventions
- **Focus**: How the code is structured and why
- **Include**: Design patterns, architectural choices, conventions followed
- **Example**: ["Middleware pattern for request processing", "Factory pattern for token generation", "Strategy pattern for different auth methods"]

### aiGuidance (optional)
- **Max tokens**: 300
- **Format**: Specific guidance for AI agents working with this code
- **Focus**: How to use, modify, or extend this code
- **Include**: Common use cases, gotchas, best practices
- **Example**: "When modifying authentication logic, ensure all token validations use the same secret. Always update refresh token logic alongside access token changes."

### errorHandling (optional)
- **Max tokens**: 200
- **Format**: Array of error scenarios and handling strategies
- **Focus**: What can go wrong and how it's handled
- **Include**: Error types, recovery strategies, fallbacks
- **Example**: ["Invalid token - returns 401 with clear error message", "Database connection failure - falls back to cached validation"]

### integrationPoints (optional)
- **Max tokens**: 200
- **Format**: Key integration points with other systems
- **Focus**: How this file connects to external services, databases, APIs
- **Include**: External dependencies, communication protocols
- **Example**: ["Redis for session storage", "Auth0 for social login", "Database for user persistence"]

### relatedContexts (optional)
- **Max tokens**: 100
- **Format**: Array of closely related files with relationship descriptions
- **Focus**: Files that work together or should be understood together
- **Include**: Nature of relationship
- **Example**: ["middleware/cors.ts - Sets up CORS before auth", "routes/auth.ts - Uses this middleware"]

### complexity (optional)
- **Max tokens**: 5
- **Format**: Single value from: low, medium, high
- **Focus**: Logical/cognitive complexity of content, NOT file size
- **Low**: Simple utilities, basic configs, straightforward documentation
- **Medium**: Standard business logic, moderate abstractions, typical service classes
- **High**: Complex algorithms, intricate state machines, advanced architectural patterns
- **Assessment**: Consider conceptual difficulty, abstraction levels, interdependencies

## Analysis Guidelines

1. **Comprehensive coverage**: Include all important aspects of the file
2. **AI-centric perspective**: Focus on information that helps AI understand and work with the code
3. **Practical details**: Include specifics that would be needed for modification or debugging
4. **Architecture awareness**: Explain how this fits into the larger system
5. **Error scenarios**: Cover what can go wrong and how it's handled
6. **Integration focus**: Explain how this connects to other parts of the system

## When to Use
- **Complex source files**: Core business logic, main application files
- **High-complexity rating**: Files marked as "high" complexity
- **Large files**: Files with >2000 estimated tokens
- **Critical components**: Authentication, payment processing, core APIs
- **Integration hubs**: Files that connect many other parts of the system

## Example Output Structure
```json
{
  "purpose": "Core authentication middleware that handles JWT token validation, user session management, and security enforcement for all API endpoints. Integrates with multiple authentication providers and manages token lifecycle including refresh logic.",
  "keyAPIs": [
    "authenticateToken(token: string): Promise<AuthResult> - Main authentication function that validates JWT tokens",
    "refreshUserToken(userId: string): Promise<TokenPair> - Generates new access/refresh token pair",
    "validateSession(sessionId: string): Promise<Session> - Checks if user session is still valid",
    "revokeToken(token: string): Promise<void> - Invalidates token and cleans up session"
  ],
  "dependencies": [
    "jsonwebtoken - JWT creation, validation, and parsing",
    "redis - Session storage and token blacklisting",
    "../models/User - User model for database operations",
    "../utils/crypto - Encryption utilities for sensitive data"
  ],
  "patterns": [
    "Middleware pattern for Express.js request processing",
    "Strategy pattern for different authentication methods (JWT, OAuth, API keys)",
    "Factory pattern for creating different token types",
    "Observer pattern for authentication events"
  ],
  "aiGuidance": "When modifying this middleware, ensure token validation uses consistent secret management. Always test with both valid and invalid tokens. Update refresh logic carefully as it affects user sessions across the application.",
  "errorHandling": [
    "Expired tokens - Returns 401 with refresh token hint",
    "Invalid signature - Logs security event and returns 403",
    "Database connection issues - Falls back to local token validation",
    "Redis unavailable - Continues without session storage but logs warning"
  ],
  "integrationPoints": [
    "Redis cluster for distributed session management",
    "Auth0 for social authentication providers",
    "PostgreSQL for user data and audit logging",
    "CloudWatch for security event monitoring"
  ],
  "relatedContexts": [
    "middleware/cors.ts - CORS middleware that runs before authentication",
    "routes/auth.ts - Authentication routes that use this middleware",
    "models/User.ts - User model used for authentication data"
  ],
  "complexity": "high"
}
```