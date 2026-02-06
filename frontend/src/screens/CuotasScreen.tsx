// src/screens/CuotasScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api/axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// CORRECCIÓN 1: Ajustar la interfaz a lo que devuelve MongoDB
interface Cuota {
  _id: string;          // MongoDB usa _id, no id
  descripcion: string;
  monto_total: number;  // En Mongo guardamos Number
  cantidad_cuotas: number;
  cuotas_pagadas: number;
  monto_cuota: number;  // Tu modelo dice monto_cuota, no valor_cuota
}

export const CuotasScreen = () => {
  const navigation = useNavigation<any>();
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);

  // CORRECCIÓN 2: Usar _id en la función pagar
  const pagar = async (id: string, metodo: string) => {
    try {
        // Asegúrate de que tu ruta en backend sea /api/cuotas/pagar/:id
        await api.put(`/cuotas/pagar/${id}`, { metodo_pago: metodo }); 
        Alert.alert("Pagado", "Cuota descontada correctamente");
        cargarCuotas();
    } catch (error: any) {
        // Manejo de error mejorado para ver qué pasa
        const mensaje = error.response?.data?.error || "Error de conexión";
        Alert.alert("Error", mensaje);
    }
  };

  const cargarCuotas = async () => {
    try {
      // Asegúrate de que tu ruta en backend sea /api/cuotas
      // Si usaste router.get('/', ...) en cuotas.js, aquí es solo '/cuotas'
      const res = await api.get('/cuotas'); 
      setCuotas(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCuotas();
    }, [])
  );

  const handlePagarCuota = (item: Cuota) => {
    Alert.alert(
      "Pagar Cuota",
      `Monto: $${item.monto_cuota.toFixed(2)}\n¿Cómo deseas pagar?`,
      [
        { text: "Cancelar", style: "cancel" },
        // CORRECCIÓN 3: Pasar item._id
        { text: "💵 Efectivo", onPress: () => pagar(item._id, 'efectivo') },
        { text: "💳 Virtual", onPress: () => pagar(item._id, 'virtual') }
      ]
    );
  };

  const renderItem = ({ item }: { item: Cuota }) => {
    const progreso = item.cuotas_pagadas / item.cantidad_cuotas;
    // Calculamos el restante asegurándonos de que sean números
    const restante = item.monto_total - (item.monto_cuota * item.cuotas_pagadas);

    return (
      <View style={styles.card}>
        <View style={styles.header}>
            <Text style={styles.title}>{item.descripcion}</Text>
            {/* CORRECCIÓN 4: Usar item.monto_cuota */}
            <Text style={styles.monto}>${item.monto_cuota.toFixed(2)} / mes</Text>
        </View>
        
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progreso * 100}%` }]} />
        </View>
        
        <View style={styles.infoRow}>
            <Text style={styles.infoText}>Progreso: {item.cuotas_pagadas}/{item.cantidad_cuotas}</Text>
            <Text style={styles.infoText}>Restante: ${restante.toFixed(2)}</Text>
        </View>

        {/* Solo mostramos el botón si no ha terminado de pagar */}
        {item.cuotas_pagadas < item.cantidad_cuotas ? (
            <TouchableOpacity style={styles.payBtn} onPress={() => handlePagarCuota(item)}>
                <Text style={styles.payBtnText}>Pagar Cuota Mensual</Text>
            </TouchableOpacity>
        ) : (
            <View style={styles.pagadoBadge}>
                <Text style={styles.pagadoText}>¡PAGADO!</Text>
            </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addBtn} 
        onPress={() => navigation.navigate('AddCuota')}
      >
        <Text style={styles.addBtnText}>+ Nueva Compra a Cuotas</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={cuotas}
          // CORRECCIÓN 5: keyExtractor con _id
          keyExtractor={item => item._id} 
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: '#999'}}>No tienes compras activas.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  addBtn: { backgroundColor: '#000', padding: 15, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  monto: { fontSize: 16, fontWeight: '600', color: '#28a745' },
  progressBarBg: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6200ee' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoText: { fontSize: 14, color: '#666' },
  payBtn: { backgroundColor: '#6200ee', padding: 12, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: 'white', fontWeight: 'bold' },
  pagadoBadge: { backgroundColor: '#d4edda', padding: 10, borderRadius: 5, alignItems: 'center' },
  pagadoText: { color: '#155724', fontWeight: 'bold' }
});