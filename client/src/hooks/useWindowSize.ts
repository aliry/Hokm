import { useState, useEffect } from 'react';
import { MobileWidthBreakPoint } from '../gameConfigs';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MobileWidthBreakPoint);
    }

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
