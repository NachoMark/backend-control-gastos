import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../api/axios';
import { useNavigation, useRoute } from '@react-navigation/native';

export const EditCuotaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { item }: any = route.params; // Recibimos la cuota a editar

  const [descripcion, setDescripcion] = useState(item.descripcion);
  const [montoTotal, setMontoTotal] = useState(item.monto_total.toString());
  const [cuotas, setCuotas] = useState(item.cantidad_cuotas.toString());

  const handleEditar = async () => {
    if (!descripcion || !montoTotal || !cuotas) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      await api.put(`/cuotas/editar/${item._id}`, {
        descripcion,
        monto_total: parseFloat(montoTotal),
        cantidad_cuotas: parseInt(cuotas),
      });
      Alert.alert("Éxito", "Cuota actualizada");
      navigation.goBack(); // Volver a la lista
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo editar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Cuota ✏️</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Producto / Descripción</Text>
        <TextInput 
            style={styles.input} 
            value={descripcion} 
            onChangeText={setDescripcion} 
        />

        <Text style={styles.label}>Monto TOTAL de la compra</Text>
        <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={montoTotal} 
            onChangeText={setMontoTotal} 
        />

        <Text style={styles.label}>Cantidad de Cuotas</Text>
        <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={cuotas} 
            onChangeText={setCuotas} 
        />

        <TouchableOpacity style={styles.btn} onPress={handleEditar}>
            <Text style={styles.btnText}>Guardar Cambios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()}>
            <Text style={styles.btnTextCancel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign:'center', marginTop: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 3 },
  label: { fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  btn: { backgroundColor: '#6200ee', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnCancel: { backgroundColor: '#ddd', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTextCancel: { color: '#333', fontWeight: 'bold' }
});