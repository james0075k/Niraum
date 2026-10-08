/** Conventional Commits — https://www.conventionalcommits.org */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'frontend',
        'backend',
        'docs',
        'ci',
        'deps',
        'infra',
        'seo',
        'admin',
        'api',
        'ui',
        'release',
      ],
    ],
    'body-max-line-length': [0],
  },
};
