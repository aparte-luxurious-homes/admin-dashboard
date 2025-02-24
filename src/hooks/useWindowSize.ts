import { useEffect, useState } from "react";

const useWindowSize = (): number => {
  const getCurrentWidth = (): number => (typeof window !== "undefined" ? window.innerWidth : 0);
  const [screenSize, setScreenSize] = useState<number>(getCurrentWidth());

  useEffect(() => {
    const updateDimension = () => {
      setScreenSize(getCurrentWidth());
    };
    
    window.addEventListener("resize", updateDimension);
    
    return () => {
      window.removeEventListener("resize", updateDimension);
    };
  }, []);

  return screenSize;
};

export default useWindowSize;
