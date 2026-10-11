import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { RichTextEditor } from '@/admin/components/RichTextEditor';

function Harness({
  initial = '',
  onChange,
}: {
  initial?: string;
  onChange: (html: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <RichTextEditor
      label="Body"
      value={value}
      onChange={(html) => {
        setValue(html);
        onChange(html);
      }}
    />
  );
}

const user = userEvent.setup();

describe('RichTextEditor', () => {
  it('shows the current HTML and a labelled toolbar', async () => {
    render(<Harness initial="<p>Hematite <em>lump</em></p>" onChange={vi.fn()} />);
    const box = await screen.findByRole('textbox', { name: 'Body' });
    expect(box.innerHTML).toContain('<em>lump</em>');
    for (const name of [
      'Bold',
      'Italic',
      'Heading 2',
      'Heading 3',
      'Bullet list',
      'Numbered list',
      'Link',
      'Undo',
      'Redo',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('typing after Bold produces strong text via onChange', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const box = await screen.findByRole('textbox', { name: 'Body' });
    await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    await user.keyboard('Iron');
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('<p><strong>Iron</strong></p>'));
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports an empty document as an empty string', async () => {
    const onChange = vi.fn();
    render(<Harness initial="<p>x</p>" onChange={onChange} />);
    const box = await screen.findByRole('textbox', { name: 'Body' });
    await user.click(box);
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(''));
  });

  it('marks Nepali content with lang="ne" and the Mukta font', async () => {
    render(<RichTextEditor label="Body (Nepali)" lang="ne" value="" onChange={vi.fn()} />);
    const box = await screen.findByRole('textbox', { name: 'Body (Nepali)' });
    expect(box).toHaveAttribute('lang', 'ne');
    expect(box.className).toContain('font-[Mukta]');
  });
});
