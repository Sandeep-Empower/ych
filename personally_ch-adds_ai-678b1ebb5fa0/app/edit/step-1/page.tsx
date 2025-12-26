import { Suspense } from "react";
import Step1 from '@/app/edit/step-1/client';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Step1 />
    </Suspense>
  );
}