import { Event } from '../types/event.types.js';

export class SimplifiedEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  registrationUrl: string;
  eventType: string;
  modalities: string[];
  location: string;
  sectors: string[];
  organizer: string;
  objectives: string[];
  availableSeats: number;
  totalSeats: number;

  constructor(event: Event) {
    this.id = event.id || 0;
    this.title = event.titre || 'Titre non disponible';
    this.description = event.description || 'Description non disponible';
    this.eventDate = event.dateEvenement || '';
    this.startTime = event.heureDebut || '';
    this.endTime = event.heureFin || '';
    this.registrationUrl = event.urlDetailEvenement || '';
    this.eventType = event.type || '';
    this.modalities = event.modalites || [];

    // Build location string
    const locationParts = [
      event.libelleEtablissement,
      event.ville,
      event.codePostal,
    ].filter(Boolean);
    this.location = locationParts.join(', ') || 'Lieu non spécifié';

    this.sectors = event.codesRome || [];
    this.organizer = event.libelleOrganisateurPrincipal || '';
    this.objectives = event.objectifs || [];

    // Calculate available seats
    const totalSeats = (event.nombrePlaceTotalDistance || 0) + (event.nombrePlaceTotalPresentiel || 0);
    const occupiedSeats = (event.nombreInscritDistance || 0) + (event.nombreInscritPresentiel || 0);
    this.totalSeats = totalSeats;
    this.availableSeats = totalSeats - occupiedSeats;
  }

  static fromEvents(events: Event[] | null | undefined): SimplifiedEvent[] {
    if (!events || events.length === 0) {
      return [];
    }
    return events.map((event) => new SimplifiedEvent(event));
  }
}