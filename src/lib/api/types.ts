export interface WcaUser {
  id: number;
  name: string;
  wca_id?: string;
  avatar: {
    url: string;
    thumb_url: string;
  };
  country_iso2: string;
  email?: string;
}

export interface WcaPerson {
  id: number;
  name: string;
  wcaUserId?: number;
  wcaId?: string;
  countryIso2: string;
}

export interface CompetitionSearchResult {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country_iso2: string;
}
