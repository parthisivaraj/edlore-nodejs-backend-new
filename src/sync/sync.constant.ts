export const SYNC_TABLE_ORDERS = [
  'categories',
  'models',
  'sections',
  'devices',
  'procedures',
  'written_issues',
  'safety_measures',
  'sketches',
  'error_codes',
  'anaglyphs',
  'troubleshoots',
  'parts',
  'error_code_linkings',
  'error_code_machine_types',
  'troubleshoot_steps',
  'steps',
  'notes',
  'asset_notes',
  'active_storage_blobs',
  'active_storage_attachments',
  'attached_media',
];

export const GetSyncAPI = (ipAddress: string, last_sync_at: string) =>
  `http://${ipAddress}:5100/api/v1/sync/pull?lastSyncAt=${last_sync_at}`;

export const PostSyncAPI = (ipAddress: string) =>
  `http://${ipAddress}:5100/api/v1/sync/push`;

export const GetHealthAPI = (ipAddress: string) =>
  `http://${ipAddress}:5100/api/v1/health`;
