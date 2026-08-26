# Tab Bar Visibility on Spaces Hub (`index.tsx`)

> **Status:** Implemented  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  
> **Target Screen / Layout:** `app/(app)/(tabs)/_layout.tsx` & `app/(app)/(tabs)/index.tsx`

---

## 1. Overview & Requirement

The landing screen `app/(app)/(tabs)/index.tsx` serves as the primary **SCIS Spaces Gateway** where authenticated students choose between two main spaces:
1. **Placement Studio** (Career preparation, assignments, coding challenges)
2. **Alumni Network** (Alumni directory, mentorship, events)

To ensure an uncluttered, focused gateway presentation, the bottom navigation tab bar is hidden when the user is on `index.tsx`. The screen displays only the header, the Placement and Alumni cards, and the university badge without the persistent bottom navigation bar.

---

## 2. Technical Implementation

In Expo Router / React Navigation tabs, per-screen tab bar visibility is controlled through the screen's `options` in `app/(app)/(tabs)/_layout.tsx`:

```tsx
<Tabs.Screen
  name="index"
  options={{
    title: "Home",
    tabBarStyle: { display: "none" },
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? "home" : "home-outline"}
        size={22}
        color={color}
      />
    ),
  }}
/>
```

### Behavior Across Navigation:
- **On `index.tsx` (Spaces Hub):** The bottom tab navigation bar is hidden (`display: "none"`).
- **On `placement.tsx` (Placement Center):** The bottom tab navigation bar is displayed normally, enabling navigation between tabs.
- **On `notifications.tsx` & `profile.tsx`:** Tab navigation remains accessible.
- **Returning to Hub:** Tapping "Home" from any secondary tab returns the student to `index.tsx`, where the tab bar is cleanly hidden.

---

## 3. Verification

- `npx tsc --noEmit` executed with zero errors.
- Verified TypeScript compilation and React Navigation options compliance.
