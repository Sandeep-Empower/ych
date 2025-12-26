import { Suspense } from 'react';
import Step3Client from '@/app/create/step-3/client';

export default function Step3Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Step3Client />
    </Suspense>
  );
}
