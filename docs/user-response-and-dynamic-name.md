# Backend User Response Mapping & Dynamic Student Name

## 1. Overview & Objective
In accordance with the existing SCIS Connect backend response format:
```typescript
const formatUserWithCommunity: (user: any) => Promise<{
    id: any;
    name: any;
    email: any;
    roll_no: any;
    role: any;
    isActive: boolean;
    isEmailVerified: any;
    batchYear: any;
    program: {
        id: any;
        name: any;
        code: any;
    };
}>
```
This update ensures that:
1. All hardcoded names (such as `"GARV"`) in the application header/welcome states have been completely eliminated.
2. The user profile and authentication state dynamically extract and display the logged-in student's real name returned from the backend (`user.name`).
3. The TypeScript types in `features/auth/types.ts` strictly conform to the `formatUserWithCommunity` response contract, including `roll_no`, `batchYear`, `isActive`, `isEmailVerified`, and `program` (`id`, `name`, `code`).
4. Both the **Home Dashboard** and **Student Profile** screens render live dynamic data from the Zustand `useAuthStore` and persistent storage.

---

## 2. Updated Type Contracts (`features/auth/types.ts`)

```typescript
export interface ProgramInfo {
  id?: string;
  _id?: string;
  name: string;
  code: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  roll_no?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  batchYear?: number | string;
  program?: ProgramInfo | null;
  studentId?: string;
  course?: string;
  semester?: number;
  avatar?: string;
  avatarUrl?: string;
  community?: {
    _id?: string;
    id?: string;
    name?: string;
    code?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 3. Dynamic Name Extraction in Home Screen (`app/(app)/(tabs)/index.tsx`)

### Before:
```typescript
const getFirstName = () => {
  if (!user?.name) return "GARV"; // Hardcoded fallback
  const first = user.name.trim().split(" ")[0];
  return first.toUpperCase();
};
```

### After:
```typescript
const getFirstName = () => {
  if (!user?.name) return "STUDENT";
  const first = user.name.trim().split(" ")[0];
  return first.toUpperCase();
};

const programDisplay = user?.program?.code || user?.program?.name || user?.course;
```

When a user logs in (e.g. `name: "Aarav Sharma"`), the header dynamically displays:
> **Welcome, AARAV.**
> **Your next chapter starts here.**

And the top badge dynamically renders `SCIS PORTAL · MCA` (or the respective student program code).

---

## 4. Student Profile Screen (`app/(app)/(tabs)/profile.tsx`)
The profile screen now displays:
- **Student Initials & Full Name**: Rendered dynamically from `user.name`
- **Email**: `user.email`
- **Role**: `user.role`
- **Roll Number**: `user.roll_no` (e.g. `25MCMC35`)
- **Program**: `user.program.name (user.program.code)` (e.g. `Master of Computer Applications (MCA)`)
- **Batch Year**: `user.batchYear` (e.g. `2024` or `2025`)
- **Account Status**: `Active` / `Inactive` based on `user.isActive`
- **Email Status**: `Verified` / `Pending` based on `user.isEmailVerified`
- **Account ID**: `user.id`

---

## 5. Architectural & Data Flow

```text
Backend API (/api/auth/login or /api/auth/refresh)
       │
       ▼ Returns formatUserWithCommunity response:
       │ { id, name, email, roll_no, role, isActive, isEmailVerified, batchYear, program }
       │
       ▼
features/auth/api.ts (parses response.data.user)
       │
       ▼
features/auth/authStore.ts (stores user in Zustand state)
       │
       ├──► Persistent Storage: SecureStore (via storageService)
       │
       ▼
Components / Screens (useAuthStore / useAuth):
       ├──► app/(app)/(tabs)/index.tsx: getFirstName() -> `Welcome, ${first}.`
       └──► app/(app)/(tabs)/profile.tsx: Dynamic fields (Roll No, Program, Batch, Status)
```

---

## 6. Verification
- TypeScript compilation checked with zero errors.
- Dynamic fallback safely set to `"STUDENT"` if user name is not yet loaded.
- Hot reloaded and verified in active Expo session.
