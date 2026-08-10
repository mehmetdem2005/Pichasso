import { validateLibraryDraft } from '../../../../../packages/contracts/library.mjs';

export class LibraryService {
  constructor({ repository, mediaService }) {
    this.repository = repository;
    this.mediaService = mediaService;
  }

  async listLibraries(projectSlug = 'pichasso') {
    const project = await this.repository.getProjectBySlug(projectSlug);
    if (!project) return null;
    const libraries = await this.repository.listLibraries(project.id);
    return { project, libraries };
  }

  async getPublicLibrary(projectSlug, librarySlug) {
    return this.#getLibrary(projectSlug, librarySlug, true);
  }

  async getAdminLibrary(projectSlug, librarySlug) {
    return this.#getLibrary(projectSlug, librarySlug, false);
  }

  async saveLibrary(projectSlug, rawLibrary) {
    const library = validateLibraryDraft(rawLibrary);
    await this.repository.saveLibrary(projectSlug, library);
    return this.#getLibrary(projectSlug, library.slug, false);
  }

  async deleteLibrary(projectSlug, librarySlug) {
    const project = await this.repository.getProjectBySlug(projectSlug);
    if (!project) return false;
    return this.repository.deleteLibrary(project.id, librarySlug);
  }

  async #getLibrary(projectSlug, librarySlug, publishedOnly) {
    const project = await this.repository.getProjectBySlug(projectSlug);
    if (!project) return null;

    const library = await this.repository.getLibraryBySlug(project.id, librarySlug, { publishedOnly });
    if (!library) return null;

    const slides = await this.repository.listSlides(library.id);
    const assetIds = [...new Set(slides.flatMap((slide) => [slide.image_asset_id, slide.background_asset_id]).filter(Boolean))];
    const assets = await this.repository.listMediaAssets(assetIds);
    const signedAssets = await this.mediaService.createSignedReadUrls(assets);

    return {
      project,
      library: {
        id: library.id,
        slug: library.slug,
        title: library.title,
        description: library.description,
        status: library.status,
        theme: library.theme ?? {},
        updatedAt: library.updated_at
      },
      slides: slides.map((slide) => ({
        id: slide.id,
        position: slide.position,
        question: slide.question,
        body: slide.body,
        imageAlt: slide.image_alt,
        imageAssetId: slide.image_asset_id,
        backgroundAssetId: slide.background_asset_id,
        imageUrl: signedAssets.get(slide.image_asset_id) ?? null,
        backgroundImageUrl: signedAssets.get(slide.background_asset_id) ?? null
      }))
    };
  }
}
