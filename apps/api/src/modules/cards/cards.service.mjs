export class CardsService {
  constructor(repository) { this.repository = repository; }

  async getPublishedCards(context = {}) {
    const cards = await this.repository.listPublished(context);
    return { cards };
  }
}
