import { MessageCircle, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/features/settings/useSettings';

const item =
  'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold';

/**
 * Sticky mobile action bar (< md). Call / WhatsApp once those numbers are set in admin;
 * until then it offers Contact and Get a Quote so it is never a dead end.
 */
export function MobileCta() {
  const { contact } = useSettings();
  const phone = contact.phone[0]?.replace(/\s/g, '');
  const whatsapp = contact.whatsapp?.replace(/\D/g, '');

  return (
    <nav
      aria-label="Quick actions"
      className="glass-strong fixed inset-x-3 bottom-3 z-40 flex gap-2 p-2 md:hidden"
    >
      {phone ? (
        <a href={`tel:${phone}`} className={`${item} text-foreground`}>
          <Phone className="h-4 w-4" aria-hidden="true" /> Call
        </a>
      ) : (
        <Link to="/contact" className={`${item} text-foreground`}>
          <Send className="h-4 w-4" aria-hidden="true" /> Contact
        </Link>
      )}
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${item} bg-copper-gradient text-graphite`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
        </a>
      ) : (
        <Link
          to="/contact?subject=Quote%20request"
          className={`${item} bg-copper-gradient text-graphite`}
        >
          Get a Quote
        </Link>
      )}
    </nav>
  );
}
