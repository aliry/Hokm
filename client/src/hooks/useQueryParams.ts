import { useState, useEffect } from 'react';

/**
 * Custom hook to retrieve and manage query parameters from the current URL.
 * @returns The URLSearchParams object representing the query parameters.
 */
export function useQueryParams() {
  // Initialize the state with the current location's search parameters
  const [queryParams, setQueryParams] = useState(
    new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    // Define a function that updates the search parameters state
    const updateQueryParams = () => {
      setQueryParams(new URLSearchParams(window.location.search));
    };

    // Listen to popstate event to handle browser navigation
    window.addEventListener('popstate', updateQueryParams);

    // Call the function to ensure the state is updated with the initial value
    updateQueryParams();

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', updateQueryParams);
    };
  }, []); // Empty dependency array means this effect will only run once on mount

  return queryParams;
}
