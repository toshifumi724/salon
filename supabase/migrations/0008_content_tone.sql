-- コンテンツ生成の品質改善: サロンごとのトーン設定 + 文体参考サンプル

alter table salons add column if not exists tone_level text not null default 'friendly'
  check (tone_level in ('polite', 'friendly', 'casual'));
alter table salons add column if not exists target_customer text;
alter table salons add column if not exists brand_keywords text;
alter table salons add column if not exists use_emoji boolean not null default false;
alter table salons add column if not exists style_sample text;
