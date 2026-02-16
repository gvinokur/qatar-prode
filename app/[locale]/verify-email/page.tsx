'use server'

import { redirect } from 'next/navigation';
import EmailVerifier from '../../components/verification/email-verifier';
import { getLocale } from 'next-intl/server';

export default async function VerifyEmailPage({
  searchParams
}: {
  readonly searchParams: Promise<{ token?: string }>
}) {
  const locale = await getLocale();
  const token = (await searchParams).token;

  if (!token) {
    redirect(`/${locale}`);
  }

  return <EmailVerifier token={token} />;
}
