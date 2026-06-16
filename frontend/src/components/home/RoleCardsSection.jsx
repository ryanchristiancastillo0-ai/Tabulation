import {RoleCard} from './index'
export default function RoleCardsSection({ navigate }) {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-[#f7f9fb]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-4 tracking-tight">
            Specialized Evaluation Portals
          </h2>
          <p className="text-sm sm:text-base text-[#3c4a42]">
            Purpose-built interfaces for the keystones of your organization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RoleCard
            type="admin"
            icon="🔐"
            title="System Coordinator"
            desc="Oversee the entire evaluation lifecycle. Design custom rubrics, manage judge assignments, and monitor real-time scoring progress and data aggregation."
            features={['Manage scoring criteria', 'Register contestants', 'View tabulated results']}
            ctaLabel="Access Dashboard"
            ctaVariant="filled"
            onClick={() => navigate('/login')}
          />
          <RoleCard
            type="judge"
            icon="⚖️"
            title="Expert Evaluator"
            desc="Deliver high-quality assessments within a distraction-free environment. Utilize advanced tools for consistent scoring and detailed qualitative feedback."
            features={['Real-time scoring', 'Criterion evaluation', 'Live score submission']}
            ctaLabel="Start Judging"
            ctaVariant="outline"
            onClick={() => navigate('/judge')}
          />
        </div>
      </div>
    </section>
  );
}
