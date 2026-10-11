import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** An empty TipTap document serialises as `<p></p>`; the API stores that as no body. */
const normalise = (html: string) => (html === '<p></p>' ? '' : html);

/** Admin-only content styles (no typography plugin; public pages use `.prose-site`). */
const EDITOR_CLASS = cn(
  'min-h-40 space-y-3 px-3 py-2 text-sm leading-relaxed focus:outline-none',
  '[&_h2]:pt-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:pt-1 [&_h3]:text-lg [&_h3]:font-semibold',
  '[&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_a]:text-copper [&_a]:underline [&_strong]:font-semibold',
  '[&_.is-editor-empty:first-child]:before:pointer-events-none',
  '[&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0',
  '[&_.is-editor-empty:first-child]:before:text-muted-foreground',
  '[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
);

/** Links the backend sanitiser keeps: https, site paths, mailto and tel. */
const SAFE_HREF = /^(https:\/\/|\/|mailto:|tel:)/i;

interface Tool {
  label: string;
  icon: LucideIcon;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
  can?: (e: Editor) => boolean;
}

const TOOLS: Tool[] = [
  {
    label: 'Bold',
    icon: Bold,
    run: (e) => e.chain().focus().toggleBold().run(),
    active: (e) => e.isActive('bold'),
  },
  {
    label: 'Italic',
    icon: Italic,
    run: (e) => e.chain().focus().toggleItalic().run(),
    active: (e) => e.isActive('italic'),
  },
  {
    label: 'Heading 2',
    icon: Heading2,
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    active: (e) => e.isActive('heading', { level: 2 }),
  },
  {
    label: 'Heading 3',
    icon: Heading3,
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    active: (e) => e.isActive('heading', { level: 3 }),
  },
  {
    label: 'Bullet list',
    icon: List,
    run: (e) => e.chain().focus().toggleBulletList().run(),
    active: (e) => e.isActive('bulletList'),
  },
  {
    label: 'Numbered list',
    icon: ListOrdered,
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    active: (e) => e.isActive('orderedList'),
  },
];

const HISTORY: Tool[] = [
  {
    label: 'Undo',
    icon: Undo2,
    run: (e) => e.chain().focus().undo().run(),
    can: (e) => e.can().undo(),
  },
  {
    label: 'Redo',
    icon: Redo2,
    run: (e) => e.chain().focus().redo().run(),
    can: (e) => e.can().redo(),
  },
];

function ToolButton({ tool, editor }: { tool: Tool; editor: Editor | null }) {
  const Icon = tool.icon;
  const pressed = editor && tool.active ? tool.active(editor) : undefined;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', pressed && 'bg-muted text-foreground')}
      aria-label={tool.label}
      title={tool.label}
      aria-pressed={tool.active ? !!pressed : undefined}
      disabled={!editor || (tool.can ? !tool.can(editor) : false)}
      // Keep the selection: a mousedown on the button would otherwise blur the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => editor && tool.run(editor)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

/**
 * TipTap editor (StarterKit + Link) that reads and writes HTML. The backend sanitises the HTML
 * again on save (`cleanHtml`), so this only has to produce the tags the site styles: p, h2, h3,
 * strong, em, ul/ol/li and a.
 */
export function RichTextEditor(props: {
  value: string;
  onChange(html: string): void;
  label: string;
  lang?: 'en' | 'ne';
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  onBlur?(): void;
}): JSX.Element {
  const { value, onChange, label, lang = 'en', id, invalid, describedBy, onBlur } = props;
  const linkInputId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const [linkError, setLinkError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ['mailto', 'tel'] }),
      Placeholder.configure({ placeholder: lang === 'ne' ? 'यहाँ लेख्नुहोस्…' : 'Start writing…' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        lang,
        ...(id && { id }),
        ...(invalid && { 'aria-invalid': 'true' }),
        ...(describedBy && { 'aria-describedby': describedBy }),
        class: cn(EDITOR_CLASS, lang === 'ne' && 'font-[Mukta]'),
      },
    },
    onUpdate: ({ editor: e }) => onChange(normalise(e.getHTML())),
    onBlur: () => onBlur?.(),
  });

  // Outside changes (form reset, loading a document) replace the content without an onChange.
  useEffect(() => {
    if (editor && !editor.isDestroyed && normalise(editor.getHTML()) !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const openLink = () => {
    setHref((editor?.getAttributes('link').href as string | undefined) ?? '');
    setLinkError('');
    setLinkOpen(true);
  };

  const applyLink = (e: FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const url = href.trim();
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else if (!SAFE_HREF.test(url)) {
      setLinkError('Use https://, a /path, mailto: or tel:');
      return;
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
  };

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring',
        invalid && 'border-destructive',
      )}
    >
      <div
        role="toolbar"
        aria-label={`${label} formatting`}
        className="flex flex-wrap items-center gap-0.5 border-b p-1"
      >
        {TOOLS.map((t) => (
          <ToolButton key={t.label} tool={t} editor={editor} />
        ))}
        <ToolButton
          tool={{
            label: 'Link',
            icon: LinkIcon,
            run: openLink,
            active: (e) => e.isActive('link'),
          }}
          editor={editor}
        />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        {HISTORY.map((t) => (
          <ToolButton key={t.label} tool={t} editor={editor} />
        ))}
      </div>
      {linkOpen && (
        <form onSubmit={applyLink} className="flex flex-wrap items-start gap-2 border-b p-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor={linkInputId} className="sr-only">
              Link address
            </label>
            <Input
              id={linkInputId}
              value={href}
              autoFocus
              placeholder="https://… — leave empty to remove the link"
              aria-invalid={!!linkError}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setLinkOpen(false)}
            />
            {linkError && <p className="text-xs font-medium text-destructive">{linkError}</p>}
          </div>
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </form>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
