import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { LocalizedField } from '@/admin/components/LocalizedField';

function Harness({ ne = '', children }: { ne?: string; children: ReactNode }) {
  const form = useForm({ defaultValues: { title: { en: 'Iron', ne } } });
  return <FormProvider {...form}>{children}</FormProvider>;
}

const user = userEvent.setup();

describe('LocalizedField', () => {
  it('shows English | नेपाली tabs and flags a missing Nepali value', async () => {
    render(
      <Harness>
        <LocalizedField name="title" label="Title" as="input" max={20} required />
      </Harness>,
    );
    expect(screen.getByRole('tab', { name: 'English' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Title (English)')).toHaveValue('Iron');
    expect(screen.getByText('Nepali missing')).toHaveClass('sr-only');
    expect(screen.getByText('4 / 20')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /नेपाली/ }));
    const ne = screen.getByLabelText('Title (Nepali)');
    expect(ne).toHaveAttribute('lang', 'ne');
    expect(ne).toHaveClass('font-[Mukta]');
    await user.type(ne, 'फलाम');
    expect(screen.queryByText('Nepali missing')).toBeNull();
  });

  it('renders a textarea for textarea and richtext', () => {
    render(
      <Harness ne="पाठ">
        <LocalizedField name="title" label="Body" as="richtext" />
      </Harness>,
    );
    expect(screen.getByLabelText('Body (English)').tagName).toBe('TEXTAREA');
    expect(screen.queryByText('Nepali missing')).toBeNull();
  });
});
