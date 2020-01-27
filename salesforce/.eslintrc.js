// Copyright Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

module.exports = {
  "env": {
    "node": true,
    "es6": true,
    "mocha": true
  },
  "parserOptions": {
    "ecmaVersion": 8
  },
  "root": true,
  "extends": "eslint:recommended",
  "rules": {
    "indent": ["error", 4, { "SwitchCase": 1, "MemberExpression": 1, "FunctionDeclaration": { "parameters": 1 }, "FunctionExpression": { "parameters": 1 }, "CallExpression": { "arguments": 1 } }],
    "quotes": ["error", "double", { "avoidEscape": true }],
    "semi": ["error", "always"],
    "no-console": "off",
    "no-unsafe-negation": "error",
    "strict": ["error", "global"],
    "consistent-return": "error",
    "curly": ["error", "multi-line"],
    "dot-location": ["error", "property"],
    "no-case-declarations": "error",
    "no-multi-spaces": "error",
    "array-bracket-spacing": "error",
    "block-spacing": "error",
    "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
    "comma-dangle": ["error", "only-multiline"],
    "comma-spacing": "error",
    "comma-style": "error",
    "computed-property-spacing": "error",
    "consistent-this": ["error", "self"],
    "eol-last": "error",
    "func-call-spacing": "error",
    "key-spacing": "error",
    "keyword-spacing": "error",
    "new-cap": "error",
    "no-array-constructor": "error",
    "no-mixed-operators": "error",
    "no-new-object": "error",
    "no-tabs": "error",
    "no-trailing-spaces": "error",
    "no-underscore-dangle": ["error", { "allowAfterThis": true, "allowAfterSuper": true }],
    "no-whitespace-before-property": "error",
    "object-curly-spacing": ["error", "always"],
    "object-property-newline": ["error", { "allowMultiplePropertiesPerLine": true }],
    "one-var-declaration-per-line": "error",
    "operator-linebreak": ["error", "before"],
    "semi-spacing": "error",
    "space-before-function-paren": ["error", {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always"
    }],
    "space-in-parens": "error",
    "space-infix-ops": "error",
    "space-unary-ops": "error",
    "unicode-bom": "error",
    "arrow-body-style": "error",
    "arrow-spacing": "error",
    "no-useless-computed-key": "error",
    "no-useless-constructor": "error",
    "no-var": "error",
    "object-shorthand": ["error", "consistent-as-needed"],
    "prefer-arrow-callback": ["error", { "allowNamedFunctions": true }],
    "prefer-numeric-literals": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "rest-spread-spacing": "error",
    "symbol-description": "error",
    "template-curly-spacing": "error",
    "yield-star-spacing": "error"
  }
};
