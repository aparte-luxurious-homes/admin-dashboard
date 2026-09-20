import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});


const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  }),
  {
    // Owner-facing money is written "NGN 1,530,000", never with the naira
    // symbol (owner home spec D12): it renders as a box in several of the
    // fonts and PDF viewers owners use, and owners screenshot these figures
    // and send them on. Use formatNgn from src/lib/utils.
    //
    // Scoped to the owner home rather than the whole app, where 33 uses of the
    // symbol predate the rule.
    files: ['src/components/owner-home/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/₦/]",
          message: 'Write NGN in full on owner-facing money. Use formatNgn().',
        },
        {
          selector: "TemplateElement[value.cooked=/₦/]",
          message: 'Write NGN in full on owner-facing money. Use formatNgn().',
        },
        {
          // formatMoney injects the symbol itself, so importing it here is the
          // likelier way the rule above gets bypassed.
          selector: "ImportSpecifier[imported.name='formatMoney']",
          message: 'Owner-facing money uses formatNgn(), not formatMoney().',
        },
      ],
    },
  },
]


export default eslintConfig;
