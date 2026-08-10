import { validateContentModule } from '../../../../../packages/contracts/content-module.mjs';

export class CoreRepository {
  constructor(client) { this.client = client; }

  async getProjectBySlug(slug) {
    const { data, error } = await this.client
      .from('projects')
      .select('id,slug,name,status')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(`Project query failed: ${error.message}`);
    return data ?? null;
  }

  async listModules(projectId) {
    const { data, error } = await this.client
      .from('modules')
      .select('id,project_id,key,kind,status,config,sort_order')
      .eq('project_id', projectId)
      .neq('status', 'disabled')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Module query failed: ${error.message}`);

    return (data ?? []).map((row) => validateContentModule({
      id: row.id,
      projectId: row.project_id,
      key: row.key,
      kind: row.kind,
      status: row.status,
      config: row.config ?? {},
      sortOrder: row.sort_order
    }));
  }

  async createMediaAsset(input) {
    const { data, error } = await this.client
      .from('media_assets')
      .insert({
        project_id: input.projectId,
        module_id: input.moduleId ?? null,
        storage_bucket: input.bucket,
        storage_path: input.path,
        original_name: input.originalName,
        mime_type: input.mimeType,
        byte_size: input.byteSize ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        metadata: input.metadata ?? {}
      })
      .select('id,project_id,module_id,storage_bucket,storage_path,original_name,mime_type,byte_size,width,height,metadata,created_at')
      .single();

    if (error) throw new Error(`Media asset insert failed: ${error.message}`);
    return data;
  }
}
