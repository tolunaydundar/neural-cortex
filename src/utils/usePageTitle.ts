import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `Neural Cortex | ${title}`;
    
    // Optionally cleanup when unmounting if you want to revert to the base, 
    // but typically the next page will set its own title immediately.
    return () => {
      document.title = 'Neural Cortex';
    };
  }, [title]);
}
