module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
    jest: true,
  },
  ignorePatterns: [
    "prisma-client-app/**",
    "prisma/**",
    "tests/**",
    "scripts/**",
    "examples/**",
    "devops/**",
    "backend/controllers/**",
    "**/package-lock.json",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    react: { version: "detect" },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "no-unused-vars": "warn",
    "import/order": [
      "warn",
      { alphabetize: { order: "asc", caseInsensitive: true } },
    ],
    "react/prop-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },
};
