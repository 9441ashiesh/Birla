import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Omyra × Birla Open Minds · Admissions Proposal',
  description: 'Research, creative concepts and a proposed admissions growth partnership for Birla Open Minds Bibinagar.',
  icons: { icon: '/assets/logo.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
