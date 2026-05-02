import {
  getAdvancementConditionForRound,
  getDerivedAdvancementCondition,
  getDualRoundDetails,
  usesRegistrationParticipation,
} from './rounds';
import { buildEvent, buildRound } from '../../store/reducers/_tests_/helpers';
import { describe, expect, it } from 'vitest';

describe('usesRegistrationParticipation', () => {
  it('treats linked second rounds with registration participation as registration-based', () => {
    const round = buildRound({
      id: 'clock-r2',
      participationRuleset: {
        participationSource: {
          type: 'registrations',
        },
        reservedPlaces: null,
      },
    });

    expect(usesRegistrationParticipation(round)).toBe(true);
  });
});

describe('getDerivedAdvancementCondition', () => {
  it('maps linked-round result conditions into legacy advancement conditions', () => {
    const round = buildRound({
      id: 'clock-r3',
      participationRuleset: {
        participationSource: {
          type: 'linkedRounds',
          roundIds: ['clock-r1', 'clock-r2'],
          resultCondition: {
            type: 'percent',
            scope: 'average',
            value: 75,
          },
        },
        reservedPlaces: null,
      },
    });

    expect(getDerivedAdvancementCondition(round)).toEqual({
      type: 'percent',
      level: 75,
    });
  });
});

describe('getAdvancementConditionForRound', () => {
  it('derives advancement for linked source rounds from the target round participation ruleset', () => {
    const event = buildEvent({
      id: 'clock',
      rounds: [
        buildRound({
          id: 'clock-r1',
          participationRuleset: {
            participationSource: {
              type: 'registrations',
            },
            reservedPlaces: null,
          },
        }),
        buildRound({
          id: 'clock-r2',
          participationRuleset: {
            participationSource: {
              type: 'registrations',
            },
            reservedPlaces: null,
          },
        }),
        buildRound({
          id: 'clock-r3',
          participationRuleset: {
            participationSource: {
              type: 'linkedRounds',
              roundIds: ['clock-r1', 'clock-r2'],
              resultCondition: {
                type: 'percent',
                scope: 'average',
                value: 75,
              },
            },
            reservedPlaces: null,
          },
        }),
      ],
    });

    expect(getAdvancementConditionForRound(event, 'clock-r1')).toEqual({
      type: 'percent',
      level: 75,
    });
    expect(getAdvancementConditionForRound(event, 'clock-r2')).toEqual({
      type: 'percent',
      level: 75,
    });
  });
});

describe('getDualRoundDetails', () => {
  it('identifies source rounds in a dual-round configuration', () => {
    const event = buildEvent({
      id: 'clock',
      rounds: [
        buildRound({ id: 'clock-r1' }),
        buildRound({ id: 'clock-r2' }),
        buildRound({
          id: 'clock-r3',
          participationRuleset: {
            participationSource: {
              type: 'linkedRounds',
              roundIds: ['clock-r1', 'clock-r2'],
              resultCondition: {
                type: 'percent',
                scope: 'average',
                value: 75,
              },
            },
            reservedPlaces: null,
          },
        }),
      ],
    });

    expect(getDualRoundDetails(event, 'clock-r1')).toEqual({
      linkedRoundIds: ['clock-r1', 'clock-r2'],
      targetRoundId: 'clock-r3',
      isSourceRound: true,
      isTargetRound: false,
    });
  });

  it('identifies the target round in a dual-round configuration', () => {
    const event = buildEvent({
      id: 'clock',
      rounds: [
        buildRound({ id: 'clock-r1' }),
        buildRound({ id: 'clock-r2' }),
        buildRound({
          id: 'clock-r3',
          participationRuleset: {
            participationSource: {
              type: 'linkedRounds',
              roundIds: ['clock-r1', 'clock-r2'],
              resultCondition: {
                type: 'percent',
                scope: 'average',
                value: 75,
              },
            },
            reservedPlaces: null,
          },
        }),
      ],
    });

    expect(getDualRoundDetails(event, 'clock-r3')).toEqual({
      linkedRoundIds: ['clock-r1', 'clock-r2'],
      targetRoundId: 'clock-r3',
      isSourceRound: false,
      isTargetRound: true,
    });
  });
});
