import type { ZodObject, ZodRawShape } from 'zod';
import { RESOURCES, type ResourceConfig } from '@/admin/resources/config';
import { buildBody, docToForm, emptyValues } from '@/admin/resources/form';

const configs = Object.values(RESOURCES) as ResourceConfig[];
const shapeOf = (cfg: ResourceConfig) => (cfg.schema as ZodObject<ZodRawShape>).shape;

/** A new document with only the required fields filled. */
function filled(cfg: ResourceConfig) {
  const values = emptyValues(cfg);
  const title = values[cfg.titleField];
  values[cfg.titleField] =
    typeof title === 'object' ? { en: 'Katujpani hematite', ne: '' } : 'Katujpani hematite';
  return values;
}

describe.each(configs.map((c) => [c.key, c] as const))('%s config', (_key, cfg) => {
  it('validates every form field it renders', () => {
    const shape = shapeOf(cfg);
    for (const f of cfg.fields) expect(Object.keys(shape)).toContain(f.name);
    expect(Object.keys(shape)).toContain(cfg.visibleField);
    if (cfg.slug) expect(Object.keys(shape)).toContain('slug');
    if (cfg.seo) expect(Object.keys(shape)).toContain('seo');
    if (cfg.schedulable) expect(Object.keys(shape)).toContain('publishedAt');
  });

  it('accepts a new document with only the title filled', () => {
    const values = filled(cfg);
    // Required selects start on their first option, so they are valid too.
    const result = cfg.schema.safeParse(values);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it('marks every localized backend field as localized in the form', () => {
    for (const name of cfg.localized) {
      const f = cfg.fields.find((x) => x.name === name);
      expect(f, `field ${name}`).toBeDefined();
      expect(f?.localized, `field ${name}`).toBe(true);
    }
  });
});

describe('form ↔ body conversions', () => {
  const team = RESOURCES.team as ResourceConfig;
  const services = RESOURCES.services as ResourceConfig;
  const projects = RESOURCES.projects as ResourceConfig;

  it('sends empty nullable values as null (LinkedIn, venture year)', () => {
    const values = filled(team);
    values.otherVentures = [
      { company: 'Niraum Metals', role: { en: '', ne: '' }, sector: { en: '', ne: '' } },
    ];
    const body = buildBody(team, team.schema.parse(values), {}, true);
    expect(body.linkedin).toBeNull();
    expect(body.otherVentures).toEqual([
      { company: 'Niraum Metals', role: { en: '' }, sector: { en: '' }, since: null },
    ]);
  });

  it('sends a service stat without a value as null', () => {
    const values = filled(services);
    values.stats = [{ label: 'Reserve', suffix: 't', placeholder: '[CONFIRM]' }];
    const body = buildBody(services, services.schema.parse(values), {}, true);
    expect(body.stats).toEqual([
      { label: 'Reserve', value: null, suffix: 't', placeholder: '[CONFIRM]' },
    ]);
  });

  it('keeps a project location lat/lng the form does not show', () => {
    const doc = {
      title: 'Katujpani',
      mineral: 'iron-ore',
      location: { name: 'Katujpani', district: 'Dhading', lat: 27.9, lng: 84.9 },
      published: false,
    };
    const values = projects.schema.parse(docToForm(projects, doc));
    (values.location as { district: string }).district = 'Dhading district';
    const body = buildBody(projects, values, { location: { district: true } }, false);
    expect(body).toEqual({
      location: { name: 'Katujpani', district: 'Dhading district', lat: 27.9, lng: 84.9 },
    });
  });
});
