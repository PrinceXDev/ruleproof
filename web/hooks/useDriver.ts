'use client';

import { useEffect, useState } from 'react';

// Name of the backend driver the API reports, shown in the sidebar.
const useDriver = () => {
  const [driver, setDriver] = useState<string>();

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setDriver(d.driver))
      .catch((e) => console.error('health check failed:', e));
  }, []);

  return driver;
};

export default useDriver;
