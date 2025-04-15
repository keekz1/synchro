
'use client';

import { SWRConfig } from 'swr';

export default function SWRConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false
      }}
    >
      {children}
    </SWRConfig>
  );
}