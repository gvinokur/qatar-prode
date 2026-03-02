import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getShortUrlByCode, incrementClickCount } from '@/app/db/short-url-repository';
import { defaultLocale, type Locale } from '@/i18n.config';

type Props = {
  readonly params: Promise<{ code: string }>;
};

export default async function ShortUrlRedirect(props: Props) {
  const params = await props.params;
  const { code } = params;

  // Look up short URL
  const shortUrl = await getShortUrlByCode(code);

  if (!shortUrl) {
    notFound(); // Returns 404
  }

  // Increment click count (fire-and-forget to avoid blocking redirect)
  // NOTE: This may miss some clicks if request is cancelled/terminated early, but it's acceptable trade-off for redirect speed
  incrementClickCount(code).catch(console.error);

  // Detect user's locale from cookie (set by middleware)
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

  // Build redirect URL with detected locale
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
