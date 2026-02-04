// src/screens/CuotasScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api/axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

interface Cuota {
  id: number;
  descripcion: string;
  monto_total: string;
  cantidad_cuotas: number;
  cuotas_pagadas: number;
  valor_cuota: string;
}

export const CuotasScreen = () => {
  const navigation = useNavigation<any>(); // any para simplificar tipos de navegación rápida
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);

const pagar = async (id: number, metodo: string) => {
    try {
        await api.put(`/cuotas/pagar/${id}`, { metodo_pago: metodo });
        Alert.alert("Pagado", "Cuota descontada y agregada al Home");
        cargarCuotas();
    } catch (error: any) {
        Alert.alert("Error", error.response?.data?.error || "Falló el pago");
    }
};

  const cargarCuotas = async () => {
    try {
      const res = await api.get('/cuotas/listar');
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
      `Monto: $${item.valor_cuota}\n¿Cómo deseas pagar?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "💵 Efectivo", onPress: () => pagar(item.id, 'efectivo') },
        { text: "💳 Virtual", onPress: () => pagar(item.id, 'virtual') }
      ]
    );
};
  const renderItem = ({ item }: { item: Cuota }) => {
    // Calculamos porcentaje para una barrita de progreso visual (opcional)
    const progreso = item.cuotas_pagadas / item.cantidad_cuotas;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
            <Text style={styles.title}>{item.descripcion}</Text>
            <Text style={styles.monto}>${parseFloat(item.valor_cuota).toFixed(2)} / mes</Text>
        </View>
        
        {/* Barra de progreso */}
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progreso * 100}%` }]} />
        </View>
        
        <View style={styles.infoRow}>
            <Text style={styles.infoText}>Progreso: {item.cuotas_pagadas}/{item.cantidad_cuotas}</Text>
            <Text style={styles.infoText}>Restante: ${(parseFloat(item.monto_total) - (parseFloat(item.valor_cuota) * item.cuotas_pagadas)).toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={() => handlePagarCuota(item)}>
            <Text style={styles.payBtnText}>Pagar Cuota Mensual</Text>
        </TouchableOpacity>
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
          keyExtractor={item => item.id.toString()}
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
  payBtnText: { color: 'white', fontWeight: 'bold' }
});