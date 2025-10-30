import { LaBonneBoiteCompany } from '../types/labonneboite.types';

export class SimplifiedCompany {
  id: number;
  name: string;
  officeName?: string;
  address: string;
  city: string;
  postcode: string;
  department: string;
  region: string;
  naf: string;
  nafLabel: string;
  rome: string;
  hiringPotential: number;
  isHighPotential: boolean;
  hasEmail: boolean;
  headcountRange: string;

  constructor(data: Partial<SimplifiedCompany>) {
    Object.assign(this, data);
  }

  static fromLaBonneBoiteCompany(company: LaBonneBoiteCompany): SimplifiedCompany {
    // Format headcount range
    let headcountRange = 'Non spécifié';
    if (company.headcount_min > 0 || company.headcount_max > 0) {
      if (company.headcount_min === company.headcount_max) {
        headcountRange = `${company.headcount_min} employés`;
      } else if (company.headcount_min === 0) {
        headcountRange = `Jusqu'à ${company.headcount_max} employés`;
      } else {
        headcountRange = `${company.headcount_min}-${company.headcount_max} employés`;
      }
    }

    return new SimplifiedCompany({
      id: company.id,
      name: company.company_name,
      officeName: company.office_name || undefined,
      address: `${company.city}, ${company.postcode}`,
      city: company.city,
      postcode: company.postcode,
      department: company.department,
      region: company.region,
      naf: company.naf,
      nafLabel: company.naf_label,
      rome: company.rome,
      hiringPotential: Math.round(company.hiring_potential * 10) / 10, // Round to 1 decimal
      isHighPotential: company.is_high_potential,
      hasEmail: company.email === 'yes',
      headcountRange,
    });
  }

  static fromCompanies(companies: LaBonneBoiteCompany[]): SimplifiedCompany[] {
    return companies.map((company) =>
      SimplifiedCompany.fromLaBonneBoiteCompany(company),
    );
  }
}