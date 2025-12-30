import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UnreadMessagesContextType {
  totalUnread: number;
  setTotalUnread: (count: number) => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
}
