import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import  api  from '../api/axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const EditSuscripcionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Recibimos los datos de la suscripción que vamos a editar
  const { item }: any = route.params;

  const [nombre, setNombre] = useState(item.nombre_servicio);
  const [costo, setCosto] = useState(item.costo.toString());
  
  // Inicializamos la fecha con la que viene de la BD
  const [date, setDate] = useState(new Date(item.fecha_cobro));
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/suscripciones/editar/${item.id}`, {
        nombre_servicio: nombre,
        costo: parseFloat(costo),
        fecha_cobro: date.toISOString().split('T')[0]
      });
      
      Alert.alert("Éxito", "Suscripción actualizada correctamente");
      navigation.goBack(); // Volver a la lista
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Suscripción ✏️</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Costo</Text>
        <TextInput style={styles.input} value={costo} keyboardType="numeric" onChangeText={setCosto} />

        <Text style={styles.label}>Fecha de cobro</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {showPicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />
        )}

        <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
            <Text style={styles.btnText}>Guardar Cambios</Text>
        </TouchableOpacity>
        
        {/* Botón cancelar */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', marginTop: 10 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 3 },
  label: { fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  dateButton: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 20, backgroundColor: '#f9f9f9', alignItems: 'center' },
  dateText: { fontSize: 16, color: '#333' },
  btn: { backgroundColor: '#6200ee', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
  cancelText: { color: '#666', fontWeight: '600' }
});