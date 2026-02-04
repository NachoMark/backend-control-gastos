// src/screens/LockScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  onUnlocked: () => void;
}

export const LockScreen = ({ onUnlocked }: Props) => {
  
  const autenticar = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acceso Protegido',
      fallbackLabel: 'Usar contraseña del dispositivo',
    });

    if (result.success) {
      onUnlocked(); // Llamamos a la función para dar paso al Home
    }
  };

  useEffect(() => {
    autenticar(); // Pedir huella apenas cargue la pantalla
  }, []);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="shield-lock" size={100} color="#6200ee" />
      <Text style={styles.title}>Aplicación Bloqueada</Text>
      <Text style={styles.subtitle}>Usa tu huella para continuar</Text>

      <TouchableOpacity style={styles.btn} onPress={autenticar}>
        <Text style={styles.btnText}>Intentar de nuevo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 40
  },
  btn: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold'
  }
});