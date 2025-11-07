# Participium - Frontend Documentation

## Overview

The Participium frontend is a modern, responsive web application built with React, TypeScript, and Tailwind CSS. It provides an intuitive interface for citizens to report urban issues and for municipality staff to manage them.

## Project Structure

```
src/
├── api/                    # API client and service layer
│   ├── client.ts          # Axios configuration with interceptors
│   ├── auth.ts            # Authentication API calls
│   └── reports.ts         # Reports API calls
├── components/            # Reusable UI components
│   ├── Navbar.tsx         # Navigation bar with auth state
│   ├── Footer.tsx         # Footer component
│   ├── Button.tsx         # Custom button component
│   ├── Card.tsx           # Card wrapper component
│   ├── Input.tsx          # Form input component
│   └── Loading.tsx        # Loading spinner
├── context/               # React Context providers
│   └── AuthContext.tsx    # Authentication state management
├── pages/                 # Page components
│   ├── Home.tsx           # Landing page
│   ├── auth/              # Authentication pages
│   │   ├── Login.tsx      # Login page
│   │   └── Register.tsx   # Registration page
│   ├── citizen/           # Citizen dashboard
│   │   └── CitizenDashboard.tsx
│   ├── municipality/      # Municipality dashboard
│   │   └── MunicipalityDashboard.tsx
│   └── admin/             # Admin dashboard
│       └── AdminDashboard.tsx
├── routes/                # Route configurations
│   └── ProtectedRoute.tsx # Protected route wrapper
├── types/                 # TypeScript type definitions
│   ├── user.ts            # User types
│   └── report.ts          # Report types
├── App.tsx                # Main app component with routing
├── main.tsx               # Application entry point
└── index.css              # Tailwind CSS configuration
```

## Key Features

### 🎨 Design System
- **Clean, Modern UI**: Built with Tailwind CSS for a professional look
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessible**: Focus on usability for all users
- **Consistent Components**: Reusable components across the application

### 🔐 Authentication
- **JWT-based Authentication**: Secure login/logout with cookies
- **Role-based Access**: Different dashboards for citizens, municipality staff, and admins
- **Protected Routes**: Automatic redirection for unauthorized access
- **Context-based State**: Global auth state management

### 🚀 Routing Structure

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page with features and CTAs |
| `/auth/login` | Public | Login page |
| `/auth/register` | Public | Citizen registration |
| `/citizen/*` | Citizen only | Citizen dashboard and features |
| `/municipality/*` | Municipality only | Municipality staff dashboard |
| `/admin/*` | Admin only | Admin dashboard |

### 🏠 Home Page Features

The landing page includes:
- **Hero Section**: Compelling call-to-action with gradient background
- **How It Works**: Three-step process explanation
- **Report Categories**: Visual display of all report types
- **Community Impact**: Statistics showcase
- **CTA Sections**: Multiple conversion points

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS v3** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd front-end
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend URL:
```
VITE_API_BASE_URL=http://localhost:3001
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## API Integration

The frontend communicates with the backend through:

### Auth Endpoints
- `POST /auth/login` - User login
- `DELETE /auth/logout` - User logout
- `GET /auth/current` - Get current user

### User Endpoints
- `POST /users/register-citizen` - Register new citizen

### Future Endpoints (to be implemented)
- Reports CRUD operations
- Statistics endpoints
- User management
- File uploads

## Component Usage

### Button Component
```tsx
import Button from './components/Button';

<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `outline`, `danger`
Sizes: `sm`, `md`, `lg`

### Card Component
```tsx
import Card from './components/Card';

<Card hover className="p-4">
  <p>Content goes here</p>
</Card>
```

### Input Component
```tsx
import Input from './components/Input';

<Input 
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

## State Management

### Auth Context
```tsx
import { useAuth } from './context/AuthContext';

const { user, isAuthenticated, login, logout, register } = useAuth();
```

## Styling Guidelines

The project uses Tailwind CSS with a custom configuration:

### Color Palette
- **Primary**: Blue (blue-600, blue-700)
- **Success**: Green (green-600)
- **Danger**: Red (red-600)
- **Gray**: Gray scale for text and backgrounds

### Spacing
- Consistent use of Tailwind's spacing scale (4px base)
- Container max-width: `max-w-7xl`

### Typography
- System font stack for optimal performance
- Clear hierarchy with Tailwind's text utilities

## Future Enhancements

### Planned Features
1. **Report Management**
   - Interactive map for creating reports
   - Photo upload functionality
   - Report filtering and search
   - Real-time status updates

2. **Notifications**
   - In-app notification system
   - Email notification preferences
   - Telegram bot integration

3. **Statistics Dashboard**
   - Public statistics visualization
   - Private admin analytics
   - Data export (CSV)

4. **User Profile**
   - Profile picture upload
   - Notification preferences
   - Report history

5. **Municipality Features**
   - Report assignment workflow
   - Communication with citizens
   - Status management
   - Office role management

## Best Practices

### Code Organization
- One component per file
- Logical folder structure
- Type safety with TypeScript
- Reusable components

### Performance
- Lazy loading for routes (future)
- Image optimization (future)
- Code splitting with Vite

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Vite will automatically try the next available port
# Or specify a custom port:
npm run dev -- --port 3000
```

**API connection issues:**
- Verify backend is running on the correct port
- Check `.env` file for correct `VITE_API_BASE_URL`
- Ensure CORS is configured on backend

**Build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## Contributing

When adding new features:
1. Follow the existing file structure
2. Use TypeScript for type safety
3. Create reusable components
4. Update this documentation
5. Test on multiple screen sizes

## License

This project is part of the Software Engineering II course at Politecnico di Torino.

## Team

- s323141 Pochettino Alberto
- s334072 Torrengo Andrea
- s338520 Benevento Mattia
- s338714 Uslu Sebnem
- s339153 Hemmati Fateme
