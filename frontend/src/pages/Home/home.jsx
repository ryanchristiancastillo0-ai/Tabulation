import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FeedbackSection,
  Footer,
  Header,
  HeroSection,
  RoleCardsSection,
  StatsSection
} from '../../components/home/index';

// Smoothly interpolates the scroll position for a buttery, eased parallax feel
function useSmoothScroll() {
  const [scrollY, setScrollY] = useState(0);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const onScroll = () => {
      targetRef.current = window.scrollY;
    };

    const tick = () => {
      const ease = prefersReducedMotion ? 1 : 0.08;
      currentRef.current += (targetRef.current - currentRef.current) * ease;

      if (Math.abs(targetRef.current - currentRef.current) < 0.05) {
        currentRef.current = targetRef.current;
      }

      setScrollY(currentRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return scrollY;
}

// Fades + slides a section into view the first time it enters the viewport
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

function Home() {
  const navigate = useNavigate();
  const scrollY = useSmoothScroll();

  const [roleRef, roleVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [feedbackRef, feedbackVisible] = useScrollReveal();

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] font-['Inter',sans-serif] min-h-screen selection:bg-[#10b981]/20 selection:text-[#00422b] overflow-x-hidden">
      <Header navigate={navigate} />

      <main>
        {/* Hero section — background stays fixed, only text content shifts */}
        <HeroSection navigate={navigate} parallaxOffset={scrollY * 0.15} />

        {/* Role cards - fades and slides up into view */}
        <div
          ref={roleRef}
          className={`transition-all duration-700 ease-out will-change-transform ${
            roleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-16'
          }`}
        >
          <RoleCardsSection navigate={navigate} />
        </div>

        {/* Stats - fades and slides up into view */}
        <div
          ref={statsRef}
          className={`transition-all duration-700 ease-out will-change-transform ${
            statsVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-16'
          }`}
        >
          <StatsSection />
        </div>

        {/* Feedback - fades and slides up into view */}
        <div
          ref={feedbackRef}
          className={`transition-all duration-700 ease-out will-change-transform ${
            feedbackVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-16'
          }`}
        >
          <FeedbackSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;