'use server'

import { redirect } from 'next/navigation';
import EmailVerifier from '../components/verification/email-verifier';

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const token = (await searchParams).token;

  if (!token) {
    redirect('/');
  }

  return <EmailVerifier token={token} />;
}
