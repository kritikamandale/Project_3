'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Star, Check } from 'lucide-react';
import { PichwaiHeroBg } from '@/components/pichwai/PichwaiBackground';
import { PichwaiDivider } from '@/components/pichwai/PichwaiDivider';
import { LotusLoader } from '@/components/pichwai/LotusLoader';
import { PeacockMotif } from '@/components/pichwai/PeacockMotif';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fadeInUp, fadeInScale, staggerContainer } from '@/lib/animations';

// ─── Utility: section-level entry animation wrapper ───────────────────────────

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
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
    <section className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-center text-center px-4 py-24">
      <PichwaiHeroBg />

      {/* Peacock motif — decorative, right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 hidden xl:block pointer-events-none">
        <PeacockMotif size={280} />
      </div>
      <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 hidden xl:block pointer-events-none scale-x-[-1]">
        <PeacockMotif size={280} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Lotus loader on top */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <LotusLoader size={72} />
        </motion.div>

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
          className="font-display text-display font-bold text-[var(--pichwai-dark-brown)] leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Celebrate Every Moment,{' '}
          <span className="gold-text-spec">Beautifully.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="text-subhead text-[var(--pichwai-mid-brown)] max-w-2xl mx-auto mb-10 leading-relaxed"
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
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-small text-[var(--pichwai-mid-brown)]"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />)}
            <span className="font-semibold ml-1">4.9/5</span>
            <span className="text-[var(--muted-fg)]">from 2,400+ reviews</span>
          </div>
          <span className="hidden sm:block text-[var(--border)]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">50,000+</span>
            <span className="text-[var(--muted-fg)]">events planned</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── 2. Event Types Grid ──────────────────────────────────────────────────────

const EVENT_CARDS = [
  { emoji: '💍', label: 'Wedding',       desc: 'The grandest celebration of love',   color: '#FCE4EC', border: '#F48FB1', text: '#880E4F' },
  { emoji: '🎂', label: 'Birthday',      desc: 'Make every year unforgettable',      color: '#FFF3E0', border: '#FFCC80', text: '#E65100' },
  { emoji: '🎈', label: 'Kiddie Party',  desc: 'Joy-filled memories for little ones',color: '#E8F5E9', border: '#A5D6A7', text: '#1B5E20' },
  { emoji: '🎓', label: 'Farewell',      desc: 'A warm send-off to new beginnings',  color: '#E8EAF6', border: '#9FA8DA', text: '#1A237E' },
  { emoji: '👨‍👩‍👧‍👦', label: 'Family Meetup', desc: 'Reunite, reconnect, rejoice',          color: '#FFF8E7', border: '#FFD54F', text: '#5D4037' },
  { emoji: '❤️', label: 'Anniversary',   desc: 'Honour a love that grows every year', color: '#FCE4EC', border: '#EF9A9A', text: '#B71C1C' },
] as const;

function EventTypesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-[var(--pichwai-cream)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-4"
          ref={ref}
        >
          <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)]">
            ✦ Every Occasion ✦
          </span>
        </motion.div>
        <motion.h2
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="font-display text-title md:text-hero font-bold text-center text-[var(--pichwai-dark-brown)] mb-3"
        >
          What are you celebrating?
        </motion.h2>
        <motion.p
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center text-[var(--muted-fg)] max-w-xl mx-auto mb-12"
        >
          From intimate pujas to grand weddings — we have a template, vendors, and tools for every event type.
        </motion.p>

        <PichwaiDivider variant="gold" size="md" className="mb-14" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-5"
        >
          {EVENT_CARDS.map((card) => (
            <motion.div
              key={card.label}
              variants={fadeInScale}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="rounded-[var(--radius-md)] p-6 cursor-pointer border transition-all duration-200 hover:shadow-[var(--shadow-pichwai)]"
              style={{
                background: card.color,
                borderColor: card.border,
              }}
            >
              <div className="text-4xl mb-3">{card.emoji}</div>
              <h3 className="font-display text-base font-semibold mb-1" style={{ color: card.text }}>
                {card.label}
              </h3>
              <p className="text-caption text-[var(--muted-fg)]">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
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
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-[#FFFDF5]">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)] block mb-3">
            ✦ How It Works ✦
          </span>
          <h2 className="font-display text-title md:text-hero font-bold text-[var(--pichwai-dark-brown)]">
            Three steps to your perfect event
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {STEPS.map((step, i) => (
            <div key={step.n}>
              <motion.div
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={fadeInUp}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full border-2 border-[var(--pichwai-gold)] bg-[rgba(201,147,58,0.08)] flex items-center justify-center mx-auto mb-5">
                  <span className="font-cinzel text-sm font-bold text-[var(--pichwai-gold-deep)]">{step.n}</span>
                </div>
                <h3 className="font-display text-subhead font-semibold text-[var(--pichwai-dark-brown)] mb-3">
                  {step.title}
                </h3>
                <p className="text-small text-[var(--muted-fg)] leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex justify-center mt-6 -mb-6">
                  <PichwaiDivider variant="saffron" size="sm" className="opacity-40 rotate-90 w-16" />
                </div>
              )}
            </div>
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
] as const;

function VendorShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-[var(--pichwai-cream)] overflow-hidden">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
        >
          <div>
            <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)] block mb-2">
              ✦ Top Vendors ✦
            </span>
            <h2 className="font-display text-title font-bold text-[var(--pichwai-dark-brown)]">
              Trusted by thousands of hosts
            </h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/vendors">View all vendors <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </motion.div>

        {/* Horizontal scroll */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEATURED_VENDORS.map((v, i) => (
            <motion.div
              key={v.name}
              variants={fadeInScale}
              whileHover={{ scale: 1.02 }}
              className="snap-start shrink-0 w-64 rounded-[var(--radius-md)] bg-[var(--card-bg)] border border-[var(--border-gold)] p-5 shadow-[var(--shadow-card)]"
            >
              <div className="text-3xl mb-3">{v.emoji}</div>
              <h3 className="font-display text-sm font-semibold text-[var(--pichwai-dark-brown)] mb-0.5 truncate">
                {v.name}
              </h3>
              <p className="text-caption text-[var(--muted-fg)] mb-3">{v.cat} · {v.city}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />
                  <span className="text-xs font-semibold">{v.rating}</span>
                </div>
                <span className="text-xs font-medium text-[var(--pichwai-gold-deep)]">{v.price}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── 5. Testimonials ─────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Delhi', event: 'Wedding', text: 'EventNest made our dream wedding come true. The vendor search saved us weeks of calls!', avatar: 'PS' },
  { name: 'Rohit Mehta',  city: 'Mumbai', event: 'Corporate', text: 'Our annual conference was flawless. The guest management tools are incredible.', avatar: 'RM' },
  { name: 'Anita Patel',  city: 'Ahmedabad', event: 'Birthday', text: 'My daughter\'s princess party was magical. Found the perfect decorator in 10 minutes!', avatar: 'AP' },
] as const;

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-[#FFFDF5]">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)] block mb-3">
            ✦ What Families Say ✦
          </span>
          <h2 className="font-display text-title md:text-hero font-bold text-[var(--pichwai-dark-brown)]">
            Loved across India
          </h2>
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
              className="rounded-[var(--radius-md)] bg-[var(--card-bg)] border border-[var(--border-gold)] p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-[var(--pichwai-gold)] text-[var(--pichwai-gold)]" />
                ))}
              </div>
              <p className="text-small text-[var(--pichwai-mid-brown)] leading-relaxed mb-5 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(201,147,58,0.15)] border border-[var(--border-gold)] flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--pichwai-gold-deep)]">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-caption text-[var(--muted-fg)]">{t.event} · {t.city}</p>
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
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 px-4 bg-[var(--pichwai-cream)]">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial="hidden" animate={inView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)] block mb-3">
            ✦ Simple Pricing ✦
          </span>
          <h2 className="font-display text-title md:text-hero font-bold text-[var(--pichwai-dark-brown)]">
            Plans for every celebration
          </h2>
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
              className={`rounded-[var(--radius-lg)] p-7 flex flex-col border transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-[#1A0D00] to-[#3E2000] border-[rgba(201,147,58,0.5)] text-white shadow-[var(--shadow-pichwai)] scale-[1.03]'
                  : 'bg-[var(--card-bg)] border-[var(--border-gold)] shadow-[var(--shadow-card)]'
              }`}
            >
              {plan.highlight && (
                <div className="mb-3">
                  <Badge className="bg-[var(--pichwai-gold)] text-[var(--pichwai-dark-brown)] text-[10px] font-bold uppercase tracking-wider">
                    Most Popular
                  </Badge>
                </div>
              )}
              <div className="mb-1">
                <span className="font-cinzel text-xs uppercase tracking-widest opacity-60">{plan.name}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`font-display text-3xl font-bold ${plan.highlight ? 'gold-text-spec' : 'text-[var(--foreground)]'}`}>
                  {plan.price}
                </span>
              </div>
              <p className={`text-xs mb-6 ${plan.highlight ? 'text-[rgba(255,248,231,0.5)]' : 'text-[var(--muted-fg)]'}`}>
                {plan.period}
              </p>
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className={`h-3.5 w-3.5 shrink-0 ${plan.highlight ? 'text-[var(--pichwai-gold)]' : 'text-[var(--pichwai-leaf)]'}`} />
                    <span className={`text-xs ${plan.highlight ? 'text-[rgba(255,248,231,0.85)]' : 'text-[var(--pichwai-mid-brown)]'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'pichwai' : 'outline'}
                className="w-full"
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
