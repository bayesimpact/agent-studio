import { Workshop } from '../types/workshop.types';

export class SimplifiedWorkshop {
  id: string;
  title: string;
  date: string;
  capacity: number;
  signupUrl: string;
  status: string;
  workshopName: string;
  type: string;
  location: string;
  organizer: string;
  description: string;
  availableSeats: number;

  constructor(workshop: Workshop) {
    this.id = workshop.id;
    this.title = workshop.title;
    this.date = workshop.date.start;
    this.capacity = workshop.capacity || 0;
    this.signupUrl = workshop.signup_url || '';
    this.status = workshop.status || 'À venir';
    this.workshopName = workshop.atelier_name || '';
    this.type = workshop.type || '';
    this.location = workshop.location_text || workshop.location_place?.address || 'Lieu non spécifié';
    this.organizer = workshop.organizer || '';
    this.description = workshop.atelier_description || '';
    // For now, assume all seats are available (can be enhanced later)
    this.availableSeats = this.capacity;
  }

  static fromWorkshops(workshops: Workshop[] | null | undefined): SimplifiedWorkshop[] {
    if (!workshops || workshops.length === 0) {
      return [];
    }
    return workshops.map((workshop) => new SimplifiedWorkshop(workshop));
  }
}