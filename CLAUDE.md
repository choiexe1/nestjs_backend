# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS backend application implementing clean architecture patterns with user authentication and management functionality. The project demonstrates proper separation of concerns using repository pattern, dependency injection, and consistent API response formatting.

## Development Commands

### Build and Development
```bash
npm run build           # Build the application
npm run start:dev       # Start development server with hot reload
npm run start:prod      # Start production server
```

### Testing
```bash
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage report
npm run test:e2e        # Run end-to-end tests
npm test -- --testPathPattern=auth.service.spec.ts  # Run specific test file
```

### Code Quality
```bash
npm run lint            # Run ESLint with auto-fix
npm run format          # Format code with Prettier
```

## Architecture Overview

### Core Architecture Principles
- **Repository Pattern**: All data access is abstracted through repository interfaces (`src/core/repositories/`)
- **Dependency Injection**: Services use `@Inject('UserRepository')` to depend on repository interface, not concrete implementation
- **Clean Architecture**: Business logic is separated from data access and presentation layers

### Key Components

#### Response Standardization
- **ResponseTransformInterceptor**: Automatically wraps all successful responses in consistent format
- **GlobalExceptionsFilter**: Transforms all errors into consistent API response format
- **ApiResponse Interface**: Defines standard response structure with `success`, `data`, `message`, `timestamp`, and `path` fields

#### Authentication & Authorization
- **JWT Token System**: Access tokens (15min) and refresh tokens (7d) with environment configuration
- **AuthModule**: Handles registration, login, and token refresh with bcrypt password hashing
- **JwtAuthGuard**: Custom guard for protecting endpoints with Bearer token validation
- **TokenService**: JWT token generation, verification, and payload extraction
- **AuthController**: REST endpoints for `/auth/register`, `/auth/login`, and `/auth/refresh`

#### User Management  
- **UsersModule**: CRUD operations with pagination support for user entities
- **InMemoryUserRepository**: In-memory implementation of UserRepository interface
- **UsersService**: Business logic delegating to repository interface
- **Protected Endpoints**: All `/users` endpoints require JWT authentication

### Module Structure
```
src/
├── core/                    # Shared infrastructure
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Response interceptors
│   ├── interfaces/         # Common interfaces (pagination, token response)
│   ├── repositories/       # Repository interfaces
│   └── exceptions/         # Custom exception classes
├── auth/                   # Authentication module
│   ├── guards/             # JWT authentication guards
│   ├── services/           # Token service
│   ├── strategies/         # JWT passport strategy
│   ├── decorators/         # Current user decorator
│   └── dto/                # Auth DTOs (register, login, refresh)
├── users/                  # User management module
└── main.ts                 # Application bootstrap
```

### API Response Format
All API responses follow this consistent structure:
```typescript
{
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  path: string;
}
```

### Repository Pattern Implementation
- Repository interfaces are defined in `src/core/repositories/`
- Services inject repositories using `@Inject('UserRepository')` 
- Concrete implementations are provided in module providers
- This allows easy swapping of data sources (memory, database, etc.)

### Testing Strategy
- **Unit Tests**: All services and controllers have corresponding `.spec.ts` files
- **E2E Tests**: Full request/response cycle testing in `test/` directory
- **Test Setup**: E2E tests manually apply interceptors and filters to match production behavior

## Important Implementation Details

### Password Security
- Uses bcrypt for password hashing with salt rounds of 10
- Passwords are never returned in API responses (stripped in service layer)

### Validation
- Uses class-validator decorators in DTOs for input validation
- Global ValidationPipe configured with `transform: true`, `whitelist: true`

### Error Handling
- All exceptions are caught by GlobalExceptionsFilter
- Provides consistent error response format
- Logs errors for debugging while hiding internal details from clients

### Data Persistence
- Currently uses in-memory storage via InMemoryUserRepository
- Repository pattern allows easy migration to database without changing business logic
- Each module registers its own repository implementation in module providers

### JWT Authentication System
- **Access Tokens**: 15-minute expiry, used for API authentication
- **Refresh Tokens**: 7-day expiry, used to obtain new access tokens
- **Token Refresh**: POST `/auth/refresh` endpoint for seamless token renewal
- **Protection**: Use `@UseGuards(JwtAuthGuard)` on controllers or methods
- **Current User**: Access authenticated user with `@CurrentUser()` decorator
- **Configuration**: JWT secrets and expiry times via environment variables

### Pagination System
- **PaginationOptions**: Optional `page` and `limit` parameters
- **PaginatedResult**: Standardized response with data and pagination metadata
- **Usage**: Applied to `findAll` methods in repository pattern
- **Metadata**: Includes `total`, `totalPages`, `hasNext`, `hasPrevious`

### Circular Dependency Resolution
- **forwardRef()**: Used between AuthModule and UsersModule to resolve circular imports
- **Pattern**: `imports: [forwardRef(() => ModuleName)]` in both modules
- **Reason**: AuthModule needs UserRepository, UsersModule needs JwtAuthGuard