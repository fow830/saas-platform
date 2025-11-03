# Архитектура SaaS Platform

## Общая структура проекта

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│                    http://localhost:3001                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │ (REST API + JWT)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 16)                      │
│              Port: 3001 (Development)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ App Router Structure:                                │  │
│  │                                                       │  │
│  │ / (home)                                             │  │
│  │ /login, /register                                    │  │
│  │ /dashboard/*                                         │  │
│  │   ├─ /dashboard (main dashboard)                    │  │
│  │   ├─ /dashboard/adminUsers (admin only)            │  │
│  │   ├─ /dashboard/adminPlans (admin only)            │  │
│  │   ├─ /dashboard/services (user)                    │  │
│  │   └─ /dashboard/settings (user profile)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Core Libraries:                                       │  │
│  │  - lib/api.ts (Axios client с interceptors)         │  │
│  │  - lib/auth.ts (Auth functions)                      │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API Requests
                        │ /api/*
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (NestJS)                           │
│              Port: 3000 (Development)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Main Entry: main.ts                                   │  │
│  │  - CORS configuration                                 │  │
│  │  - Global exception filter                            │  │
│  │  - Validation pipes                                   │  │
│  │  - Swagger documentation                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AppModule (Root Module)                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                        │                                     │
│        ┌────────────────┼────────────────┐                   │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Prisma   │    │ Config   │    │ Health   │              │
│  │ Module   │    │ Module   │    │ Module   │              │
│  └────┬─────┘    └──────────┘    └──────────┘              │
│       │                                                      │
│       │ Database Connection                                 │
│       ▼                                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Feature Modules:                                      │  │
│  │                                                       │  │
│  │ 1. AuthModule                                         │  │
│  │    ├─ AuthController (POST /auth/login, register)    │  │
│  │    ├─ AuthService                                     │  │
│  │    ├─ JWT Strategy                                   │  │
│  │    └─ Guards (JwtAuthGuard)                          │  │
│  │                                                       │  │
│  │ 2. UsersModule                                        │  │
│  │    ├─ UsersController (GET /users/me)               │  │
│  │    └─ UsersService                                    │  │
│  │                                                       │  │
│  │ 3. AdminModule                                        │  │
│  │    ├─ AdminController                                │  │
│  │    │   ├─ GET /admin/users (paginated)              │  │
│  │    │   ├─ PATCH /admin/users/:id/status             │  │
│  │    │   ├─ PATCH /admin/users/:id (update info)      │  │
│  │    │   ├─ PATCH /admin/users/:id/password            │  │
│  │    │   └─ GET /admin/users/:id/generate-password    │  │
│  │    └─ AdminService                                    │  │
│  │                                                       │  │
│  │ 4. PlansModule                                        │  │
│  │    ├─ PlansController                                 │  │
│  │    │   ├─ GET /plans                                 │  │
│  │    │   ├─ POST /plans (admin only)                   │  │
│  │    │   ├─ PUT /plans/:id (admin only)               │  │
│  │    │   └─ DELETE /plans/:id (admin only)             │  │
│  │    └─ PlansService                                    │  │
│  │                                                       │  │
│  │ 5. SubscriptionsModule                                │  │
│  │    ├─ SubscriptionsController                        │  │
│  │    └─ SubscriptionsService                            │  │
│  │                                                       │  │
│  │ 6. ServicesModule                                     │  │
│  │    ├─ ServicesController                              │  │
│  │    └─ ServicesService                                 │  │
│  │                                                       │  │
│  │ 7. PaymentsModule                                     │  │
│  │    ├─ PaymentsController                              │  │
│  │    ├─ PaymentsService                                 │  │
│  │    └─ Providers:                                      │  │
│  │        ├─ YooKassaProvider                           │  │
│  │        ├─ CloudPaymentsProvider                       │  │
│  │        └─ RobokassaProvider                          │  │
│  │                                                       │  │
│  │ 8. InvoicesModule                                     │  │
│  │    ├─ InvoicesController                              │  │
│  │    └─ InvoicesService                                 │  │
│  │                                                       │  │
│  │ 9. AnalyticsModule                                    │  │
│  │    ├─ AnalyticsController                             │  │
│  │    └─ AnalyticsService                                │  │
│  │                                                       │  │
│  │ 10. EmailModule                                       │  │
│  │     └─ EmailService (welcome emails)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Prisma ORM
                        │ SQL Queries
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                           │
│              Port: 5432                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tables:                                              │  │
│  │                                                       │  │
│  │ 1. users                                             │  │
│  │    - id (UUID, PK)                                   │  │
│  │    - simpleId (String, unique, 5 digits)            │  │
│  │    - email (unique)                                  │  │
│  │    - passwordHash                                    │  │
│  │    - firstName                                       │  │
│  │    - phone                                           │  │
│  │    - balance (Decimal, default: 0)                  │  │
│  │    - role (USER | ADMIN | MODERATOR)                │  │
│  │    - status (ACTIVE | SUSPENDED)                    │  │
│  │                                                       │  │
│  │ 2. plans                                             │  │
│  │    - id, name, price, billingPeriod                 │  │
│  │    - features (JSON)                                │  │
│  │    - maxServices, maxUsers                           │  │
│  │                                                       │  │
│  │ 3. subscriptions                                     │  │
│  │    - id, userId, planId                             │  │
│  │    - status, currentPeriodStart, currentPeriodEnd   │  │
│  │                                                       │  │
│  │ 4. services                                          │  │
│  │    - id, name, slug, basePrice                      │  │
│  │    - description, icon, category                     │  │
│  │                                                       │  │
│  │ 5. user_services                                     │  │
│  │    - userId, serviceId                              │  │
│  │    - accessLevel, usageCount                        │  │
│  │                                                       │  │
│  │ 6. plan_services                                     │  │
│  │    - planId, serviceId                              │  │
│  │    - included, limit                                │  │
│  │                                                       │  │
│  │ 7. invoices                                          │  │
│  │    - id, userId, amount, status                     │  │
│  │                                                       │  │
│  │ 8. payments                                          │  │
│  │    - id, invoiceId, userId                          │  │
│  │    - amount, paymentMethod, status                  │  │
│  │                                                       │  │
│  │ 9. sessions                                          │  │
│  │    - id, userId, token, expiresAt                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Поток аутентификации

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │ Backend │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                                 │                              │
     │ 1. POST /api/auth/login         │                              │
     │    {email, password}            │                              │
     ├────────────────────────────────>│                              │
     │                                 │                              │
     │                                 │ 2. Validate credentials      │
     │                                 ├─────────────────────────────>│
     │                                 │                              │
     │                                 │ 3. User found + hash check  │
     │                                 │<─────────────────────────────┤
     │                                 │                              │
     │                                 │ 4. Generate JWT token       │
     │                                 │ 5. Create session           │
     │                                 ├─────────────────────────────>│
     │                                 │                              │
     │ 6. Response: {user, accessToken}│                              │
     │<────────────────────────────────┤                              │
     │                                 │                              │
     │ 7. Store token in localStorage  │                              │
     │                                 │                              │
     │ 8. Include token in requests    │                              │
     │    Authorization: Bearer {token}│                              │
```

## Поток управления пользователями (Admin)

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Admin Frontend │         │  Admin Module   │         │    Database     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. GET /api/admin/users   │                            │
         ├──────────────────────────>│                            │
         │                           │                            │
         │                           │ 2. SELECT users WHERE      │
         │                           │    role != 'ADMIN'          │
         │                           ├───────────────────────────>│
         │                           │                            │
         │                           │ 3. Return users list       │
         │                           │<────────────────────────────┤
         │                           │                            │
         │ 4. Display users table    │                            │
         │<──────────────────────────┤                            │
         │                           │                            │
         │ 5. Edit user field        │                            │
         │    PATCH /api/admin/users/:id                           │
         │    {email or firstName}   │                            │
         ├──────────────────────────>│                            │
         │                           │                            │
         │                           │ 6. UPDATE users SET ...    │
         │                           ├───────────────────────────>│
         │                           │                            │
         │                           │ 7. Return updated user     │
         │                           │<────────────────────────────┤
         │                           │                            │
         │ 8. Update UI              │                            │
         │<──────────────────────────┤                            │
```

## Роли и доступ

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS                         │
│                                                              │
│  ADMIN:                                                      │
│    ├─ /dashboard/adminUsers (Пользователи)                 │
│    │   └─ View, edit email/name, change password/status     │
│    │                                                         │
│    └─ /dashboard/adminPlans (Тарифы)                        │
│        └─ CRUD operations for tariff plans                   │
│                                                              │
│  USER:                                                       │
│    ├─ /dashboard/services (Список услуг)                    │
│    │   └─ View available services, use services             │
│    │                                                         │
│    └─ /dashboard/settings (Редактирование профиля)          │
│        └─ Update own profile                                │
│                                                              │
│  Guards:                                                     │
│    ├─ JwtAuthGuard - проверяет JWT token                   │
│    └─ RolesGuard - проверяет роль пользователя             │
└─────────────────────────────────────────────────────────────┘
```

## Основные сущности и их связи

```
┌─────────┐
│  User   │
│─────────│
│ id (PK) │
│ simpleId│──┐
│ email   │  │
│ balance │  │
│ role    │  │
│ status  │  │
└────┬────┘  │
     │       │
     │       │
     │   ┌───┴──────────┐
     │   │              │
     │   │              │
     │   ▼              ▼
     │ ┌────────────┐ ┌──────────────┐
     │ │Subscription│ │ UserService  │
     │ │────────────│ │────────────────│
     │ │userId (FK) │ │userId (FK)    │
     │ │planId (FK) │ │serviceId (FK) │
     │ └─────┬──────┘ └───────┬──────┘
     │       │                │
     │       │                │
     │       ▼                ▼
     │   ┌────────┐      ┌──────────┐
     │   │ Plan   │      │ Service  │
     │   │────────│      │──────────│
     │   │ id (PK)│      │ id (PK)  │
     │   │ price  │      │ basePrice│
     │   └────┬───┘      └─────┬────┘
     │        │                 │
     │        │                 │
     │        └────────┬────────┘
     │                 │
     │                 ▼
     │           ┌──────────────┐
     │           │ PlanService  │
     │           │──────────────│
     │           │ planId (FK)  │
     │           │ serviceId(FK)│
     │           └──────────────┘
     │
     │
     └─────────┬─────────┐
               │         │
               │         │
               ▼         ▼
         ┌──────────┐ ┌─────────┐
         │ Invoice  │ │ Payment │
         │──────────│ │─────────│
         │userId(FK)│ │userId(FK)│
         │amount    │ │amount   │
         └────┬─────┘ └────┬────┘
              │            │
              │            │
              └──────┬─────┘
                     │
                     ▼
              ┌──────────────┐
              │   Session   │
              │──────────────│
              │ userId (FK)  │
              │ token        │
              └──────────────┘
```

## Ключевые особенности архитектуры

### Backend (NestJS)
- **Модульная архитектура** - каждый функционал в отдельном модуле
- **Dependency Injection** - через NestJS DI контейнер
- **Prisma ORM** - типобезопасная работа с БД
- **JWT Authentication** - токены для аутентификации
- **Role-based Authorization** - защита эндпоинтов по ролям
- **Global Exception Filter** - централизованная обработка ошибок
- **Swagger Documentation** - автоматическая документация API

### Frontend (Next.js 16)
- **App Router** - новая система роутинга Next.js
- **Server-Side Rendering (SSR)** - для некоторых страниц
- **Client Components** - для интерактивности
- **Route Groups** - (auth), (dashboard), (marketing)
- **Axios** - для HTTP запросов
- **LocalStorage** - для хранения JWT токенов

### База данных (PostgreSQL)
- **Multi-tenancy** - Shared Database, Shared Schema
- **Row-level security** - через Prisma и application logic
- **Decimal для денег** - точные расчеты балансов и платежей
- **JSON поля** - для гибких данных (features, metadata)

## Технологический стек

### Backend:
- Node.js + NestJS
- Prisma ORM
- PostgreSQL
- JWT (Passport.js)
- bcrypt
- Swagger/OpenAPI
- Helmet, Compression

### Frontend:
- Next.js 16 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Next.js built-in routing

### Database:
- PostgreSQL
- Prisma Migrations

## Потоки данных

1. **Регистрация пользователя:**
   Frontend → POST /api/auth/register → AuthService → Prisma → Database
   → Generate JWT → EmailService → Return token

2. **Управление тарифами (Admin):**
   Admin Frontend → AdminModule → PlansModule → PlansService → Database

3. **Использование услуг:**
   User Frontend → ServicesModule → ServicesService → UserService → Database

4. **Платежи:**
   Frontend → PaymentsModule → Payment Provider → Webhook → Database

