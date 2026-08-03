import React from 'react';
import { useLanguageContext } from '@/src/context';
import { LegalDocumentView } from '../components/LegalDocumentView';
import { termsContent } from '../legalContent';

export function TermsOfServiceScreen() {
  const { language } = useLanguageContext();
  return <LegalDocumentView doc={termsContent[language]} />;
}
