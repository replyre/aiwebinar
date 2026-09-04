import next from "eslint-config-next";

/**
 * `eslint-config-next` v16 already exports a flat config array — running it through
 * `FlatCompat` (the eslintrc bridge) makes it self-reference and ESLint dies with
 * "Converting circular structure to JSON", which reads like a plugin bug rather than a
 * config mistake. Spread it directly.
 */
const config = [...next, { ignores: ["legacy/**", ".next/**", "node_modules/**"] }];

export default config;
