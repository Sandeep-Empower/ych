import { Suspense } from 'react';
import SuccessClient from '@/app/create/success/client';

export default function Step2Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessClient />
    </Suspense>
  );
}
