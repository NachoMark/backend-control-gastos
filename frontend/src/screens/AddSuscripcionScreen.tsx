import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform 
} from 'react-native';
import  api  from '../api/axios';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const AddSuscripcionScreen = () => {
  const navigation = useNavigation();
  
  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState('');
  
  // Usamos un objeto Date real en lugar de texto
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Función que se ejecuta cuando el usuario selecciona una fecha
  const onChange = (event: any, selectedDate?: Date) => {
    // En Android hay que cerrar el modal manualmente
    setShowPicker(false);
    
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleGuardar = async () => {
    if (!nombre || !costo) {
        Alert.alert("Error", "Completa el nombre y el costo");
        return;
    }

    try {
        // Convertimos el objeto Date a string "YYYY-MM-DD" para la base de datos
        const fechaFormateada = date.toISOString().split('T')[0];

        await api.post('/suscripciones/crear', {
            nombre_servicio: nombre,
            costo: parseFloat(costo),
            fecha_cobro: fechaFormateada 
        });
        Alert.alert("Listo", "Suscripción agregada");
        navigation.goBack();
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo guardar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva Suscripción 📅</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Nombre del Servicio</Text>
        <TextInput 
            style={styles.input} 
            placeholder="Netflix, Spotify..." 
            value={nombre} 
            onChangeText={setNombre} 
        />

        <Text style={styles.label}>Costo Mensual</Text>
        <TextInput 
            style={styles.input} 
            placeholder="0.00" 
            keyboardType="numeric" 
            value={costo} 
            onChangeText={setCosto} 
        />

        <Text style={styles.label}>Próxima fecha de cobro</Text>
        
        {/* En lugar de TextInput, usamos un botón que muestra la fecha */}
        <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowPicker(true)}
        >
            <Text style={styles.dateText}>
                {/* Mostramos la fecha en formato local amigable (DD/MM/AAAA) */}
                {date.toLocaleDateString()} 
            </Text>
        </TouchableOpacity>

        {/* El componente del calendario (Invisible hasta que showPicker es true) */}
        {showPicker && (
            <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
                minimumDate={new Date()} // No permitir fechas pasadas
            />
        )}

        <TouchableOpacity style={styles.btn} onPress={handleGuardar}>
            <Text style={styles.btnText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign:'center', marginTop: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, shadowColor: '#000', elevation: 3 },
  label: { fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  
  // Estilos nuevos para el botón de fecha
  dateButton: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      backgroundColor: '#f9f9f9',
      alignItems: 'center'
  },
  dateText: {
      fontSize: 16,
      color: '#333'
  },
  
  btn: { backgroundColor: '#FF9800', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});