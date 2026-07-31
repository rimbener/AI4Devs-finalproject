/** Nested `plans` embed from the profiles→plans join (snake_case). */
export type RawPlansEmbed = {
  use_platform_key: boolean;
  show_ads: boolean;
  show_key_settings: boolean;
};

/** Raw profiles→plans join row as PostgREST returns it. */
export type RawProfilePlanJoinRow = {
  plan_id: string;
  plans: RawPlansEmbed | RawPlansEmbed[] | null;
};
