import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  depositService,
  jobService,
  postService,
  productService,
  projectService,
  serviceService,
  teamService,
} from '../src/services/resources.js';

/**
 * The admin forms build `{ en }` / `{ en, ne }` payloads from a copy of each resource's
 * localized field list (frontend/src/admin/resources/localized.json). Drift fails here.
 */
const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../../frontend/src/admin/resources/localized.json');
const lists = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string[]>;

const services = {
  products: productService,
  deposits: depositService,
  team: teamService,
  services: serviceService,
  projects: projectService,
  posts: postService,
  jobs: jobService,
};

describe('admin localized field lists', () => {
  it('cover every content resource', () => {
    expect(Object.keys(lists).sort()).toEqual(Object.keys(services).sort());
  });

  it.each(Object.entries(services))('%s matches services/resources.ts', (key, service) => {
    expect(lists[key]).toEqual([...service.localized]);
  });
});
