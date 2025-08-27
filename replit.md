# TapLive MVP - Location-Based Live Streaming Platform

## Overview

TapLive MVP is a location-based live streaming platform that enables users to create and join live video streaming orders at specific geographical locations. The platform consists of a React frontend with a responsive design using shadcn/ui components, an Express.js backend with RESTful APIs, and PostgreSQL database integration using Drizzle ORM. The application supports order management with location-based filtering, real-time updates via React Query, and a modern glassmorphism UI design optimized for both desktop and mobile experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Styling**: Tailwind CSS with custom CSS variables for theming and glassmorphism effects

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful APIs with JSON responses and standardized error handling
- **Data Storage**: In-memory storage with interface-based design for easy database migration
- **Middleware**: Custom logging, JSON parsing, and CORS handling
- **Development**: Hot reload with Vite integration and custom error overlays

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect configuration
- **Tables**: Users table with authentication fields and Orders table with location/status tracking
- **Enums**: Order status (pending, open, accepted, live, done, cancelled) and type (single, group)
- **Constraints**: Foreign key relationships between orders and users (creator/provider)
- **Location**: Decimal precision coordinates for accurate geographical positioning

### Core Features
- **Order Management**: CRUD operations for live streaming orders with status transitions
- **Location Services**: Geographic filtering with radius-based order discovery
- **User Roles**: Creator and provider roles with different permissions and capabilities
- **Real-time Updates**: Optimistic updates and automatic cache invalidation
- **Responsive Design**: Mobile-first approach with dedicated mobile navigation

### Development Workflow
- **Build System**: ESBuild for production bundling with external package handling
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Development Tools**: Concurrent development servers with proxy configuration
- **Code Quality**: Path aliases for clean imports and component organization

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack React Query
- **Backend Framework**: Express.js with TypeScript support via tsx
- **Database Integration**: Drizzle ORM with Neon Database serverless driver
- **Validation**: Zod for runtime type checking and schema validation

### UI and Design System
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling**: Tailwind CSS for utility-first styling with PostCSS processing
- **Icons**: Lucide React for consistent iconography
- **Utilities**: clsx and tailwind-merge for conditional styling, class-variance-authority for component variants

### Development and Build Tools
- **Build Tooling**: Vite for development server and bundling, ESBuild for production builds
- **TypeScript**: Full TypeScript support with strict configuration
- **Development Enhancements**: Replit-specific plugins for runtime error handling and debugging

### Third-party Integrations
- **Maps**: Leaflet.js for interactive map functionality (loaded dynamically)
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Date Handling**: date-fns for date manipulation and formatting
- **Carousel Components**: Embla Carousel for image/content carousels