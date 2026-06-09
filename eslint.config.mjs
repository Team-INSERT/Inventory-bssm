import nextConfig from "eslint-config-next"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Pre-existing patterns that trigger new React 19 lint rules
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default eslintConfig
