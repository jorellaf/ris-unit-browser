import { globalHistory } from '@reach/router';
import { useEffect, useState } from 'react';

export function useUnitFilterParams(
  key: string,
  defaultValue = '',
): [string, (value: string) => void, () => void] {
  const getParam = () =>
    new URLSearchParams(window.location.search).get(key) ?? defaultValue;

  const [value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    const syncParam = () => {
      const nextValue = getParam();
      setValue((prevValue) => (prevValue === nextValue ? prevValue : nextValue));
    };

    syncParam();

    const historyListener = globalHistory.listen(() => syncParam());

    return () => {
      historyListener();
    };
  }, [key, defaultValue]);

  const clearHash = () => {
    const params = new URLSearchParams(window.location.search);
    const stringParams = params.toString();
    const newUrl = window.location.pathname + (stringParams ? `?${stringParams}` : '');
    const currentUrl =
      window.location.pathname +
      (window.location.search ? window.location.search : '') +
      (window.location.hash ? window.location.hash : '');
    if (currentUrl !== newUrl) {
      window.history.pushState({}, '', newUrl);
    }
  };

  const setParam = (next: string) => {
    const current = getParam();
    if (current === next) return;

    const params = new URLSearchParams(window.location.search);
    if (!next) params.delete(key);
    else params.set(key, next);

    const stringParams = params.toString();

    const keepHash = !(key === 'faction' && next);
    const newUrl =
      window.location.pathname +
      (stringParams ? `?${stringParams}` : '') +
      (keepHash ? window.location.hash : '');

    const currentUrl =
      window.location.pathname +
      (window.location.search ? window.location.search : '') +
      (window.location.hash ? window.location.hash : '');
    if (currentUrl !== newUrl) {
      window.history.pushState({}, '', newUrl);
    }

    setValue(next);
  };

  return [value, setParam, clearHash];
}
