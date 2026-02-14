# CNB Admin Dashboard - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Authentication & Security](#authentication--security)
6. [Core Features](#core-features)
7. [Firebase Integration](#firebase-integration)
8. [API & Cloud Functions](#api--cloud-functions)
9. [UI Components & Styling](#ui-components--styling)
10. [Development Guidelines](#development-guidelines)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**CNB Admin Dashboard** is a comprehensive web-based administration system built for managing an e-commerce platform. The application provides a complete interface for administrators to manage products, categories, promotions, and users.

### Key Capabilities
- **Product Management**: Create, edit, delete, and organize products with images
- **Category Management**: Hierarchical category system (3 levels deep)
- **Promotion Management**: Create and manage discount campaigns
- **User Management**: Role-based access control and user administration
- **Authentication**: Secure Firebase Authentication with role-based permissions

---

## 🏗️ Architecture & Tech Stack

### Frontend Stack
- **Framework**: Next.js 15.1.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3.4.1 + Headless UI
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Notifications**: React Hot Toast

### Backend Stack
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions (Node.js 20)
- **Email**: SendGrid + Nodemailer
- **Authentication**: Firebase Authentication

### Development Tools
- **Linting**: ESLint with Next.js config
- **Package Manager**: npm
- **Build Tool**: Next.js built-in bundler
- **Deployment**: Firebase Hosting

---

## 📁 Project Structure

```
cnb-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Protected admin routes
│   │   │   ├── products/      # Product management
│   │   │   ├── categories/    # Category management
│   │   │   ├── promotions/    # Promotion management
│   │   │   ├── users/         # User management
│   │   │   ├── layout.tsx     # Admin layout with navigation
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── login/             # Authentication page
│   │   ├── terms/             # Terms of service
│   │   ├── privacy-policy/    # Privacy policy
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   └── DebugInfo.tsx      # Debug component
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ThemeContext.tsx   # Theme management
│   ├── lib/                   # Utility libraries
│   │   └── firebase.ts        # Firebase configuration & functions
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # Core data models
│   └── middleware.ts          # Route protection middleware
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   ├── email/            # Email templates & sending
│   │   ├── types/            # Backend type definitions
│   │   └── index.ts          # Cloud Functions entry point
│   └── package.json          # Functions dependencies
├── public/                   # Static assets
├── firebase.json            # Firebase configuration
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── package.json            # Main dependencies
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Firebase CLI
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cnb-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

4. **Firebase Setup**
   ```bash
   firebase login
   firebase use cnb-app-f2ed6
   ```

5. **Install Cloud Functions dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin (requires authentication)

### Environment Configuration
The Firebase configuration is hardcoded in `src/lib/firebase.ts`. For production, consider moving sensitive keys to environment variables.

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Login Process**: Users authenticate via Firebase Auth using email/password
2. **Token Management**: JWT tokens stored in HTTP-only cookies
3. **Route Protection**: Middleware protects admin routes
4. **Role-Based Access**: Users have roles (Admin, Manager, User - Price, User - No Price, Pending)

### Security Features
- **Middleware Protection**: `src/middleware.ts` protects admin routes
- **Firestore Rules**: Database-level security in `firestore.rules`
- **Storage Rules**: File upload security in `storage.rules`
- **Role Verification**: Server-side role checking in Cloud Functions

### User Roles
- **Admin**: Full access to all features
- **Manager**: Limited administrative access
- **User - Price**: Can view products with pricing
- **User - No Price**: Can view products without pricing
- **Pending**: Awaiting approval

---

## 🎛️ Core Features

### 1. Product Management
**Location**: `src/app/admin/products/`

**Features**:
- Create, edit, delete products
- Image upload and management
- Category assignment (3-level hierarchy)
- Stock management
- Price management

**Key Functions** (`src/lib/firebase.ts`):
- `createProduct()`: Add new products
- `updateProduct()`: Modify existing products
- `deleteProduct()`: Remove products and associated images
- `getAllProducts()`: Fetch all products
- `getProductById()`: Get specific product

### 2. Category Management
**Location**: `src/app/admin/categories/`

**Features**:
- Hierarchical category system (Category → Subcategory → Sub-subcategory)
- Drag-and-drop ordering
- Nested category creation
- Category deletion with validation

**Key Functions**:
- `createCategory()`: Create categories at any level
- `getAllCategories()`: Fetch category tree
- `deleteCategory()`: Remove categories
- `updateCategory()`: Modify category details

### 3. Promotion Management
**Location**: `src/app/admin/promotions/`

**Features**:
- Create discount campaigns
- Percentage or fixed amount discounts
- Date-based promotion periods
- Minimum purchase requirements
- Product-specific promotions

**Key Functions**:
- `createPromotion()`: Create new promotions
- `getAllPromotions()`: Fetch all promotions
- `updatePromotion()`: Modify promotions
- `deletePromotion()`: Remove promotions

### 4. User Management
**Location**: `src/app/admin/users/`

**Features**:
- View all registered users
- Update user roles
- Delete users
- User activation email system

**Key Functions**:
- `getAllUsers()`: Fetch user list
- `updateUserRole()`: Change user permissions
- `deleteUser()`: Remove users (via Cloud Function)

---

## 🔥 Firebase Integration

### Firestore Collections
```typescript
// Main collections
users/          // User profiles and roles
products/       // Product catalog
categories/     // Category hierarchy
promotions/     // Discount campaigns
```

### Storage Structure
```
images/
├── products/   // Product images
└── promotions/ // Promotion banners
```

### Key Firebase Functions
**File**: `src/lib/firebase.ts`

```typescript
// Authentication
export const auth = getAuth(app);

// Database
export const db = getFirestore(app);
export const usersCollection = collection(db, 'users');
export const productsCollection = collection(db, 'products');

// Storage
export const storage = getStorage(app);
export async function uploadImage(file: File): Promise<string>
```

---

## ⚡ API & Cloud Functions

### Cloud Functions Overview
**Location**: `functions/src/index.ts`

### Available Functions

1. **User Role Update Trigger**
   ```typescript
   onUserRoleUpdate // Sends activation emails when role changes
   ```

2. **User Deletion**
   ```typescript
   deleteUserFunction // Securely deletes users from Auth
   ```

3. **Test User Creation**
   ```typescript
   createTestUser // Creates test users for development
   ```

### Email System
**Location**: `functions/src/email/`

- **Templates**: HTML email templates for user activation
- **Sender**: SendGrid/Nodemailer integration
- **Triggers**: Automatic emails on role changes

---

## 🎨 UI Components & Styling

### Design System
- **Framework**: TailwindCSS with custom color scheme
- **Components**: Headless UI for accessible components
- **Icons**: Heroicons
- **Primary Color**: Orange (#FB8A13)
- **Typography**: Inter font family

### Key UI Patterns
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme context with system preference detection
- **Loading States**: Consistent loading indicators
- **Error Handling**: Toast notifications for user feedback
- **Form Validation**: Client-side validation with error states

### Component Structure
```typescript
// Example component pattern
interface ComponentProps {
  // TypeScript props
}

export default function Component({ props }: ComponentProps) {
  // Component logic
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
}
```

---

## 👨‍💻 Development Guidelines

### Code Standards
1. **TypeScript**: Strict typing, avoid `any`
2. **Components**: Functional components with hooks
3. **File Naming**: PascalCase for components, camelCase for utilities
4. **Imports**: Absolute imports using `@/` alias

### Best Practices
1. **Error Handling**: Always wrap async operations in try-catch
2. **Loading States**: Show loading indicators for async operations
3. **Type Safety**: Define interfaces for all data structures
4. **Performance**: Use React.memo for expensive components
5. **Security**: Validate all user inputs and API calls

### Adding New Features

1. **Create Types**: Define TypeScript interfaces in `src/types/`
2. **Add Firebase Functions**: Extend `src/lib/firebase.ts`
3. **Create Components**: Build reusable UI components
4. **Add Routes**: Create pages in `src/app/`
5. **Update Navigation**: Modify admin layout if needed

### Testing Strategy
- **Manual Testing**: Test all CRUD operations
- **Cross-browser**: Test on Chrome, Firefox, Safari
- **Mobile**: Ensure responsive design works
- **Authentication**: Test all user roles and permissions

---

## 🚀 Deployment

### Firebase Hosting Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

3. **Deploy only hosting**
   ```bash
   firebase deploy --only hosting
   ```

4. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

### Production Checklist
- [ ] Environment variables configured
- [ ] Firebase security rules updated
- [ ] Error monitoring setup
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Analytics integration

---

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Firebase configuration
   - Verify user roles in Firestore
   - Clear browser cookies and try again

2. **Image Upload Failures**
   - Check Firebase Storage rules
   - Verify file size limits
   - Ensure proper file types

3. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

4. **Cloud Functions Issues**
   - Check function logs: `firebase functions:log`
   - Verify function deployment: `firebase deploy --only functions`
   - Test locally: `firebase emulators:start`

### Debug Tools
- **React DevTools**: Component inspection
- **Firebase Console**: Database and authentication monitoring
- **Network Tab**: API call debugging
- **Console Logs**: Application error tracking

### Performance Optimization
- **Image Optimization**: Use Next.js Image component
- **Code Splitting**: Lazy load heavy components
- **Bundle Analysis**: Use `npm run build` to check bundle size
- **Caching**: Implement proper caching strategies

---

## 📞 Support & Maintenance

### Key Files to Monitor
- `src/lib/firebase.ts`: Core Firebase integration
- `src/middleware.ts`: Authentication middleware
- `functions/src/index.ts`: Backend Cloud Functions
- `firestore.rules`: Database security

### Regular Maintenance Tasks
1. **Update Dependencies**: Monthly security updates
2. **Monitor Logs**: Check for errors and performance issues
3. **Backup Data**: Regular Firestore exports
4. **Security Review**: Audit user permissions and access

### Documentation Updates
When adding new features, update:
- This documentation file
- Code comments and JSDoc
- Type definitions
- README.md if needed

---

## 🎯 Next Steps for New Developer

1. **Familiarize with Codebase**
   - Read through `src/lib/firebase.ts` for data operations
   - Understand the authentication flow in `src/contexts/AuthContext.tsx`
   - Review the admin layout in `src/app/admin/layout.tsx`

2. **Set Up Development Environment**
   - Follow the installation steps above
   - Create test data in Firebase Console
   - Test all major features

3. **Understand Data Flow**
   - Study the TypeScript interfaces in `src/types/index.ts`
   - Trace how data flows from Firebase to UI components
   - Review the middleware protection logic

4. **Practice Common Tasks**
   - Add a new field to the Product interface
   - Create a simple new admin page
   - Modify an existing Cloud Function

This documentation should provide everything needed to understand, maintain, and extend the CNB Admin Dashboard. For specific implementation details, refer to the inline code comments and TypeScript definitions throughout the codebase. 