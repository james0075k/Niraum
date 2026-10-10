/**
 * DRAFT legal text — a plain-language starting point, not legal advice.
 * Must be reviewed by Niraum Metals' legal counsel before launch.
 */
export interface LegalPage {
  slug: 'privacy' | 'terms' | 'cookies';
  title: string;
  description: string;
  updated: string;
  body: string;
}

export const legalPages: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'How Niraum Metals Pvt. Ltd. collects, uses and protects personal information.',
    updated: '2026-10-09',
    body: `<p>Niraum Metals Pvt. Ltd. ("we") respects your privacy. This policy explains what we collect through this website and why.</p>
<h2>What we collect</h2>
<ul><li>Details you send us through the contact, quote, newsletter or job application forms: name, email, phone, company, message and any CV you upload.</li>
<li>Basic technical data such as IP address and browser type, used for security and abuse prevention.</li>
<li>Analytics data, only if you accept analytics cookies.</li></ul>
<h2>How we use it</h2>
<p>To reply to enquiries, process applications, send newsletters you asked for and keep the website secure. We do not sell personal data.</p>
<h2>How long we keep it</h2>
<p>Enquiries and applications are kept only as long as needed for the purpose, then deleted. [PLACEHOLDER: Retention periods]</p>
<h2>Your rights</h2>
<p>You may ask to see, correct or delete your data. Contact us using the details on the Contact page.</p>`,
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    description: 'The terms that apply when you use the Niraum Metals website.',
    updated: '2026-10-09',
    body: `<p>By using this website you agree to these terms.</p>
<h2>Information on this site</h2>
<p>Content is provided for general information. Figures, project details and specifications may change and do not form an offer. Quotes are binding only when confirmed in writing.</p>
<h2>Intellectual property</h2>
<p>The Niraum Metals name, logo, text and photographs belong to Niraum Metals Pvt. Ltd. Do not reuse them without written permission.</p>
<h2>Liability</h2>
<p>We work to keep the site accurate and available but cannot guarantee it is error-free or uninterrupted.</p>
<h2>Governing law</h2>
<p>These terms are governed by the laws of Nepal.</p>`,
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'Which cookies the Niraum Metals website uses and how to control them.',
    updated: '2026-10-09',
    body: `<p>Cookies are small files stored by your browser. We keep their use to a minimum.</p>
<h2>Essential</h2>
<p>Needed for the site to work — for example remembering your theme and cookie choice, and keeping admin users signed in. These cannot be switched off.</p>
<h2>Analytics</h2>
<p>Used only if you choose "Accept all". They help us understand which pages are useful. [PLACEHOLDER: Analytics provider]</p>
<h2>Changing your choice</h2>
<p>Clear this site's data in your browser to see the cookie banner again and choose differently.</p>`,
  },
];
