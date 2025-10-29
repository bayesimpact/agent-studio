import { JobOffer } from '../types/job-offer.types.js';

export class SimplifiedJobOffer {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly company: string,
    public readonly location: string,
    public readonly contractType: string,
    public readonly url: string,
  ) {}

  static fromJobOffer(jobOffer: JobOffer): SimplifiedJobOffer {
    return new SimplifiedJobOffer(
      jobOffer.id,
      jobOffer.intitule,
      jobOffer.entreprise.nom,
      jobOffer.lieuTravail.libelle,
      jobOffer.typeContratLibelle,
      jobOffer.origineOffre.urlOrigine
    );
  }

  static fromJobOffers(jobOffers: JobOffer[] | null | undefined): SimplifiedJobOffer[] {
    if (!jobOffers || jobOffers.length === 0) {
      return [];
    }
    return jobOffers.map((jobOffer) => SimplifiedJobOffer.fromJobOffer(jobOffer));
  }
}