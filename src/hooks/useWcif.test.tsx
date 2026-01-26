import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  useAcceptedPersons,
  useFirstTimers,
  useGroupActivitiesByRound,
  useWcif,
  useWcifRooms,
} from './useWcif';
import { useAppSelector } from '../store';
import {
  selectAcceptedPersons,
  selectFirstTimers,
  selectGroupActivitiesByRound,
  selectWcifRooms,
} from '../store/selectors';
import {
  buildActivity,
  buildPerson,
  buildState,
  buildWcif,
} from '../store/reducers/_tests_/helpers';

vi.mock('../store', () => ({
  useAppSelector: vi.fn(),
}));

vi.mock('../store/selectors', () => ({
  selectAcceptedPersons: vi.fn(),
  selectFirstTimers: vi.fn(),
  selectGroupActivitiesByRound: vi.fn(),
  selectWcifRooms: vi.fn(),
}));

const useAppSelectorMock = vi.mocked(useAppSelector);
const selectAcceptedPersonsMock = vi.mocked(selectAcceptedPersons);
const selectFirstTimersMock = vi.mocked(selectFirstTimers);
const selectGroupActivitiesByRoundMock = vi.mocked(selectGroupActivitiesByRound);
const selectWcifRoomsMock = vi.mocked(selectWcifRooms);

const HookValueTester = ({ value }: { value: unknown }) => (
  <div data-testid="value">{JSON.stringify(value)}</div>
);

describe('useWcif hooks', () => {
  const wcif = buildWcif([buildActivity()], [buildPerson()]);
  const state = buildState(wcif);
  const wcifRoom = wcif.schedule.venues[0].rooms[0];

  beforeEach(() => {
    useAppSelectorMock.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(state);
      }
      return undefined;
    });
  });

  it('returns wcif from state', () => {
    const TestComponent = () => {
      const value = useWcif();
      return <HookValueTester value={value} />;
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('value').textContent).toContain('Test Competition');
  });

  it('delegates accepted persons selector', () => {
    selectAcceptedPersonsMock.mockReturnValue([buildPerson({ name: 'Accepted' })]);
    const TestComponent = () => {
      const value = useAcceptedPersons();
      return <HookValueTester value={value} />;
    };

    const { getByTestId } = render(<TestComponent />);

    expect(selectAcceptedPersonsMock).toHaveBeenCalled();
    expect(getByTestId('value').textContent).toContain('Accepted');
  });

  it('delegates first timers selector', () => {
    selectFirstTimersMock.mockReturnValue([buildPerson({ name: 'First Timer' })]);
    const TestComponent = () => {
      const value = useFirstTimers();
      return <HookValueTester value={value} />;
    };

    const { getByTestId } = render(<TestComponent />);

    expect(selectFirstTimersMock).toHaveBeenCalled();
    expect(getByTestId('value').textContent).toContain('First Timer');
  });

  it('passes roundId to group activities selector', () => {
    selectGroupActivitiesByRoundMock.mockReturnValue([buildActivity({ name: 'Group' })]);
    const TestComponent = () => {
      const value = useGroupActivitiesByRound('333-r1');
      return <HookValueTester value={value} />;
    };

    const { getByTestId } = render(<TestComponent />);

    expect(selectGroupActivitiesByRoundMock).toHaveBeenCalledWith(state, '333-r1');
    expect(getByTestId('value').textContent).toContain('Group');
  });

  it('delegates wcif rooms selector', () => {
    selectWcifRoomsMock.mockReturnValue([wcifRoom]);
    const TestComponent = () => {
      const value = useWcifRooms();
      return <HookValueTester value={value} />;
    };

    const { getByTestId } = render(<TestComponent />);

    expect(selectWcifRoomsMock).toHaveBeenCalled();
    expect(getByTestId('value').textContent).toContain(wcifRoom.name);
  });
});
