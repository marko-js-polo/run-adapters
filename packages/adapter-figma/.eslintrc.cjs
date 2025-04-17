// https://www.npmjs.com/package/eslint-config-moon
module.exports = {
	root: true,
	extends: [
		'moon',
    'moon/node',
	],
  // parserOptions: {
  //   ecmaVersion: "latest",
  //   sourceType: "module",
  //   impliedStrict: true
  // },
  // settings: {
  //   "import/resolver": {
  //     typescript: true
  //   }
  // },
  // env: {
  //   node: true,
  //   es2024: true,
  //   browser: true
  // },
  // rules: {
  //   "import/order": [
  //     error,
  //     {
  //       groups: [
  //         [
  //           "builtin"
  //         ],
  //         [
  //           "external"
  //         ],
  //         "internal",
  //         "parent",
  //         "sibling",
  //         "index"
  //       ],
  //       alphabetize: {
  //         "order": "asc",
  //         "orderImportKind": "asc",
  //         "caseInsensitive": true
  //       }
  //     }
  //   ]
  // },
  // overrides: [
  //   {
  //     files: [
  //       "**/*.ts"
  //     ],
  //     parser: "@typescript-eslint/parser",
  //     extends: [
  //       "eslint:recommended",
  //       "plugin:@typescript-eslint/recommended",
  //       "plugin:import/recommended",
  //       "plugin:import/typescript",
  //       "plugin:testing-library/marko",
  //       "prettier"
  //     ],
  //     rules: {
  //       "@typescript-eslint/explicit-module-boundary-types": "off",
  //       "@typescript-eslint/no-non-null-assertion": "off",
  //       "@typescript-eslint/no-empty-function": "off",
  //       "@typescript-eslint/no-explicit-any": "off"
  //     }
  //   }
  // ]
};
