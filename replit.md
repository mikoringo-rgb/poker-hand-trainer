# Texas Hold'em Hand Strength Trainer

## Overview

A poker training application designed to help players practice evaluating hand strength in Texas Hold'em, Omaha, and Omaha Hi-Lo games. The application presents poker scenarios with multiple players and asks users to identify the winning hand(s). It features an immersive poker table interface with real-time feedback and timing mechanics to simulate game conditions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter, a minimal routing library. The application has a simple two-page structure: a setup page and the game board.

**State Management**: Local React state (useState, useEffect) for game logic. No global state management library is used, keeping the architecture simple and focused.

**UI Component System**: shadcn/ui components built on Radix UI primitives, providing accessible, customizable UI elements. The design follows a "new-york" style variant with custom theming for a poker table aesthetic.

**Styling**: Tailwind CSS with extensive custom theming to achieve an authentic poker table look. The design system includes custom color variables for poker-specific elements (table green, card colors, semantic feedback colors) and uses CSS custom properties for theming.

**Game Logic**: Pure TypeScript functions in `client/src/lib/poker-logic.ts` handle all poker hand evaluation, including:
- Deck creation and shuffling
- Hand evaluation for Hold'em and Omaha variants
- Winner determination for both high and low (Hi-Lo) hands
- Card combination generation and ranking

The poker logic is completely client-side with no server dependencies, making the game instantly responsive.

### Backend Architecture

**Server Framework**: Express.js with TypeScript, serving as both an API server and static file server.

**Development/Production Split**: 
- In development, Vite middleware is used for hot module replacement and fast rebuilds
- In production, pre-built static files are served from the dist directory
- The server uses conditional imports to load Replit-specific plugins only in development

**Storage Interface**: Abstracted storage pattern with an interface (`IStorage`) and in-memory implementation (`MemStorage`). This design allows for easy migration to a database-backed solution while keeping the current implementation lightweight for the primarily client-side game logic.

**API Structure**: Minimal backend API surface since game logic runs entirely in the browser. The routes file is structured for future expansion but currently serves primarily as the HTTP server foundation.

### Data Storage

**Current Implementation**: In-memory storage using JavaScript Maps. User data (if implemented) would be stored in memory and lost on server restart.

**Database Schema**: Drizzle ORM is configured to work with PostgreSQL, though not actively used in the current implementation. The schema file (`shared/schema.ts`) defines TypeScript types for poker game entities (Cards, Hands, GameState) but these are used purely for type safety in the frontend, not database persistence.

**Future Consideration**: The Drizzle configuration and storage interface suggest the application is structured to add persistent storage (user accounts, game history, statistics) without major refactoring.

### Design System

**Color Palette**: Custom poker-themed colors including:
- Poker table green backgrounds (HSL-based with custom variables)
- Semantic colors for correct/incorrect feedback (green/red)
- Traditional playing card colors (red suits, black suits)
- Dark/light mode support through CSS custom properties

**Typography**: Multi-font approach with Inter/Roboto for UI, Georgia/serif for card ranks (authentic playing card feel), and Roboto Mono for timer/score displays.

**Responsive Design**: Mobile-first approach with breakpoints and responsive sizing for cards and UI elements. The game adapts to different screen sizes while maintaining visual hierarchy.

## External Dependencies

### UI & Styling
- **Radix UI**: Complete suite of accessible, unstyled UI primitives (@radix-ui/react-*)
- **shadcn/ui**: Pre-built component layer on top of Radix UI
- **Tailwind CSS**: Utility-first CSS framework with PostCSS for processing
- **class-variance-authority**: Type-safe variant management for components
- **clsx & tailwind-merge**: Class name utilities for conditional styling

### React Ecosystem
- **React & React DOM**: Core framework (version 18+)
- **Wouter**: Lightweight client-side routing
- **@tanstack/react-query**: Server state management and caching (configured but minimally used)
- **react-hook-form & @hookform/resolvers**: Form management (available but not extensively used)

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire codebase
- **esbuild**: Fast bundler for production builds
- **tsx**: TypeScript execution for server-side code

### Database & ORM (Configured but Not Active)
- **Drizzle ORM**: TypeScript-first ORM configured for PostgreSQL
- **@neondatabase/serverless**: Serverless Postgres driver
- **drizzle-zod**: Zod schema integration for Drizzle

### Icons & Assets
- **Lucide React**: Icon library used throughout the UI

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling (dev-only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev-only)

### Date & Utilities
- **date-fns**: Date manipulation library
- **nanoid**: Unique ID generation

**Note**: The application is structured for future database integration but currently operates entirely client-side with no persistent storage, making it fast and lightweight for its training game purpose.