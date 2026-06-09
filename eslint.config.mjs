import nextConfig from "eslint-config-next"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Pre-existing patterns that trigger new React 19 lint rules.
      // Migration scope is Next 14 → 16, not React 18 → 19 data-fetch refactor.
      // See follow-up: move data fetching to server actions or use() with Suspense.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default eslintConfig
