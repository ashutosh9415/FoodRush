import {
  createContext,
  useEffect,
  useState,
} from "react";

import api from "../utils/api";

export const AuthContext =
  createContext();

function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const getCurrentUser =
    async () => {
      try {
        const response =
          await api.get(
            "/user/currentuser"
          );

        setUser(
          response.data.user
        );
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;