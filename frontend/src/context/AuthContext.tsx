// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/axios'; // Usamos nuestra instancia configurada
import { Alert } from 'react-native';

// 1. Definimos qué forma tienen nuestros datos (TypeScript)
interface User {
  id: number;
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

// Creamos el contexto vacío
export const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

// 2. El Proveedor que envolverá la App
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para mostrar pantalla de carga al inicio

  // Al abrir la App: Verificar si hay token guardado
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Importante: Configurar Axios para usar este token en futuras peticiones
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
      } finally {
        setIsLoading(false); // Terminamos de cargar
      }
    };
    loadStorageData();
  }, []);

  // Función de Login
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/usuarios/login', { email, password });
      
      const { token, usuario } = response.data;

      // 1. Actualizar estado
      setToken(token);
      setUser(usuario);

      // 2. Configurar Axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. Guardar en el celular (Persistencia)
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(usuario));

    } catch (error: any) {
      console.error(error);
      // Mostramos alerta nativa del celular
      Alert.alert('Error', error.response?.data?.error || 'No se pudo iniciar sesión');
      throw error; // Lanzamos el error para que la pantalla de Login lo sepa
    }
  };

  // Función de Logout
  const logout = async () => {
    setUser(null);
    setToken(null);
    delete api.defaults.headers.common['Authorization'];
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};