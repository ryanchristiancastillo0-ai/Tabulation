
import { useNavigate } from 'react-router-dom';
import {FeedbackSection,Footer,Header,HeroSection,
  RoleCardsSection,StatsSection
} from '../../components/home/index'

function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-['Inter',sans-serif] min-h-screen selection:bg-[#10b981]/20 selection:text-[#00422b]">
      <Header navigate={navigate} />

      <main>
        <HeroSection navigate={navigate} />
        <RoleCardsSection navigate={navigate} />
        <StatsSection />
        <FeedbackSection />
      </main>

      <Footer />
    </div>
  );
}

export default Home;