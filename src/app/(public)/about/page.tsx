'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Heart, Shield, Sparkles } from 'lucide-react';
import { PichwaiHeroBg } from '@/components/pichwai/PichwaiBackground';
import { Button } from '@/components/ui/button';
import { fadeInUp, fadeInScale, staggerContainer } from '@/lib/animations';
import { TempleArch } from '@/components/ui/TempleArch';

const VALUES = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Rooted in Tradition",
    description: "We understand that Indian events aren't just parties; they are deep cultural ceremonies. We respect and cater to the nuances of every ritual."
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Powered by Tech",
    description: "Our AI assistant eliminates the chaos of planning by instantly generating timelines, budgets, and checklists tailored to your specific event type."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Built on Trust",
    description: "With over 10,000 verified vendors, we ensure that every caterer, decorator, and photographer meets the highest standards of quality."
  }
];

export default function AboutPage() {
  const refValues = useRef<HTMLDivElement>(null);
  const inViewValues = useInView(refValues, { once: true, margin: '-60px' });

  return (
    <div className="flex flex-col w-full bg-[var(--pichwai-cream)] min-h-screen">
      
      {/* ─── Hero & Mission Section ─── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-start text-center px-4 pt-12 pb-24">
        <PichwaiHeroBg />
        
        <TempleArch variant="tall-closed" className="relative z-10 w-full mt-0 drop-shadow-xl">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mb-4"
          >
            <span className="font-cinzel text-xs uppercase tracking-[0.3em] text-[var(--pichwai-gold-deep)] px-4 py-1.5 rounded-full border border-[rgba(201,147,58,0.35)] bg-[rgba(201,147,58,0.06)] backdrop-blur-sm">
              ✦ Our Story ✦
            </span>
          </motion.div>
          
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl font-bold text-white leading-[1.1] mb-6 drop-shadow-md"
          >
            Blending <span className="gold-text-spec">Tradition</span> with <br className="hidden md:block" /> Modern Planning.
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-[rgba(255,255,255,0.8)] max-w-2xl mx-auto leading-relaxed mb-16"
          >
            We are on a mission to bring families together and make celebrating every milestone beautifully stress-free.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="w-full max-w-3xl mx-auto px-4 mt-8"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">
              Why Milap?
            </h2>
            <div className="space-y-6 text-base md:text-lg text-[rgba(255,255,255,0.85)] leading-relaxed mx-auto text-center">
              <p>
                In India, an event is never just a gathering; it is a profound celebration of life, family, and tradition. However, the joy of these occasions is often overshadowed by the immense stress of coordinating vendors, managing guest lists, and tracking infinite details.
              </p>
              <p>
                We built Milap to change that. By combining the rich aesthetics of Indian heritage with the incredible power of artificial intelligence, we have created a platform that handles the logistics so you can focus on making memories.
              </p>
            </div>
          </motion.div>
        </TempleArch>
      </section>

      {/* ─── Values Grid ─── */}
      <section className="py-20 px-4 bg-[#FFFDF5]">
        <div className="max-w-6xl mx-auto" ref={refValues}>
          <motion.div
            initial="hidden" animate={inViewValues ? 'visible' : 'hidden'}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <div className="inline-block px-8 py-4 rounded-xl bg-black/20 backdrop-blur-md border border-[rgba(201,147,58,0.2)]">
              <span className="font-cinzel text-xs uppercase tracking-widest text-[var(--pichwai-gold-deep)] block mb-3 drop-shadow-md">
                ✦ What Drives Us ✦
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--pichwai-dark-brown)] drop-shadow-md">
                Our Core Values
              </h2>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={inViewValues ? 'visible' : 'hidden'}
            className="grid md:grid-cols-3 gap-8"
          >
            {VALUES.map((val, i) => (
              <motion.div
                key={i}
                variants={fadeInScale}
                className="bg-[var(--card-bg)] rounded-[var(--radius-lg)] p-8 border border-[var(--border-gold)] shadow-[var(--shadow-card)] text-center flex flex-col items-center transition-transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-full bg-[rgba(201,147,58,0.1)] flex items-center justify-center text-[var(--pichwai-gold-deep)] mb-6 border border-[rgba(201,147,58,0.3)]">
                  {val.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-[#B8860B] mb-4">
                  {val.title}
                </h3>
                <p className="text-[#5C3A1E] font-medium leading-relaxed">
                  {val.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-4 bg-[var(--pichwai-cream)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-block px-10 py-8 rounded-xl bg-black/20 backdrop-blur-md border border-[rgba(201,147,58,0.2)] mb-10">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--pichwai-dark-brown)] mb-4 drop-shadow-md">
              Become part of our story.
            </h2>
            <p className="text-lg text-[var(--pichwai-mid-brown)] drop-shadow-md">
              Start planning your next grand celebration with Milap today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Button variant="pichwai" size="xl" asChild>
              <Link href="/register">
                Get Started <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="bg-black/20 backdrop-blur-md hover:bg-black/30" asChild>
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
