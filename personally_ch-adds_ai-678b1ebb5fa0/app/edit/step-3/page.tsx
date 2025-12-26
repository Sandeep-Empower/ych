import { Suspense } from 'react';
import Step3Client from './client';

export default function Step3Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Step3Client />
    </Suspense>
  );
}
