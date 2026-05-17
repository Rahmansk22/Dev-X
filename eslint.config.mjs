import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["**/generated/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",  
      "@typescript-eslint/no-unused-vars": "warn", 
      "react-hooks/exhaustive-deps": "off",         
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "react/no-children-prop": "off",
      "import/no-anonymous-default-export": "off",
      "@typescript-eslint/no-require-imports": "off"
    },
  },
];

export default eslintConfig;
