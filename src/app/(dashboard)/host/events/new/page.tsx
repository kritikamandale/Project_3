import type { Metadata } from 'next';
import EventWizard from '@/components/events/EventWizard';

export const metadata: Metadata = {
  title: 'Create New Event — Milap',
  description: "Plan your perfect event with Milap's step-by-step wizard",
};

export default function NewEventPage() {
  return <EventWizard />;
}
