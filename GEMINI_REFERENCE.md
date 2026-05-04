# MIHL League Portal - Complete Reference for Gemini Pro

## Project Overview
- **Name**: The Mensches Ice Hockey League (MIHL)
- **Stack**: React 19 + Tailwind 4 + shadcn/ui (frontend) | Express + tRPC 11 (backend) | MySQL/TiDB (database)
- **Language**: TypeScript
- **Bilingual**: English (EN) and French (FR) support required throughout

---

## File Structure
```
/home/ubuntu/mihl-league-portal/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx (example: public page)
│   │   │   ├── Registration.tsx (example: form with tRPC)
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx (example: admin overview)
│   │   │   │   ├── Players.tsx (example: admin list with mutations)
│   │   │   │   ├── EvaluationGames.tsx (example: admin data display)
│   │   │   │   ├── Games.tsx (TODO: score entry)
│   │   │   │   ├── News.tsx (TODO: CRUD)
│   │   │   │   ├── Stars.tsx (TODO: selection)
│   │   │   │   ├── AdminSuspensions.tsx (TODO: CRUD)
│   │   │   │   └── Messages.tsx (TODO: messaging)
│   │   ├── components/
│   │   │   ├── Header.tsx (global nav)
│   │   │   ├── Footer.tsx (global footer)
│   │   │   └── ui/ (shadcn/ui components)
│   │   ├── App.tsx (routing)
│   │   └── lib/trpc.ts (tRPC client setup)
├── server/
│   ├── routers/
│   │   ├── registration.ts (example: complete router)
│   │   ├── admin.ts (TODO: admin procedures)
│   │   └── league.ts (existing router)
│   ├── db.ts (database helpers)
│   └── _core/ (framework code - don't edit)
├── drizzle/
│   └── schema.ts (database tables)
├── package.json
└── todo.md (project checklist)
```

---

## Key Patterns & Examples

### 1. Component Structure (React + TypeScript)
```typescript
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyAdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");

  // Check admin access
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {language === "en" ? "Page Title" : "Titre de la Page"}
        </h1>
        {/* Content here */}
      </div>
    </div>
  );
}
```

### 2. Form with tRPC Mutation
```typescript
const [form, setForm] = useState({ name: "", email: "" });
const [isSubmitting, setIsSubmitting] = useState(false);

const mutation = trpc.admin.createItem.useMutation({
  onSuccess: (data) => {
    toast.success(language === "en" ? "Created!" : "Créé!");
    setForm({ name: "", email: "" });
    setIsSubmitting(false);
  },
  onError: (error) => {
    toast.error(error.message);
    setIsSubmitting(false);
  },
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    await mutation.mutateAsync(form);
  } catch (error) {
    // Error handled in onError
  }
};

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <Label htmlFor="name">{language === "en" ? "Name" : "Nom"}</Label>
      <Input
        id="name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder={language === "en" ? "Enter name" : "Entrez le nom"}
      />
    </div>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Loading..." : language === "en" ? "Submit" : "Soumettre"}
    </Button>
  </form>
);
```

### 3. Data Query with tRPC
```typescript
const { data: items, isLoading } = trpc.admin.listItems.useQuery();

if (isLoading) {
  return <div>Loading...</div>;
}

return (
  <div className="space-y-4">
    {items?.map((item) => (
      <Card key={item.id}>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
```

### 4. Bilingual Select Dropdown
```typescript
<Select value={selectedValue} onValueChange={setSelectedValue}>
  <SelectTrigger>
    <SelectValue placeholder={language === "en" ? "Select..." : "Sélectionner..."} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">
      {language === "en" ? "Option 1" : "Option 1"}
    </SelectItem>
    <SelectItem value="option2">
      {language === "en" ? "Option 2" : "Option 2"}
    </SelectItem>
  </SelectContent>
</Select>
```

### 5. Admin List with Actions
```typescript
<div className="space-y-2">
  {items?.map((item) => (
    <div key={item.id} className="p-4 bg-muted rounded-lg border border-border flex items-center justify-between">
      <div>
        <div className="font-semibold text-foreground">{item.name}</div>
        <div className="text-sm text-muted-foreground">{item.email}</div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleEdit(item.id)}>
          {language === "en" ? "Edit" : "Modifier"}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
          {language === "en" ? "Delete" : "Supprimer"}
        </Button>
      </div>
    </div>
  ))}
</div>
```

---

## tRPC Router Pattern (Backend)

### Creating a New Router
```typescript
// server/routers/admin.ts
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const inputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const adminRouter = router({
  // Public procedure (no auth required)
  getPublicData: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // Query database
      return data;
    }),

  // Protected procedure (requires login)
  createItem: protectedProcedure
    .input(inputSchema)
    .mutation(async ({ input, ctx }) => {
      // ctx.user contains current user info
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // Insert into database
      return { success: true, message: 'Created!' };
    }),

  // Query with parameters
  getItemById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // Query database with input.id
      return item;
    }),
});
```

