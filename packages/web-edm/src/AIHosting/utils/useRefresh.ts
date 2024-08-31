import { useState, useEffect } from 'react';

export const useRefresh = () => {
  const [refresh, setRefresh] = useState(false);

  return () => setRefresh(!refresh);
};
