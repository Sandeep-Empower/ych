// Redirect to /step-1
import { redirect } from 'next/navigation';

export default function CreatePage() {
  // Redirect to the first step of the creation process
  redirect('/create/step-1');
}