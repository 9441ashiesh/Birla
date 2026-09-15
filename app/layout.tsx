import type { Metadata } from 'next';
import './globals.css';
import './revision.css';

export const metadata: Metadata = {
  title: 'Omyra × Birla Open Minds · Admissions Proposal',
  description: 'A concise 34-slide proposal: research, strategy and execution for Birla Open Minds Bibinagar, proposed by Omyra Technologies.',
  icons: { icon: '/assets/logo.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
