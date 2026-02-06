// src/screens/SuscripcionesScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import  api  from '../api/axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Suscripcion {
  id: number;
  nombre_servicio: string;
  costo: string;
  fecha_cobro: string;
}

export const SuscripcionesScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Suscripcion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    try {
      const res = await api.get('/suscripciones/listar');
      setItems(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const handleDelete = (id: number) => {
    Alert.alert(
      "Dar de baja",
      "¿Seguro que quieres eliminar esta suscripción? No podrás deshacerlo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/suscripciones/eliminar/${id}`);
              cargar(); // Recargar lista
            } catch (e) { Alert.alert("Error al eliminar"); }
          }
        }
      ]
    );
  };

  const pagar = async (id: number, metodo: string) => {
    try {
      await api.put(`/suscripciones/pagar/${id}`, { metodo_pago: metodo });
      Alert.alert("Pagado", "Se descontó el saldo y se movió la fecha al próximo mes.");
      cargar();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Error");
    }
  };

  const handlePressPagar = (item: Suscripcion) => {
    Alert.alert(
      "Pagar Mes",
      `¿Pagar $${item.costo} de ${item.nombre_servicio}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "💵 Efectivo", onPress: () => pagar(item.id, 'efectivo') },
        { text: "💳 Virtual", onPress: () => pagar(item.id, 'virtual') }
      ]
    );
  };

  // Calcular días restantes
  const getDiasRestantes = (fecha: string) => {
    const hoy = new Date();
    const cobro = new Date(fecha);
    const diffTime = cobro.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vencido hace " + Math.abs(diffDays) + " días";
    if (diffDays === 0) return "¡Se cobra hoy!";
    return "Faltan " + diffDays + " días";
  };

  const renderItem = ({ item }: { item: Suscripcion }) => (
    <View style={styles.card}>
      {/* Cabecera de la tarjeta con nombre y acciones */}
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.nombre_servicio}</Text>

        <View style={styles.actions}>
          {/* Botón Editar */}
          <TouchableOpacity
            onPress={() => navigation.navigate('EditSuscripcion', { item })}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#666" />
          </TouchableOpacity>

          {/* Botón Eliminar */}
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={[styles.iconBtn, { marginLeft: 10 }]}
          >
            <MaterialCommunityIcons name="trash-can" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.date}>
          Cobro: {new Date(item.fecha_cobro).toLocaleDateString()}
          {'\n'}({getDiasRestantes(item.fecha_cobro)})
        </Text>
        <Text style={styles.price}>${item.costo}</Text>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={() => handlePressPagar(item)}>
        <Text style={styles.payText}>Registrar Pago Mensual</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddSuscripcion')}>
        <Text style={styles.addText}>+ Nueva Suscripción</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#FF9800" /> : (
        <FlatList
          data={items}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999' }}>No tienes suscripciones activas</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  addBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  addText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold' },
  date: { color: '#666', fontSize: 13 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#FF9800' },
  payBtn: { backgroundColor: '#FF9800', padding: 10, borderRadius: 5, alignItems: 'center' },
  payText: { color: 'white', fontWeight: 'bold' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8
  },
  actions: { flexDirection: 'row' },
  iconBtn: { padding: 5 },
});