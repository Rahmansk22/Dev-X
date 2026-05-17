'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <Button
      onClick={() => window.history.back()}
      variant="outline"
      className="w-full sm:w-auto gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold px-6 py-2 h-11"
    >
      <ArrowLeft className="w-5 h-5" />
      Go Back
    </Button>
  );
}
