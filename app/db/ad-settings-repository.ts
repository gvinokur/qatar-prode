import { db } from "./database";
import { AdSettings, AdSettingsUpdate } from "./tables-definition";

export async function getAdSettings(): Promise<AdSettings | undefined> {
  return db
    .selectFrom('ad_settings')
    .selectAll()
    .executeTakeFirst();
}

export async function upsertAdSettings(update: AdSettingsUpdate): Promise<AdSettings> {
  const existing = await getAdSettings();

  if (existing) {
    return db
      .updateTable('ad_settings')
      .set(update)
      .where('id', '=', existing.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  return db
    .insertInto('ad_settings')
    .values({
      modal_min_minutes_between: update.modal_min_minutes_between ?? 30,
      modal_min_pageviews_between: update.modal_min_pageviews_between ?? 10,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}
