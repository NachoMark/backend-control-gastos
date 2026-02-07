// src/navigation/AppNavigator.tsx
import React, { useContext, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

// Pantallas
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { LockScreen } from '../screens/LockScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AddGastoScreen } from '../screens/AddGastoScreen';
import { CuotasScreen } from '../screens/CuotasScreen';
import { AddCuotaScreen } from '../screens/AddCuotaScreen';
import { AddSuscripcionScreen } from '../screens/AddSuscripcionScreen';
import { SuscripcionesScreen } from '../screens/SuscripcionesScreen';
import { EditSuscripcionScreen } from '../screens/EditSuscripcionScreen';
import { EditCuotaScreen } from '../screens/EditCuotaScreen';

export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  MisCuotas: undefined;
  MisSuscripciones: undefined;
  AddSuscripcion: undefined;
  AddCuota: undefined;
  EditCuota: undefined;
  AgregarGasto: undefined;
  EditSuscripcion: { item: any }
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

export const AppNavigator = () => {
  const { user, isLoading } = useContext(AuthContext);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Si el usuario cierra sesión, volvemos a bloquear para la próxima vez
  useEffect(() => {
    if (!user) {
      setIsUnlocked(false);
    }
  }, [user]);

  if (isLoading) return <LoadingScreen />;

  // CASO 1: NO HAY USUARIO -> Mostrar Login/Registro
  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // CASO 2: HAY USUARIO PERO NO HA PASADO LA HUELLA -> Mostrar LockScreen
  // Nota: Le pasamos la función para que al detectar la huella ponga isUnlocked en true
  if (!isUnlocked) {
    return <LockScreen onUnlocked={() => setIsUnlocked(true)} />;
  }

  // CASO 3: TODO OK -> Mostrar la App completa
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="AgregarGasto"
          component={AddGastoScreen}
          options={{ title: 'Agregar Nuevo Gasto' }}
        />
        <Stack.Screen name="MisCuotas" component={CuotasScreen} options={{ title: 'Mis Compras a Cuotas' }} />
        <Stack.Screen name="AddCuota" component={AddCuotaScreen} options={{ title: 'Registrar Compra' }} />
        <Stack.Screen name="MisSuscripciones" component={SuscripcionesScreen} options={{ title: 'Mis Suscripciones' }} />
        <Stack.Screen name="AddSuscripcion" component={AddSuscripcionScreen} options={{ title: 'Agregar Servicio' }} />
        <Stack.Screen name="EditSuscripcion" component={EditSuscripcionScreen} options={{ title: 'Editar' }} />
        <Stack.Screen name="EditCuota" component={EditCuotaScreen} options={{ title: "Editar" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};