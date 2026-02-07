import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
export const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  // Estados locales para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // 1. Validación rápida
    if (email.length === 0 || password.length === 0) {
      Alert.alert("Atención", "Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. Llamamos a la función del Contexto
      await login(email, password);
      // No necesitamos navegar manualmente, el AppNavigator lo hará solo al detectar el usuario
    } catch (error) {
      // El error ya lo maneja el context con un Alert, aquí solo detenemos el spinner
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para controlar tus gastos</Text>

        {/* Input Email */}
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none" // Evita que la primera letra sea mayúscula
        />

        {/* Input Password */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // Oculta el texto
        />

        {/* Botón de Login */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isSubmitting} // Desactiva el botón mientras carga
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        {/* Botón simple para registro */}
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => navigation.navigate('Registro')} 
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Gris muy claro de fondo
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Sombra para Android
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF', // Azul estilo iOS
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
  }
});