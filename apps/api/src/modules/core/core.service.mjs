export class CoreService {
  constructor(repository) { this.repository = repository; }

  async getProjectSnapshot(slug = 'pichasso') {
    const project = await this.repository.getProjectBySlug(slug);
    if (!project) return null;
    const modules = await this.repository.listModules(project.id);
    return { project, modules };
  }

  async getProjectMedia(slug = 'pichasso', { moduleId = null } = {}) {
    const project = await this.repository.getProjectBySlug(slug);
    if (!project) return null;
    const assets = await this.repository.listMediaAssets(project.id, { moduleId });
    return { project, assets };
  }

  async registerMediaAsset(input) {
    return this.repository.createMediaAsset(input);
  }
}
