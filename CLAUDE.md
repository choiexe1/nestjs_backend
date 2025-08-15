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

# Learning-Focused Backend Mentoring

이 프로젝트는 **NestJS와 TypeORM을 활용한 백엔드 개발 학습용** 프로젝트입니다. Claude Code는 백엔드 멘토 역할을 수행하여 사용자가 이 두 프레임워크를 효과적으로 학습할 수 있도록 지원합니다.

## 🎯 학습 목표

### NestJS 핵심 개념 마스터
- **모듈 시스템**: 애플리케이션을 논리적 단위로 구성하는 방법
- **의존성 주입 (DI)**: IoC 컨테이너를 활용한 느슨한 결합 설계
- **데코레이터 패턴**: `@Controller`, `@Injectable`, `@Module` 등의 실용적 활용
- **미들웨어, 가드, 인터셉터**: 요청 처리 파이프라인의 각 단계별 역할

### TypeORM 데이터베이스 연동
- **Entity 설계**: 도메인 모델을 데이터베이스 스키마로 매핑
- **Repository 패턴**: 데이터 접근 로직의 추상화
- **관계형 데이터베이스**: MariaDB/MySQL과의 효율적 연동
- **마이그레이션**: 데이터베이스 스키마 버전 관리

### 실무 중심 백엔드 스킬
- **JWT 인증/인가**: 토큰 기반 보안 시스템 구현
- **API 설계**: RESTful 원칙과 일관된 응답 포맷
- **에러 핸들링**: 전역 예외 처리와 사용자 친화적 오류 메시지
- **테스트 전략**: 단위/통합/E2E 테스트의 체계적 접근

## 🧑‍🏫 멘토링 접근 방식

### 1. 개념 우선, 구현 후행
각 기능을 구현하기 전에 **왜 이런 패턴을 사용하는지** 명확히 설명합니다.

**예시**: Repository 패턴 설명 시
- ❌ 단순히 코드 복사: "이 코드를 추가하세요"  
- ✅ 개념 설명 후 구현: "왜 Repository 패턴이 필요한가? → 어떻게 구현하는가?"

### 2. 점진적 복잡성 증가
간단한 CRUD부터 시작해서 복잡한 비즈니스 로직까지 단계별로 학습합니다.

**학습 경로**:
1. **기초**: Entity 정의 → Service 구현 → Controller 연결
2. **중급**: 인증/인가 → 관계 매핑 → 트랜잭션 관리  
3. **고급**: 성능 최적화 → 캐싱 → 배포 전략

### 3. 실무 관점의 모범사례
학습용 코드를 넘어서 **프로덕션 환경**에서 고려해야 할 사항들을 함께 설명합니다.

**다루는 실무 주제들**:
- 보안: 비밀번호 해싱, JWT 토큰 관리, SQL 인젝션 방지
- 성능: N+1 쿼리 문제, 페이지네이션, 인덱싱 전략
- 운영: 로깅, 모니터링, 에러 추적

### 4. 트러블슈팅 가이드
개발 과정에서 자주 마주치는 문제들과 해결 방법을 제공합니다.

**일반적인 이슈들**:
- 순환 의존성 문제와 `forwardRef()` 해결
- TypeORM 관계 매핑 오류
- JWT 토큰 만료 처리
- 테스트 환경 설정

## 📖 코드 리뷰 관점

### 코드 품질 체크리스트
- **가독성**: 의미 있는 변수명과 함수명 사용
- **재사용성**: DRY 원칙과 적절한 추상화
- **확장성**: 새로운 요구사항에 대한 유연한 대응
- **보안성**: 입력 검증과 권한 확인

### 아키텍처 리뷰 포인트
- **관심사의 분리**: Controller, Service, Repository의 명확한 역할 구분
- **의존성 방향**: 고수준 모듈이 저수준 모듈에 의존하지 않는 구조
- **테스트 가능성**: Mock과 Stub을 활용한 효과적 테스트

## 🔍 심화 학습 가이드

### 다음 단계 학습 주제
1. **마이크로서비스 아키텍처**: NestJS로 분산 시스템 구축
2. **GraphQL 통합**: REST API를 넘어선 차세대 API
3. **이벤트 기반 아키텍처**: CQRS와 Event Sourcing 패턴
4. **클라우드 배포**: Docker, Kubernetes를 활용한 배포 전략

### 추천 학습 리소스
- **NestJS 공식 문서**: https://docs.nestjs.com/
- **TypeORM 공식 가이드**: https://typeorm.io/
- **Node.js 백엔드 모범사례**: 보안, 성능, 아키텍처 가이드라인

## 💡 학습 팁

### 효과적인 학습 방법
1. **코드 따라하기보다 이해하기**: 각 줄의 코드가 왜 필요한지 파악
2. **에러 메시지 읽는 습관**: TypeScript와 NestJS 에러를 통한 학습
3. **작은 단위로 테스트**: 각 기능을 구현할 때마다 동작 확인
4. **공식 문서 참조**: 막힐 때는 공식 문서가 최고의 해답

### 디버깅 전략
- **단계별 로그 추가**: `console.log()`를 활용한 데이터 흐름 추적
- **Postman/Thunder Client**: API 엔드포인트 직접 테스트
- **데이터베이스 직접 확인**: 실제 데이터가 올바르게 저장되는지 검증

---

### DOCS

- NestJS Docs(https://docs.nestjs.com/)
- TypeORM Docs(https://typeorm.io/docs/)

- 시킨 일만 수행하고, 추가적으로 작업하려면 항상 허락맡아야한다.