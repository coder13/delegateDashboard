import '@wca/helpers';

declare module '@wca/helpers' {
  export interface RegistrationsParticipationSource {
    type: 'registrations';
  }

  export interface ParticipationResultCondition {
    type: 'ranking' | 'percent' | 'attemptResult';
    scope?: 'average' | 'single';
    value: number;
  }

  export interface LinkedRoundsParticipationSource {
    type: 'linkedRounds';
    roundIds: string[];
    resultCondition: ParticipationResultCondition;
  }

  export interface RoundParticipationSource {
    type: 'round';
    roundId: string;
    resultCondition: ParticipationResultCondition;
  }

  export type ParticipationSource =
    | RegistrationsParticipationSource
    | LinkedRoundsParticipationSource
    | RoundParticipationSource;

  export interface ParticipationRuleset {
    participationSource: ParticipationSource;
    reservedPlaces: unknown | null;
  }

  export interface Round {
    linkedRounds?: string[] | null;
    participationRuleset?: ParticipationRuleset | null;
  }
}