### Registering Router in Main Router
```typescript
// server/routers.ts
import { adminRouter } from './routers/admin';

export const appRouter = router({
  admin: adminRouter,
  // ... other routers
});
```

---

## Tailwind CSS Classes Reference

### Layout
- `min-h-screen` - Full screen height
- `container` - Centered container with padding
- `max-w-7xl` - Max width constraint
- `mx-auto` - Center horizontally
- `px-4 py-8` - Padding
- `mb-4 mt-2 gap-4` - Margins and gaps

### Grid & Flex
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` - Responsive grid
- `flex items-center justify-between` - Flex layout
- `flex-col` - Vertical flex
- `space-y-4` - Vertical spacing between children

### Colors (Using Theme)
- `bg-background` - Background color
- `text-foreground` - Main text color
- `text-muted-foreground` - Secondary text
- `text-accent` - Accent color
- `bg-muted` - Muted background
- `border-border` - Border color

### Typography
- `text-4xl font-bold` - Large heading
- `text-2xl font-semibold` - Medium heading
- `text-sm text-muted-foreground` - Small secondary text
- `font-semibold` - Bold text

### Components
- `rounded-lg` - Rounded corners
- `border border-border` - Border styling
- `shadow-lg` - Shadow effect
- `hover:shadow-lg transition` - Hover effect

---

## Database Schema (Key Tables)

### playerRegistrations
```
- id: number (primary key)
- firstName: string
- lastName: string
- email: string
- phone: string
- registrationType: 'individual' | 'team' | 'spare' | 'referee' | 'scorekeeper'
- position: 'forward' | 'defenseman' | 'goalie' | null
- playerRating: number (1-10) | null
- status: 'pending' | 'approved' | 'rejected'
- paymentStatus: 'paid' | 'unpaid'
- evaluationDate: string | null (date like '2026-06-24')
- wantsCaptain: boolean
- seasonId: number
- createdAt: timestamp
- updatedAt: timestamp
```

### users
```
- id: number (primary key)
- openId: string (Manus OAuth ID)
- name: string
- email: string
- role: 'admin' | 'user'
- loginMethod: string
- createdAt: timestamp
- updatedAt: timestamp
- lastSignedIn: timestamp
```

---

## Important Constraints & Rules

### React/TypeScript
- ✅ Always use `useState` for form state
- ✅ Always use `useEffect` for side effects
- ✅ Import shadcn/ui components from `@/components/ui/*`
- ✅ Use `trpc.*` for all backend calls (never fetch/axios)
- ❌ NO nested anchor tags in Link components
- ❌ NO empty string values in Select.Item (use "none" instead)

### Styling
- ✅ Use Tailwind utility classes (not inline styles)
- ✅ Use responsive prefixes: `md:`, `lg:`, `sm:`
- ✅ Use semantic color classes: `bg-background`, `text-foreground`
- ✅ Mobile-first design (start with mobile, add breakpoints for larger screens)
- ❌ NO hardcoded colors (use theme variables)

### Bilingual Support
- ✅ All user-facing text must be bilingual
- ✅ Use pattern: `{language === "en" ? "English" : "Français"}`
- ✅ Store language in component state: `useState<"en" | "fr">("en")`
- ❌ NO hardcoded English-only text

### Forms & Validation
- ✅ Use Zod schemas for input validation
- ✅ Show loading states during submission
- ✅ Use `toast` for success/error messages
- ✅ Reset form after successful submission
- ❌ NO form submission without validation

### Admin Access
- ✅ Always check `user?.role === "admin"` before rendering admin pages
- ✅ Redirect non-admins to home page
- ✅ Use `protectedProcedure` in backend for admin routes

---

## Common Imports
```typescript
// React
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Icons (lucide-react)
import { Loader2, Users, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from "lucide-react";

// tRPC & Auth
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Notifications
import { toast } from "sonner";

// Validation
import { z } from "zod";
```

---

## Example: Complete Admin Page (News Management)

See `client/src/pages/admin/News.tsx` for a complete example that:
- Fetches data with tRPC query
- Creates new items with mutation
- Edits existing items
- Deletes items
- Shows loading states
- Handles errors with toast
- Supports bilingual UI
- Uses shadcn/ui components
- Responsive design

---

## Testing Your Code
1. Import the file in `App.tsx` and add route
2. Run dev server: `pnpm dev`
3. Navigate to the page in browser
4. Test form submission, data display, error handling
5. Test bilingual toggle
6. Test responsive design (mobile/tablet/desktop)

---

## Getting Help
- Check existing pages for patterns: `Registration.tsx`, `Dashboard.tsx`, `EvaluationGames.tsx`
- Reference the tRPC router: `server/routers/registration.ts`
- Check shadcn/ui documentation for component props
- Use TypeScript types for guidance (hover over variables)
