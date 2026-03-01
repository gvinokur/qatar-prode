import { redirect, notFound } from 'next/navigation';
import { getShortUrlByCode, incrementClickCount } from '@/app/db/short-url-repository';

type Props = {
  readonly params: Promise<{ locale: string; code: string }>;
};

export default async function ShortUrlRedirect(props: Props) {
  const params = await props.params;
  const { locale, code } = params;

  // Look up short URL
  const shortUrl = await getShortUrlByCode(code);

  if (!shortUrl) {
    notFound(); // Returns 404
  }

  // Increment click count (fire-and-forget to avoid blocking redirect)
  // NOTE: This may miss some clicks if request is cancelled/terminated early, but it's acceptable trade-off for redirect speed
  incrementClickCount(code).catch(console.error);

  // Build redirect URL with locale preservation
  let redirectPath: string;
  if (shortUrl.tournament_id) {
    // Tournament-scoped join
    redirectPath = `/${locale}/tournaments/${shortUrl.tournament_id}/friend-groups/join/${shortUrl.group_id}`;
  } else {
    // Global join (tournament was deleted or not set)
    redirectPath = `/${locale}/friend-groups/join/${shortUrl.group_id}`;
  }

  redirect(redirectPath);
}
