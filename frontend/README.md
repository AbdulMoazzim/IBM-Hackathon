# VibeGuard Frontend

**AI-powered security scanner for modern web applications**

A production-ready Next.js frontend for VibeGuard, featuring a dark security-themed UI, comprehensive vulnerability analysis, and professional security reporting.

![VibeGuard](https://img.shields.io/badge/VibeGuard-1.0.0-00FF00?style=flat-square&logoWidth=20)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)

---

## 🎯 Overview

VibeGuard is a comprehensive application security scanning platform that:

✅ **Scans Applications** - Analyze live URLs, GitHub repos, or uploaded projects  
✅ **Discovers Vulnerabilities** - SAST, DAST, dependency, and secrets scanning  
✅ **Analyzes with AI** - LLM-powered insights and remediation recommendations  
✅ **Verifies Findings** - Automated non-destructive vulnerability verification  
✅ **Generates Reports** - Professional security audit reports  

### Key Features

- 🔐 **Dark Security Theme** - Neon green accent colors, professional UI
- 🛡️ **Real-time Scanning** - Live progress updates with detailed analytics
- 📊 **Comprehensive Dashboard** - Security metrics, trends, and quick wins
- 🔍 **Advanced Filtering** - Search and filter vulnerabilities by severity and status
- ⚡ **Fast Performance** - Optimized Next.js with code splitting and lazy loading
- 📱 **Fully Responsive** - Mobile, tablet, and desktop support
- ♿ **Accessible** - WCAG compliant with proper ARIA labels
- 🔌 **API-Ready** - Well-documented integration points for backend services

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 8.0 or later
- **Git** 2.30 or later

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/vibeguard-frontend.git
cd vibeguard-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
vibeguard-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout component
│   ├── globals.css              # Global styles & design tokens
│   ├── (auth)/                  # Auth routes (login, signup)
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── dashboard/           # Main dashboard page
│   │   ├── scan/                # New scan creation
│   │   ├── scans/               # Scan history
│   │   ├── findings/            # Global findings view
│   │   └── scan/[scanId]/...    # Individual scan details
│   └── api/                     # Backend API routes
│       ├── scans/               # Scan endpoints
│       ├── auth/                # Auth endpoints
│       └── reports/             # Report endpoints
│
├── components/                   # Reusable React components
│   ├── ui/                      # Atomic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── scan/                    # Scan-related components
│   ├── findings/                # Finding-related components
│   └── report/                  # Report-related components
│
├── lib/                          # Utilities & helpers
│   ├── types.ts                 # TypeScript interfaces
│   ├── api.ts                   # API client & endpoints
│   ├── utils.ts                 # Helper functions
│   ├── mock-data.ts             # Fake data for development
│   └── constants.ts             # App constants
│
├── styles/                       # Global styles
├── public/                       # Static assets
├── .env.example                 # Environment template
├── next.config.js               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies & scripts
```

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #00ff00;        /* Neon green accent */
--color-secondary: #00ffff;      /* Cyan accent */

/* Risk/Severity */
--color-critical: #ff3b30;       /* Red - critical */
--color-high: #ff9500;           /* Orange - high */
--color-medium: #ffcc00;         /* Yellow - medium */
--color-low: #34c759;            /* Green - low */

/* Surfaces */
--color-bg-primary: #0f1419;     /* Darkest */
--color-surface-1: #0f1419;      /* Page bg */
--color-surface-2: #1a1f2e;      /* Card bg */
--color-surface-3: #252d3d;      /* Hover */
```

### Typography

- **Font Family**: System fonts (Inter, Segoe UI, Helvetica)
- **Heading Sizes**: 32px, 24px, 20px, 18px, 16px
- **Body Text**: 14px, 13px, 12px
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing Scale

- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

---

## 🔌 Backend Integration

### API Endpoints

All backend API endpoints are documented in `lib/api.ts`:

```typescript
// Scans
GET    /api/scans                 # List all scans
POST   /api/scans                 # Create new scan
GET    /api/scans/:id             # Get scan details
DELETE /api/scans/:id             # Delete scan
POST   /api/scans/:id/start       # Start scan

// Findings
GET    /api/scans/:id/findings    # List findings
GET    /api/scans/:id/findings/:findingId
POST   /api/scans/:id/findings/:findingId/verify

// Reports
GET    /api/scans/:id/report      # Get report
GET    /api/scans/:id/report/pdf  # Download PDF

// Authentication
POST   /api/auth/login            # Login
POST   /api/auth/register         # Register
POST   /api/auth/logout           # Logout
```

### Environment Configuration

```env
# API Server
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Feature Flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=

# Authentication (if using Auth0)
# NEXT_PUBLIC_AUTH0_DOMAIN=
# NEXT_PUBLIC_AUTH0_CLIENT_ID=
```

---

## 📖 Pages & Features

### Dashboard
- Real-time security metrics
- Recent scan activity
- Vulnerability distribution charts
- Recommended security actions

### New Scan
- Support for 3 input types:
  - **Live URL**: Scan running web applications
  - **GitHub**: Clone and analyze repositories
  - **ZIP Upload**: Analyze local project files
- Pre-scan configuration and tech detection

### Scan Progress
- Real-time scanning animation
- Progress breakdown by analysis phase
- Discovery: framework, database, APIs detected
- SAST, DAST, dependency scanning stages
- LLM analysis and verification tests

### Findings
- Advanced filtering by severity and status
- Search vulnerabilities by title/description
- Pagination for large result sets
- Individual finding details with:
  - Full vulnerability description
  - Affected endpoint/file with line numbers
  - Evidence and proof of vulnerability
  - Remediation recommendations
  - Priority/urgency scoring

### Reports
- Professional security audit reports
- Executive summary and risk breakdown
- Verified vs. potential vulnerabilities
- Immediate actions and recommendations
- PDF export for stakeholders

---

## 🛠️ Development

### Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
npm run format           # Format code with Prettier
npm run clean            # Clear build files
```

### Adding a New Component

1. Create component file with TypeScript
2. Add CSS Module for styling
3. Export from `components/ui/index.ts`
4. Document with JSDoc comments

```typescript
/**
 * Component description
 * 
 * @example
 * <MyComponent title="Example" />
 */
export default function MyComponent({ title }: Props) {
  return <div>{title}</div>;
}
```

### Code Style

- **Files**: PascalCase for components, camelCase for utilities
- **Imports**: React → Next → Types → Components → Styles
- **Exports**: Use named exports, default export for pages
- **Styling**: CSS Modules with scoped class names

---

## 🧪 Testing & Quality

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

### Building
```bash
npm run build
npm start              # Test production build
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL=https://api.vibeguard.com`
- Other vars from `.env.local`

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package* .
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t vibeguard-frontend .
docker run -p 3000:3000 vibeguard-frontend
```

---

## 📚 Documentation

- **Setup Guide**: See [INSTALLATION_AND_SETUP.md](./INSTALLATION_AND_SETUP.md)
- **Folder Structure**: See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
- **Type Definitions**: See [lib/types.ts](./lib/types.ts)
- **API Client**: See [lib/api.ts](./lib/api.ts)

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

### TypeScript errors
```bash
npm run type-check
rm -rf .next node_modules
npm install
```

### Styling not applied
- Ensure CSS Module file is named `Component.module.css`
- Check import statement: `import styles from './Component.module.css'`
- Verify class name is in JSX: `className={styles.className}`

### API calls not working
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running
- Check browser console for CORS errors
- Ensure backend returns correct JSON format

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

### Code Guidelines
- Follow existing code style
- Write TypeScript for type safety
- Add JSDoc comments for public functions
- Keep components small and focused
- Use CSS Modules for styles

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Support

- **Documentation**: Check `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/yourusername/vibeguard-frontend/issues)
- **Email**: support@vibeguard.com

---

## 🙏 Acknowledgments

Built with modern web technologies:
- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [CSS Modules](https://github.com/css-modules/css-modules) - Style encapsulation

---

**Made with 🛡️ by the VibeGuard Team**