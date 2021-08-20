module.exports = {
  root: true,

  // Make ESLint compatible with TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],

    // Allow the use of imports / ES modules
    sourceType: 'module',

    ecmaFeatures: {
      // Enable global strict mode
      impliedStrict: true
    }
  },

  // Specify global variables that are predefined
  env: {
    node: true, // Enable node global variables & Node.js scoping
    es2020: true // Add all ECMAScript 2020 globals and automatically set the ecmaVersion parser option to ES2020
  },

  plugins: [],
  extends: ['@xrplf/eslint-config/base', 'plugin:mocha/recommended'],
  rules: {
    // Certain rippled APIs require snake_case naming
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase']
      },
      {
        selector: 'interface',
        format: ['snake_case']
      }
    ],

    // Ignore type imports when counting dependencies.
    'import/max-dependencies': [
      'error',
      {
        max: 5,
        ignoreTypeImports: true
      }
    ]
  },
  overrides: []
}
