import { RegisterPageClient } from '@/components/auth/RegisterPageClient';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params?.role === 'freelancer' ? 'freelancer' : 'user';
  return <RegisterPageClient initialRole={initialRole} />;
}
