import sanitizeHtml from 'sanitize-html';

/** Allow-list for CMS rich text (rendered with dangerouslySetInnerHTML on the site). */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'h2',
    'h3',
    'h4',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'figure',
    'figcaption',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'code',
    'pre',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export const cleanHtml = (html: string): string => sanitizeHtml(html, options);
