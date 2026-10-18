import { useCallback } from 'react';
import { useNavigationContainerRef, useRouter } from 'expo-router';
import {
  CommonActions,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type TabNavigationState,
} from '@react-navigation/native';

type NavState = NavigationState | PartialState<NavigationState>;

/** The tabs whose `[id]` detail Home opens. */
const DETAIL_TABS = ['renters', 'properties'];

/** The tab navigator's state, wherever it sits under the root stack. */
function findTabsState(state: NavState | undefined): NavState | undefined {
  for (const route of state?.routes ?? []) {
    if (route.name === '(tabs)') return route.state;
    const found = findTabsState(route.state);
    if (found) return found;
  }
  return undefined;
}

/**
 * Opens `/renters/<id>` or `/properties/<id>` from Home as the only screen in that tab, so
 * back returns to Home. Any other path is a plain push.
 *
 * A plain push stacked the detail onto whatever the tab still held: back from a detail opened
 * here leaves the tab but keeps the detail in its stack, so the next one opened from Home
 * landed on top of it and back showed the earlier one instead of Home. Clearing the tab first
 * does not help — the mounted stack rebuilds at once with its list underneath — and handing
 * the tab `{ screen, params }` is no better, as a mounted stack may treat it as a push onto
 * what it already holds. So this resets the tab with its full nested state: the detail alone,
 * the shape a first visit gets.
 *
 * State is read from the root ref: a blurred tab's own navigation object holds a stale
 * snapshot that still shows the other tabs empty.
 */
export function useOpenTabDetail() {
  const router = useRouter();
  const rootNavigation = useNavigationContainerRef();

  return useCallback(
    (path: string) => {
      const [tabName, id, ...rest] = path.split('/').filter(Boolean);
      const tabs = findTabsState(rootNavigation.getRootState()) as
        | TabNavigationState<ParamListBase>
        | undefined;
      const target = tabs?.routes.find((r) => r.name === tabName);
      if (!tabs?.key || !target || !DETAIL_TABS.includes(tabName) || !/^\d+$/.test(id ?? '') || rest.length) {
        router.push(path as never);
        return;
      }

      rootNavigation.dispatch({
        ...CommonActions.reset({
          ...tabs,
          index: tabs.routes.indexOf(target),
          // Without the entry, back from the detail had nowhere to go in the tab history.
          history: [
            ...(tabs.history ?? []).filter((h) => h.type !== 'route' || h.key !== target.key),
            { type: 'route', key: target.key },
          ],
          routes: tabs.routes.map((r) =>
            r === target
              ? { key: r.key, name: r.name, state: { routes: [{ name: '[id]', params: { id } }] } }
              : r
          ),
        }),
        target: tabs.key,
      });
    },
    [router, rootNavigation],
  );
}
