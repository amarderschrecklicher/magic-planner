import React, { createContext, useContext, useState } from "react";

type UserContextType = {
  accountID: string;
  email: string;
  setUser: (id: string, email: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [accountID, setAccountID] = useState("");
  const [email, setEmail] = useState("");

  const setUser = (id: string, mail: string) => {
    setAccountID(id);
    setEmail(mail);
  };

  return (
    <UserContext.Provider value={{ accountID, email, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
