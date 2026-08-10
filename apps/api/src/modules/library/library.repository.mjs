export class LibraryRepository {
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

  async listLibraries(projectId) {
    const { data, error } = await this.client
      .from('libraries')
      .select('id,project_id,slug,title,description,status,theme,created_at,updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Library list failed: ${error.message}`);
    return data ?? [];
  }

  async getLibraryBySlug(projectId, slug, { publishedOnly = false } = {}) {
    let query = this.client
      .from('libraries')
      .select('id,project_id,slug,title,description,status,theme,created_at,updated_at')
      .eq('project_id', projectId)
      .eq('slug', slug);

    if (publishedOnly) query = query.eq('status', 'published');
    const { data, error } = await query.maybeSingle();

    if (error) throw new Error(`Library query failed: ${error.message}`);
    return data ?? null;
  }

  async listSlides(libraryId) {
    const { data, error } = await this.client
      .from('slides')
      .select('id,library_id,position,question,body,image_alt,image_asset_id,background_asset_id')
      .eq('library_id', libraryId)
      .order('position', { ascending: true });

    if (error) throw new Error(`Slide query failed: ${error.message}`);
    return data ?? [];
  }

  async listMediaAssets(ids) {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from('media_assets')
      .select('id,storage_bucket,storage_path,original_name,mime_type,width,height')
      .in('id', ids);

    if (error) throw new Error(`Media query failed: ${error.message}`);
    return data ?? [];
  }

  async saveLibrary(projectSlug, library) {
    const { data, error } = await this.client.rpc('save_library_content', {
      p_project_slug: projectSlug,
      p_library: {
        slug: library.slug,
        title: library.title,
        description: library.description,
        status: library.status,
        theme: library.theme
      },
      p_slides: library.slides
    });

    if (error) throw new Error(`Library save failed: ${error.message}`);
    return data;
  }

  async deleteLibrary(projectId, slug) {
    const { data, error } = await this.client
      .from('libraries')
      .delete()
      .eq('project_id', projectId)
      .eq('slug', slug)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(`Library delete failed: ${error.message}`);
    return data != null;
  }
}
