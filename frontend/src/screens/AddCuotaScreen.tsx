// src/screens/AddCuotaScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import  api  from '../api/axios';
import { useNavigation } from '@react-navigation/native';

export const AddCuotaScreen = () => {
  const navigation = useNavigation();
  const [descripcion, setDescripcion] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [cuotas, setCuotas] = useState('');

  const handleGuardar = async () => {
    if (!descripcion || !montoTotal || !cuotas) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      await api.post('/cuotas/crear', {
        descripcion,
        monto_total: parseFloat(montoTotal),
        cantidad_cuotas: parseInt(cuotas),
        fecha_inicio: new Date().toISOString().split('T')[0]
      });
      Alert.alert("Listo", "Compra registrada");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo crear");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva Compra a Cuotas 💳</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Producto / Descripción</Text>
        <TextInput style={styles.input} placeholder="Ej: TV Samsung" value={descripcion} onChangeText={setDescripcion} />

        <Text style={styles.label}>Monto TOTAL de la compra</Text>
        <TextInput style={styles.input} placeholder="Total (ej: 120000)" keyboardType="numeric" value={montoTotal} onChangeText={setMontoTotal} />

        <Text style={styles.label}>Cantidad de Cuotas</Text>
        <TextInput style={styles.input} placeholder="Ej: 12" keyboardType="numeric" value={cuotas} onChangeText={setCuotas} />

        <TouchableOpacity style={styles.btn} onPress={handleGuardar}>
            <Text style={styles.btnText}>Guardar Compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign:'center' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 3 },
  label: { fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#6200ee', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});