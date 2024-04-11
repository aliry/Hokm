import { useAtom } from 'jotai';
import { appStateAtom } from '../gameState/gameState';

export function useTeamLinks(): {
  myTeamLink: string;
  opponentTeamLink: string;
} {
  const [appState] = useAtom(appStateAtom);

  if (appState.teamCodes.length !== 2) {
    return { myTeamLink: '', opponentTeamLink: '' };
  }
  const [myTeamCode, opponentTeamCode] = appState.teamCodes;

  // Get the current location without any search parameters
  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

  // Create the search parameters for each team
  const myTeamParams = new URLSearchParams({ teamCode: myTeamCode }).toString();
  const opponentTeamParams = new URLSearchParams({
    teamCode: opponentTeamCode
  }).toString();

  // Build the full URLs for each team
  const myTeamLink = `${baseUrl}?${myTeamParams}`;
  const opponentTeamLink = `${baseUrl}?${opponentTeamParams}`;

  return { myTeamLink, opponentTeamLink };
}
