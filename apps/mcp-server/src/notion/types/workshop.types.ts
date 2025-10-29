export interface WorkshopLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  google_place_id: string;
}

export interface WorkshopDate {
  start: string;
  end: string | null;
  is_datetime: boolean;
}

export interface Workshop {
  id: string;
  title: string;
  date: WorkshopDate;
  capacity: number;
  signup_url: string;
  status: string;
  atelier_name: string;
  type: string;
  location_text: string;
  location_place: WorkshopLocation;
  organizer: string;
  atelier_description: string;
}

export interface WorkshopSearchResponse {
  items: Workshop[];
  next_cursor: string | null;
  has_more: boolean;
}