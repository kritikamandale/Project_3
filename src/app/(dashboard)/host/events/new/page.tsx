import type { Metadata } from 'next';
import EventWizard from '@/components/events/EventWizard';

export const metadata: Metadata = {
  title: 'Create New Event — EventNest',
  description: "Plan your perfect event with EventNest's step-by-step wizard",
};

export default function NewEventPage() {
  return <EventWizard />;
}
