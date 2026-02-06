// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';
import { Alert } from 'react-native';

interface User {
  id: string; // Ojo: MongoDB usa IDs tipo String, no number
  nombre: string;
  email: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // --- CORRECCIÓN AQUÍ ---
          // Usamos 'x-auth-token' (igual que el backend) y enviamos solo el token
          api.defaults.headers.common['x-auth-token'] = storedToken; 
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/usuarios/login', { email, password });
      
      const { token, usuario } = response.data;

      setToken(token);
      setUser(usuario);

      // --- CORRECCIÓN AQUÍ TAMBIÉN ---
      api.defaults.headers.common['x-auth-token'] = token; 

      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(usuario));

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo iniciar sesión');
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    // Borramos el header correcto
    delete api.defaults.headers.common['x-auth-token']; 
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};