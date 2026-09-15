import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './styles/tokens.css';
import './styles/base.css';

export const metadata: Metadata = {
  title: 'Portal 3ADS EDU',
  description: 'Gestão e acompanhamento dos projetos educacionais da 3ADS.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
