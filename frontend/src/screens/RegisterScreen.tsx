// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView // Usamos ScrollView por si el teclado tapa los campos
} from 'react-native';
import { api } from '../api/axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState(''); // <--- Nuevo estado
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false);

  const handleRegistro = async () => {
    // 1. Validar campos vacíos
    if (!nombre || !email || !confirmEmail || !password || !confirmPassword) {
      Alert.alert('Atención', 'Todos los campos son obligatorios');
      return;
    }

    // 2. Validar que los correos coincidan
    if (email !== confirmEmail) {
      Alert.alert('Error', 'Los correos electrónicos no coinciden.');
      return;
    }

    // 3. Validar seguridad de la contraseña
    // - Mínimo 8 caracteres
    if (password.length < 8) {
      Alert.alert('Contraseña Insegura', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    // - Al menos una mayúscula (Regex: busca letras de la A a la Z mayúsculas)
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Contraseña Insegura', 'La contraseña debe contener al menos una letra mayúscula.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden. Por favor, revíselas.');
      return;
    }

    setLoading(true);
    try {
      // Enviamos solo los datos necesarios al backend
      await api.post('/usuarios/registro', {
        nombre,
        email,
        password
      });

      Alert.alert(
        '¡Cuenta creada!',
        'Tu registro fue exitoso. Ahora inicia sesión.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );

    } catch (error: any) {
      console.error(error);
      const mensaje = error.response?.data?.error || 'Error al registrar usuario';
      Alert.alert('Error', mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Crear Cuenta 🚀</Text>
        <Text style={styles.subtitle}>Empieza a controlar tus gastos hoy</Text>

        {/* Nombre */}
        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Ana Garcia"
          value={nombre}
          onChangeText={setNombre}
        />

        {/* Email */}
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Confirmar Email (NUEVO CAMPO) */}
        <Text style={styles.label}>Confirmar Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="Repite tu correo"
          keyboardType="email-address"
          autoCapitalize="none"
          value={confirmEmail}
          onChangeText={setConfirmEmail}
        />

        {/* Password */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mín. 8 caracteres y 1 mayúscula"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.hint}>
          * Debe tener 8 caracteres y al menos una mayúscula.
        </Text>
        {/* Confirmar Contraseña */}
        <Text style={styles.label}>Repetir Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu contraseña de nuevo"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Text style={styles.hint}>
          * Ambas contraseñas deben ser idénticas.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleRegistro}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Importante para ScrollView
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10, // Reduje un poco el margen para que quepa todo
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
    marginTop: -5,
    fontStyle: 'italic'
  },
  button: {
    backgroundColor: '#007AFF',
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
    fontWeight: '600'
  }
});