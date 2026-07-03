'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';
import { PichwaiHeroBg } from '@/components/pichwai/PichwaiBackground';
import { PichwaiDivider } from '@/components/pichwai/PichwaiDivider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fadeInUp, fadeInScale, staggerContainer } from '@/lib/animations';

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

const FAQS = [
  {
    q: "Can I upgrade my plan later?",
    a: "Absolutely! You can start with a Free or Basic plan and upgrade to Premium anytime from your dashboard when your event scales."
  },
  {
    q: "How does the AI planning assistant work?",
    a: "Our AI assistant analyzes your event details (type, date, guest count, budget) and automatically generates a highly tailored checklist and timeline, ensuring you never miss a step."
  },
  {
    q: "Is there a limit on vendor inquiries?",
    a: "No! All plans allow you to browse and contact as many vendors as you need. However, Basic and Premium plans get priority vendor matching and direct messaging."
  },
  {
    q: "Do you offer refunds if an event is cancelled?",
    a: "Since our plans are charged per event and give you immediate access to planning tools, we generally do not offer refunds once a premium plan is activated. Please contact support for special cases."
  }
];

export default function PricingPage() {
  const refPricing = useRef<HTMLDivElement>(null);
  const inViewPricing = useInView(refPricing, { once: true, margin: '-60px' });
  
  const refFaq = useRef<HTMLDivElement>(null);
  const inViewFaq = useInView(refFaq, { once: true, margin: '-60px' });

  return (
    <div className="relative min-h-screen w-full flex flex-col p-4 md:p-8">
      {/* ─── Glassmorphism Container ─── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto rounded-[2rem] overflow-hidden bg-[rgba(255,255,255,0.04)] backdrop-blur-3xl border border-[rgba(255,255,255,0.15)] shadow-2xl flex flex-col">
        
        {/* ─── Hero Section ─── */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-8 pb-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-4"
            >
              <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[var(--pichwai-gold)] px-4 py-1.5 rounded-full border border-[rgba(201,147,58,0.4)] bg-[rgba(201,147,58,0.1)] backdrop-blur-sm">
                ✦ Pricing Plans ✦
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-md"
            >
              Simple, Transparent Pricing
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-[rgba(255,255,255,0.8)] max-w-2xl mx-auto leading-relaxed"
            >
              Whether you are hosting an intimate puja or a grand royal wedding, we have a plan tailored just for you.
            </motion.p>
          </div>
        </div>

      {/* ─── Pricing Cards ─── */}
      <div className="relative z-10 py-4 px-6">
        <div className="max-w-5xl mx-auto" ref={refPricing}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inViewPricing ? 'visible' : 'hidden'}
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
                  size="lg"
                  className={`w-full text-sm font-bold tracking-wide ${plan.highlight ? 'bg-[var(--pichwai-gold)] text-[#2a0810] hover:bg-white border-none' : 'border-[var(--pichwai-gold)] text-[var(--pichwai-gold)] hover:bg-[rgba(201,147,58,0.1)]'}`}
                  asChild
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex justify-center py-6">
        <PichwaiDivider variant="gold" size="lg" className="opacity-50" />
      </div>

      {/* ─── FAQ Section ─── */}
      <div className="relative z-10 py-8 px-6">
        <div className="max-w-4xl mx-auto" ref={refFaq}>
          <motion.div
            initial="hidden" animate={inViewFaq ? 'visible' : 'hidden'}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold)] block mb-3">
              ✦ Queries ✦
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-md">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inViewFaq ? 'visible' : 'hidden'}
            className="grid md:grid-cols-2 gap-6"
          >
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-[rgba(42,8,16,0.95)] rounded-[1.5rem] p-6 border border-[rgba(201,147,58,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <HelpCircle className="h-5 w-5 text-[var(--pichwai-gold)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white mb-3 leading-snug">
                      {faq.q}
                    </h3>
                    <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Final CTA ─── */}
      <div className="relative z-10 py-10 px-6 mb-8">
        <div className="max-w-3xl mx-auto text-center bg-[rgba(42,8,16,0.95)] p-10 rounded-[2rem] border border-[rgba(201,147,58,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-md">
            Ready to plan the perfect event?
          </h2>
          <p className="text-lg text-[rgba(255,255,255,0.8)] mb-10">
            Join thousands of hosts across India who trust EventNest.
          </p>
          <Button variant="pichwai" size="xl" className="shadow-[0_0_20px_rgba(201,147,58,0.4)] hover:shadow-[0_0_30px_rgba(201,147,58,0.6)]" asChild>
            <Link href="/register">
              Create Your Free Event <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      </div> {/* End of Glass Container */}
    </div>
  );
}
