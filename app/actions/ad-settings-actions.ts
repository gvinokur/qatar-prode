'use server';

import { getAdSettings, upsertAdSettings } from '../db/ad-settings-repository';
import { getLoggedInUser } from './user-actions';

const DEFAULT_MIN_MINUTES = 30;
const DEFAULT_MIN_PAGEVIEWS = 10;

export async function getAdSettingsAction(): Promise<{
  modalMinMinutesBetween: number;
  modalMinPageviewsBetween: number;
}> {
  try {
    const settings = await getAdSettings();
    return {
      modalMinMinutesBetween: settings?.modal_min_minutes_between ?? DEFAULT_MIN_MINUTES,
      modalMinPageviewsBetween: settings?.modal_min_pageviews_between ?? DEFAULT_MIN_PAGEVIEWS,
    };
  } catch {
    return {
      modalMinMinutesBetween: DEFAULT_MIN_MINUTES,
      modalMinPageviewsBetween: DEFAULT_MIN_PAGEVIEWS,
    };
  }
}

export async function updateAdSettingsAction(minMinutes: number, minPageviews: number): Promise<void> {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  if (minMinutes < 0 || minPageviews < 0) {
    throw new Error('Invalid values');
  }

  await upsertAdSettings({
    modal_min_minutes_between: minMinutes,
    modal_min_pageviews_between: minPageviews,
  });
}
