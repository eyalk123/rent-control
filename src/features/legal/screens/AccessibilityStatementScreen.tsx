import React from 'react';
import { useLanguageContext } from '@/src/context';
import { LegalDocumentView } from '../components/LegalDocumentView';
import { accessibilityContent } from '../legalContent';

export function AccessibilityStatementScreen() {
  const { language } = useLanguageContext();
  return <LegalDocumentView doc={accessibilityContent[language]} />;
}
