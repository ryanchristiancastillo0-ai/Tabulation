import { ShieldCheck } from 'lucide-react';
import ModalShell from './ModalShell';

export default function PrivacyPolicyModal({ open, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={ShieldCheck}
      title="Privacy Policy"
      subtitle="Last updated: January 2025"
    >
      <p>
        USAL ("the Platform") is a judging and score tabulation system used to run competitions,
        pageants, and school events. This policy explains what information we collect from
        administrators, judges, and contestants, and how it is used.
      </p>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Information We Collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account details for administrators and judges (name, email, password hash, school/organization).</li>
          <li>Contestant records entered by administrators (name, number, category, photo if uploaded).</li>
          <li>Scores, rubric entries, and comments submitted by judges during live events.</li>
          <li>Basic device and usage data (IP address, browser type) for security and troubleshooting.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">How We Use It</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>To calculate and display live rankings, leaderboards, and final results.</li>
          <li>To let administrators monitor judge activity and scoring progress in real time.</li>
          <li>To power AI-assisted design suggestions used in generating score sheets and layouts.</li>
          <li>To send account notifications, password resets, and event updates.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Data Storage & Security</h4>
        <p>
          Scores and account data are stored in an encrypted database and are only accessible to
          the school/organization that created the event. Judge scores are locked once submitted
          and cannot be altered without administrator override, which is logged.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Your Rights</h4>
        <p>
          Administrators may request export or deletion of their organization's data at any time
          by contacting support. Judges and contestants may request correction of their personal
          details through their event administrator.
        </p>
      </div>

      <p className="text-xs text-[#6C7A71] pt-2 border-t border-[#E1E8DE]">
        Questions about this policy can be sent to our support team via the Contact Us form.
      </p>
    </ModalShell>
  );
}