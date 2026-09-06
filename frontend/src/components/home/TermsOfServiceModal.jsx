import { FileText } from 'lucide-react';
import ModalShell from './ModalShell';

export default function TermsOfServiceModal({ open, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={FileText}
      title="Terms of Service"
      subtitle="Last updated: January 2025"
    >
      <p>
        By creating a school/organization account or joining an event as a judge, you agree to the
        following terms governing use of the USAL scoring and tabulation platform.
      </p>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">1. Account Responsibility</h4>
        <p>
          Administrators are responsible for the accuracy of contestant data, judge assignments,
          and scoring configurations (weights, computation type, lock settings) entered into the
          system. USAL is not responsible for results affected by incorrect setup.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">2. Judge Conduct</h4>
        <p>
          Judges agree to submit scores independently and in good faith. Once an administrator
          locks scoring, judges may not submit or modify scores until the event is unlocked.
          Attempting to bypass scoring locks or manipulate submitted scores is prohibited.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">3. AI-Assisted Features</h4>
        <p>
          Certain design elements (score sheets, layouts, certificates) may be generated with
          AI assistance. These are provided as a convenience and administrators should review
          generated output before publishing it to judges or contestants.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">4. Availability</h4>
        <p>
          We aim for high uptime during live events but do not guarantee uninterrupted service.
          We recommend administrators keep a backup export of scores during large competitions.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">5. Termination</h4>
        <p>
          We reserve the right to suspend accounts found to be tampering with scores, impersonating
          judges, or otherwise abusing the platform outside its intended use as a judging tool.
        </p>
      </div>

      <p className="text-xs text-[#6C7A71] pt-2 border-t border-[#E1E8DE]">
        Continued use of USAL after changes to these terms constitutes acceptance of the revised terms.
      </p>
    </ModalShell>
  );
}