export type SearchResultItem =
  | {
      class: 'person';
      id: number;
      name: string;
      wcaId?: string;
      countryIso2: string;
      avatar: {
        url: string;
        thumbUrl: string;
      };
    }
  | {
      class: 'competition';
      id: string;
      name: string;
      start_date: string;
      end_date: string;
      city: string;
      country_iso2: string;
    }
  | {
      class: 'activity';
      id: number;
      name: string;
      activityCode: string;
    };

export interface SearchResult {
  item: SearchResultItem;
  score?: number;
}
