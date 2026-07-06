'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Star, Check } from 'lucide-react';
import { PichwaiHeroBg } from '@/components/pichwai/PichwaiBackground';
import { PichwaiDivider } from '@/components/pichwai/PichwaiDivider';
import { TempleArch } from '@/components/ui/TempleArch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fadeInUp, fadeInScale, staggerContainer } from '@/lib/animations';

// ─── Utility: section-level entry animation wrapper ───────────────────────────

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-start text-center px-4 pt-12 pb-24">
      <PichwaiHeroBg />

      <TempleArch className="relative z-10 w-full mt-0">
        {/* Tag line */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[var(--pichwai-gold-deep)] px-4 py-1.5 rounded-full border border-[rgba(201,147,58,0.35)] bg-[rgba(201,147,58,0.06)]">
            ✦ Made for India ✦
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="font-display text-display font-bold text-white leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Celebrate Every Moment,{' '}
          <span className="gold-text-spec drop-shadow-md">Beautifully.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="text-subhead text-[rgba(255,255,255,0.8)] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Plan weddings, pujas, birthdays and corporate gatherings with AI-powered assistance.
          Connect with 10,000+ verified vendors across India.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="pichwai" size="lg" asChild>
            <Link href="/register">
              Start Free <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/vendors">Browse Vendors</Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.75 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-small text-[rgba(255,255,255,0.9)]"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />)}
            <span className="font-semibold ml-1">4.9/5</span>
            <span className="text-[rgba(255,255,255,0.6)]">from 2,400+ reviews</span>
          </div>
          <span className="hidden sm:block opacity-30">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">50,000+</span>
            <span className="text-[rgba(255,255,255,0.6)]">events planned</span>
          </div>
        </motion.div>
      </TempleArch>
    </section>
  );
}

// ─── 2. Event Types Grid ──────────────────────────────────────────────────────

const EVENT_CARDS = [
  { image: '/images/events/wedding.png', label: 'Wedding',       desc: 'The grandest celebration of love',   color: '#FCE4EC', border: '#F48FB1', text: '#880E4F' },
  { image: '/images/events/kiddie_party.png', label: 'Birthday',      desc: 'Make every year unforgettable',      color: '#FFF3E0', border: '#FFCC80', text: '#E65100' },
  { image: '/images/events/kitty_party.png', label: 'Kitty Party',  desc: 'Socialize, connect, and celebrate sisterhood',color: '#E8F5E9', border: '#A5D6A7', text: '#1B5E20' },
  { image: '/images/events/farewell.png', label: 'Farewell',      desc: 'A warm send-off to new beginnings',  color: '#E8EAF6', border: '#9FA8DA', text: '#1A237E' },
  { image: '/images/events/family_meetup.png', label: 'Family Meetup', desc: 'Reunite, reconnect, rejoice',          color: '#FFF8E7', border: '#FFD54F', text: '#5D4037' },
  { image: '/images/events/anniversary.png', label: 'Anniversary',   desc: 'Honour a love that grows every year', color: '#FCE4EC', border: '#EF9A9A', text: '#B71C1C' },
];

