import React from 'react';
import { useLanguageContext } from '@/src/context';
import { LegalDocumentView } from '../components/LegalDocumentView';
import { privacyContent } from '../legalContent';

export function PrivacyPolicyScreen() {
  const { language } = useLanguageContext();
  return <LegalDocumentView doc={privacyContent[language]} />;
}
