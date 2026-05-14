import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [".history/**"],
  },
  ...nextConfig,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
  {
    files: ["**/planner-form.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
