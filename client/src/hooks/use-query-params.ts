import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export function useQueryParams() {
  const [location] = useLocation();
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    // Update params when location changes
    setParams(new URLSearchParams(window.location.search));

    // Listen for pushState/replaceState (client-side navigation)
    const handleNavigation = () => {
      setParams(new URLSearchParams(window.location.search));
    };

    // Override pushState and replaceState to detect changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleNavigation();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleNavigation();
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [location]);

  const get = (key: string): string | null => {
    return params.get(key);
  };

  const set = (key: string, value: string) => {
    const newParams = new URLSearchParams(window.location.search);
    newParams.set(key, value);
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    setParams(newParams);
  };

  const remove = (key: string) => {
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete(key);
    const newUrl = newParams.toString() 
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setParams(newParams);
  };

  return { get, set, remove, params };
}
