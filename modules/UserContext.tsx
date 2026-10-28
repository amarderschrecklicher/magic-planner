import React, { createContext, useContext, useState } from "react";

type UserContextType = {
  accountID: string;
  name: string,
  gender: boolean
  email: string;
  setUser: (id: string,name:string,gender:boolean, email: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [accountID, setAccountID] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState(false);
  const [email, setEmail] = useState("");

  const setUser = (id: string,name:string,gender:boolean, mail: string) => {
    setAccountID(id);
    setName(name);
    setGender(gender);
    setEmail(mail);
  };

  return (
    <UserContext.Provider value={{ accountID,name,gender, email, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
