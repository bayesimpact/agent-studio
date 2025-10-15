import { JobOffer } from '../types/job-offer.types';

export class SimplifiedJobOffer {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly company: string,
    public readonly location: string,
    public readonly contractType: string,
  ) {}

  static fromJobOffer(jobOffer: JobOffer): SimplifiedJobOffer {
    return new SimplifiedJobOffer(
      jobOffer.id,
      jobOffer.intitule,
      jobOffer.entreprise.nom,
      jobOffer.lieuTravail.libelle,
      jobOffer.typeContratLibelle,
    );
  }

  static fromJobOffers(jobOffers: JobOffer[]): SimplifiedJobOffer[] {
    return jobOffers.map((jobOffer) => SimplifiedJobOffer.fromJobOffer(jobOffer));
  }
}