function EventCard({ card, index }: { card: typeof EVENT_CARDS[number], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInView = useInView(cardRef, { once: false, margin: '-100px' });

  const isLeftColumn = index % 2 === 0;

  const cardVariants = {
    hidden: { opacity: 0, x: isLeftColumn ? -80 : 80 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={cardInView ? 'visible' : 'hidden'}
      className="flex flex-col rounded-3xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 p-4 md:p-6 bg-gradient-to-br from-[#C9933A] to-[#9B6A1A]"
      style={{ borderColor: '#8B6508' }}
    >
      <div className="relative w-full aspect-[16/10] border-[3px] border-[#C9933A] rounded-xl overflow-hidden shrink-0">
        <Image
          src={card.image}
          alt={card.label}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="pt-6 md:pt-8 flex flex-col flex-1">
        <h3 className="font-display text-2xl md:text-3xl font-bold mb-2" style={{ color: '#3b001a' }}>
          {card.label}
        </h3>
        <p className="text-sm md:text-base text-[#5C0A38]/80 leading-relaxed flex-1 font-medium">
          {card.desc}
        </p>
        <Link href="/register" className="mt-6 flex items-center gap-2 cursor-pointer group w-fit text-[#5C0A38]">
          <span className="font-semibold uppercase tracking-widest text-xs">Explore</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </Link>
      </div>
    </motion.div>
  );
}

function EventTypesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });

  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full max-w-3xl mx-auto mb-16 aspect-[940/480] flex flex-col items-center justify-center pt-16 pb-2 px-6" ref={ref}>
          <svg
            className="absolute bottom-0 left-0 w-full h-full text-[#2a0810] drop-shadow-2xl"
            viewBox="30 20 940 480"
            preserveAspectRatio="xMidYMax meet"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 100 500 L 100.0 500.0 Q 37.1 418.4 124.1 363.2 Q 93.0 265.0 193.6 242.9 Q 197.9 140.0 300.0 153.6 Q 339.3 58.3 430.5 106.1 Q 500.0 30.0 569.5 106.1 Q 660.7 58.3 700.0 153.6 Q 802.1 140.0 806.4 242.9 Q 907.0 265.0 875.9 363.2 Q 962.9 418.4 900.0 500.0 Z" />
          </svg>
          
          <div className="relative z-10 text-center flex flex-col items-center w-full max-w-2xl mx-auto">
            <motion.div
              initial="hidden" animate={inView ? 'visible' : 'hidden'}
              variants={fadeInUp}
              className="mb-4"
            >
              <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)]">
                ✦ Every Occasion ✦
              </span>
            </motion.div>
            <motion.h2
              initial="hidden" animate={inView ? 'visible' : 'hidden'}
              variants={fadeInUp}
              className="font-display text-title md:text-hero font-bold text-center text-white mb-3"
            >
              What are you celebrating?
            </motion.h2>
            <motion.p
              initial="hidden" animate={inView ? 'visible' : 'hidden'}
              variants={fadeInUp}
              className="text-center text-[rgba(255,255,255,0.85)] max-w-[420px] leading-relaxed md:text-lg"
            >
              From intimate pujas to grand weddings — we have a template, vendors, and tools for every event type.
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {EVENT_CARDS.map((card, idx) => (
            <EventCard key={card.label} card={card} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. How It Works ─────────────────────────────────────────────────────────

const STEPS = [
  { n: '01', title: 'Create Your Event', desc: 'Pick your event type, set the date, and let our AI generate a personalised checklist and budget plan in seconds.' },
  { n: '02', title: 'Discover Vendors',  desc: 'Browse 10,000+ verified caterers, photographers, decorators and more — filtered by city, budget, and rating.' },
  { n: '03', title: 'Celebrate Stress-Free', desc: 'Manage guests, track RSVPs, send digital invites, and keep your whole team on the same page — all in one app.' },
] as const;

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });

  // Generate petals for the giant FULL flower
  const numPetals = 24;
  const petals = Array.from({ length: numPetals }).map((_, i) => {
    return (360 / numPetals) * i;
  });

  return (
    <section className="relative py-32 px-4 overflow-hidden mt-12 mb-12 flex items-center justify-center">
      {/* Giant Monochrome FULL Flower Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] min-w-[1000px] max-w-[1600px] pointer-events-none z-0 flex items-center justify-center">
        <svg
          viewBox="0 0 1200 1200"
          className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="origin-[600px_600px]">
            {petals.map((angle) => (
              <path
                key={angle}
                d="M 550 170 Q 550 50, 600 0 Q 650 50, 650 170 Z"
                fill="#2a0810"
                transform={`rotate(${angle} 600 600)`}
              />
            ))}
            {/* Central Circle */}
            <circle cx="600" cy="600" r="450" fill="#2a0810" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] block mb-3 opacity-90">
            ✦ How It Works ✦
          </span>
          <h2 className="font-display text-title md:text-hero font-bold text-white">
            Three steps to your perfect event
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-16 items-start px-4 md:px-12 pb-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={fadeInUp}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full border border-[rgba(201,147,58,0.5)] bg-[rgba(201,147,58,0.1)] shadow-[0_4px_10px_rgba(0,0,0,0.1)] flex items-center justify-center mx-auto mb-6">
                <span className="font-cinzel text-sm font-bold text-[var(--pichwai-gold)]">{step.n}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-base text-[rgba(255,255,255,0.85)] leading-relaxed font-medium">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 4. Vendor Showcase ───────────────────────────────────────────────────────

const FEATURED_VENDORS = [
  { name: 'Shree Ram Caterers',   cat: 'Catering',      city: 'Jaipur',   rating: 4.9, price: '₹850/plate', emoji: '🍱' },
  { name: 'Lens & Light Studio',  cat: 'Photography',   city: 'Mumbai',   rating: 4.8, price: 'from ₹25,000', emoji: '📸' },
  { name: 'Floral Raaga',         cat: 'Decoration',    city: 'Delhi',    rating: 4.9, price: 'from ₹15,000', emoji: '🌸' },
  { name: 'Royal Wedding Band',   cat: 'Entertainment', city: 'Udaipur',  rating: 4.7, price: 'from ₹18,000', emoji: '🎺' },
  { name: 'Mehndi Magic',         cat: 'Mehendi',       city: 'Pune',     rating: 5.0, price: 'from ₹5,000',  emoji: '🖐️' },
  { name: 'Golden Palace',        cat: 'Venue',         city: 'Bangalore',rating: 4.8, price: 'from ₹1 Lakh', emoji: '🏛️' },
  { name: 'Symphony DJ',          cat: 'Music',         city: 'Goa',      rating: 4.9, price: 'from ₹30,000', emoji: '🎧' },
  { name: 'Bridal Glow',          cat: 'Makeup',        city: 'Chennai',  rating: 4.8, price: 'from ₹12,000', emoji: '💄' },
  { name: 'Classic Planners',     cat: 'Planner',       city: 'Hyderabad',rating: 4.7, price: 'from ₹50,000', emoji: '📋' },
] as const;

function VendorShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });

  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 bg-[rgba(42,8,16,0.95)] backdrop-blur-md rounded-3xl p-6 sm:px-8 border border-[rgba(201,147,58,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          <div>
            <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] block mb-2">
              ✦ Top Vendors ✦
            </span>
            <h2 className="font-display text-title font-bold text-white">
              Trusted by thousands of hosts
            </h2>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 border-[var(--pichwai-gold)] text-[var(--pichwai-gold)] hover:bg-[rgba(201,147,58,0.1)]">
            <Link href="/vendors">View all vendors <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </motion.div>

        {/* Infinite Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex overflow-hidden w-full group pb-4 -mx-4 px-4"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}
        >
          <div className="flex w-max gap-5 animate-marquee">
            {[...FEATURED_VENDORS, ...FEATURED_VENDORS].map((v, i) => (
              <div
                key={v.name + i}
                className="shrink-0 w-64 rounded-3xl bg-[rgba(42,8,16,0.95)] backdrop-blur-md border border-[rgba(201,147,58,0.3)] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:border-[var(--pichwai-gold)] cursor-pointer"
              >
                <div className="text-3xl mb-3">{v.emoji}</div>
                <h3 className="font-display text-sm font-semibold text-white mb-0.5 truncate">
                  {v.name}
                </h3>
                <p className="text-caption text-[rgba(255,255,255,0.7)] mb-3">{v.cat} · {v.city}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />
                    <span className="text-xs font-semibold text-[rgba(255,255,255,0.9)]">{v.rating}</span>
                  </div>
                  <span className="text-xs font-medium text-[var(--pichwai-gold)]">{v.price}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 5. Testimonials ─────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi', event: 'Wedding', text: 'Milap made our dream wedding come true. The vendor search saved us weeks of calls!', avatar: 'PS' },
  { name: 'Rohit Mehta',  city: 'Mumbai', event: 'Corporate', text: 'Our annual conference was flawless. The guest management tools are incredible.', avatar: 'RM' },
  { name: 'Anita Patel',  city: 'Ahmedabad', event: 'Birthday', text: 'My daughter\'s princess party was magical. Found the perfect decorator in 10 minutes!', avatar: 'AP' },
] as const;

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <div className="inline-block px-8 py-4 rounded-xl bg-black/20 backdrop-blur-md border border-[rgba(201,147,58,0.2)]">
            <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] block mb-3 opacity-90 drop-shadow-md">
              ✦ What Families Say ✦
            </span>
            <h2 className="font-display text-title md:text-hero font-bold text-white drop-shadow-md">
              Loved across India
            </h2>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeInScale}
              className="rounded-3xl bg-[rgba(42,8,16,0.95)] backdrop-blur-md border border-[rgba(201,147,58,0.3)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[var(--pichwai-gold)] transition-colors cursor-default"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />
                ))}
              </div>
              <p className="text-base text-[rgba(255,255,255,0.85)] leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(201,147,58,0.15)] border border-[rgba(201,147,58,0.3)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[var(--pichwai-gold)]">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)] mt-0.5">{t.event} · {t.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── 6. Pricing ──────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['1 active event', '50 guests', 'Basic vendor search', 'Digital invites'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '₹499',
    period: 'per event',
    features: ['5 active events', '500 guests', 'Priority vendor search', 'AI checklist', 'QR check-in', 'Budget tracker'],
    cta: 'Start Basic',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '₹1,999',
    period: 'per event',
    features: ['Unlimited events', 'Unlimited guests', 'AI planning assistant', 'Custom invite pages', 'Memories album', 'Dedicated support'],
    cta: 'Go Premium',
    highlight: false,
  },
] as const;

function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-transparent overflow-hidden">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block px-8 py-4 rounded-xl bg-black/20 backdrop-blur-md border border-[rgba(201,147,58,0.2)]">
            <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] block mb-3 opacity-90 drop-shadow-md">
              ✦ Simple Pricing ✦
            </span>
            <h2 className="font-display text-title md:text-hero font-bold text-white drop-shadow-md">
              Plans for every celebration
            </h2>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6 items-stretch"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInScale}
              className={`rounded-3xl p-8 flex flex-col border transition-all ${
                plan.highlight
                  ? 'bg-[rgba(201,147,58,0.15)] backdrop-blur-lg border-2 border-[var(--pichwai-gold)] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transform md:-translate-y-4 relative z-10'
                  : 'bg-[rgba(42,8,16,0.95)] backdrop-blur-md border border-[rgba(201,147,58,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--pichwai-gold)] text-[#2a0810] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="mb-1 mt-2">
                <span className="font-cinzel text-xl uppercase tracking-widest text-white">{plan.name}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1 mt-4">
                <span className="font-display text-5xl font-bold text-[var(--pichwai-gold)]">
                  {plan.price}
                </span>
              </div>
              <p className="text-sm mb-6 text-[rgba(255,255,255,0.7)]">
                {plan.period}
              </p>
              <ul className="space-y-4 flex-1 mb-8 mt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-[var(--pichwai-gold)]" />
                    <span className="text-[rgba(255,255,255,0.9)] text-base">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'pichwai' : 'outline'}
                className={`w-full ${plan.highlight ? 'bg-[var(--pichwai-gold)] text-[#2a0810] hover:bg-white border-none font-bold' : 'border-[var(--pichwai-gold)] text-[var(--pichwai-gold)] hover:bg-[rgba(201,147,58,0.1)]'}`}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page assembly ────────────────────────────────────────────────────────────

export default function PublicPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <EventTypesSection />
      <HowItWorksSection />
      <VendorShowcase />
      <TestimonialsSection />
      <PricingSection />
    </div>
  );
}
