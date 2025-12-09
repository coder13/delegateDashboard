import { type WcaUser } from '../../lib/api/types';
import { createContext, useContext } from 'react';

export interface IAuthContext {
  user: WcaUser | null;
  signIn: () => void;
  signOut: () => void;
  signedIn: () => boolean;
  userFetchError?: Error;
}

export const AuthContext = createContext<IAuthContext>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  signedIn: () => false,
  userFetchError: undefined,
});

export const useAuth = () => useContext(AuthContext);
