'use server'

import { redirect } from 'next/navigation';
import EmailVerifier from '../components/verification/email-verifier';

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token;

  if (!token) {
    redirect('/');
  }

  return <EmailVerifier token={token} />;
}
