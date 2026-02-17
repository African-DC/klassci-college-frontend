import { redirect } from 'next/navigation';

// Page racine — redirige vers le login
export default function Home() {
  redirect('/login');
}
