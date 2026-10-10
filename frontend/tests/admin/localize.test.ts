import { localizedPayload, toFormValues, toPayload } from '@/admin/resources/localize';

const doc = {
  name: 'Iron ore lump',
  summary: 'S',
  translations: { name: { en: 'Iron ore lump', ne: 'फलाम' }, summary: { en: 'S' } },
};

describe('toFormValues', () => {
  it('fills empty Nepali', () => {
    expect(toFormValues(doc, ['name', 'summary'])).toMatchObject({
      name: { en: 'Iron ore lump', ne: 'फलाम' },
      summary: { en: 'S', ne: '' },
    });
  });

  it('drops translations and keeps other fields', () => {
    const out = toFormValues({ ...doc, order: 2 }, ['name']);
    expect(out).not.toHaveProperty('translations');
    expect(out.order).toBe(2);
  });

  it('uses the English string when a field has no translation', () => {
    expect(toFormValues({ name: 'Lump' }, ['name'])).toEqual({ name: { en: 'Lump', ne: '' } });
  });

  it('handles arrays of localized values per item', () => {
    const product = {
      applications: [{ title: 'Cement', body: 'Corrective' }],
      typicalChemistry: [{ oxide: 'Fe2O3', value: 33.59, unit: '%', basis: 'Table 14' }],
      translations: {
        applications: [{ title: { en: 'Cement', ne: 'सिमेन्ट' }, body: { en: 'Corrective' } }],
        typicalChemistry: [
          { oxide: 'Fe2O3', value: 33.59, unit: '%', basis: { en: 'Table 14', ne: 'तालिका १४' } },
        ],
      },
    };
    expect(toFormValues(product, ['applications', 'typicalChemistry'])).toEqual({
      applications: [
        { title: { en: 'Cement', ne: 'सिमेन्ट' }, body: { en: 'Corrective', ne: '' } },
      ],
      typicalChemistry: [
        { oxide: 'Fe2O3', value: 33.59, unit: '%', basis: { en: 'Table 14', ne: 'तालिका १४' } },
      ],
    });
  });
});

describe('toPayload', () => {
  it('sends only English when Nepali was not touched (keeps server Nepali)', () => {
    const values = { name: { en: 'Lump ore', ne: 'फलाम' }, summary: { en: 'S', ne: '' } };
    expect(toPayload(values, ['name', 'summary'], { name: { en: true } })).toEqual({
      name: { en: 'Lump ore' },
    });
  });

  it('sends both when Nepali was edited', () => {
    const values = { name: { en: 'Lump ore', ne: 'फलामको ढिका' } };
    expect(toPayload(values, ['name'], { name: { ne: true } })).toEqual({
      name: { en: 'Lump ore', ne: 'फलामको ढिका' },
    });
  });

  it('sends a cleared Nepali value when it was edited to empty', () => {
    const values = { name: { en: 'Lump ore', ne: '' } };
    expect(toPayload(values, ['name'], { name: { ne: true } })).toEqual({
      name: { en: 'Lump ore', ne: '' },
    });
  });

  it('passes dirty non-localized fields through and omits untouched ones', () => {
    const values = { name: { en: 'A', ne: '' }, order: 3, minOrder: 'x' };
    expect(toPayload(values, ['name'], { order: true })).toEqual({ order: 3 });
  });

  it('sends a dirty localized array whole, with Nepali per item', () => {
    const values = {
      applications: [
        { title: { en: 'Cement', ne: 'सिमेन्ट' }, body: { en: 'Corrective', ne: '' } },
      ],
    };
    expect(toPayload(values, ['applications'], { applications: [{ body: { en: true } }] })).toEqual(
      {
        applications: [{ title: { en: 'Cement', ne: 'सिमेन्ट' }, body: { en: 'Corrective' } }],
      },
    );
  });

  it('sends every field on create, Nepali only when filled', () => {
    const values = { name: { en: 'A', ne: '' }, summary: { en: 'S', ne: 'स' }, order: 0 };
    expect(toPayload(values, ['name', 'summary'], {}, { all: true })).toEqual({
      name: { en: 'A' },
      summary: { en: 'S', ne: 'स' },
      order: 0,
    });
  });
});

describe('localizedPayload', () => {
  it('keeps the stored Nepali unless the Nepali input was touched', () => {
    expect(localizedPayload({ en: 'a', ne: 'b' }, { en: true })).toEqual({ en: 'a' });
    expect(localizedPayload({ en: 'a', ne: 'b' }, { ne: true })).toEqual({ en: 'a', ne: 'b' });
  });
});
