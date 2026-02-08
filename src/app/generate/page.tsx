// src/app/generate/page.tsx

'use client';

import { ReadmeWizard } from '@/components/wizard/ReadmeWizard';
import { Header } from '@/components/layout/Header';

export default function GeneratePage() {
  return (
    <>
      <Header />
      <ReadmeWizard />
    </>
  );
}