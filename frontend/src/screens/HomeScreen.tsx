// src/screens/HomeScreen.tsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
    TextInput, Alert, RefreshControl
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WalletHeader } from '../components/WalletHeader';
import { AddMoneyModal } from '../components/AddMoneyModal'; // Solo importamos este
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/format';

// ... (Interface Gasto igual que antes) ...
interface Gasto {
    _id: string;
    descripcion: string;
    monto: number;
    fecha: string;
    tipo: "efectivo" | "virtual";
    categoria?: string;
}

export const HomeScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [searchTerm, setSearchTerm] = useState('');
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [saldos, setSaldos] = useState({ saldo_efectivo: 0, saldo_virtual: 0 });
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // UN SOLO MODAL AHORA
    const [moneyModalVisible, setMoneyModalVisible] = useState(false); 

    const cargarDatos = async () => {
        try {
            const [resGastos, resSaldo] = await Promise.all([
                api.get('/gastos/listar', { params: { search: searchTerm } }),
                api.get('/wallet/saldo')
            ]);
            setGastos(resGastos.data.gastos);
            setSaldos(resSaldo.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    // ... (useEffect y useFocusEffect iguales) ...
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!refreshing) setLoading(true);
            cargarDatos().finally(() => setLoading(false));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useFocusEffect(useCallback(() => { cargarDatos(); }, []));

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };

    // ESTA ES LA FUNCIÓN UNIFICADA (Actualiza saldos absolutos)
    const handleUpdateSaldos = async (nuevoEfectivo: string, nuevoVirtual: string) => {
        try {
            // Usamos la ruta de 'actualizar' (PUT) en vez de 'cargar' (POST)
            await api.put('/wallet/actualizar', {
                nuevo_efectivo: parseFloat(nuevoEfectivo) || 0,
                nuevo_virtual: parseFloat(nuevoVirtual) || 0
            });
            await cargarDatos();
            Alert.alert("Listo", "Saldos actualizados correctamente");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo actualizar el saldo");
        }
    };

    // ... (handleDelete igual que antes) ...
    const handleDelete = (id: string, monto: number) => {
        Alert.alert("Eliminar Gasto", `¿Borrar este gasto?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => {
                try { await api.delete(`/gastos/eliminar/${id}`); await cargarDatos(); } 
                catch (error) { Alert.alert("Error", "No se pudo eliminar"); }
            }}
        ]);
    };

    const renderItem = ({ item }: { item: Gasto }) => {
        const isVirtual = item.tipo === 'virtual';
        return (
            <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.descripcion}</Text>
                    <Text style={styles.itemCat}>
                        {item.categoria ? item.categoria.toUpperCase() : 'GENERAL'} • {new Date(item.fecha).toLocaleDateString()}
                    </Text>
                    <View style={[styles.badge, isVirtual ? styles.badgeVirtual : styles.badgeEfectivo]}>
                        <Text style={[styles.badgeText, isVirtual ? styles.textVirtual : styles.textEfectivo]}>
                            {isVirtual ? '💳 Virtual' : '💵 Efectivo'}
                        </Text>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemMonto}>{formatCurrency(item.monto)}</Text>
                    <TouchableOpacity onPress={() => handleDelete(item._id, item.monto)} style={{ marginTop: 10, padding: 5 }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#aaa" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={gastos}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>Hola, {user?.nombre}</Text>
                            <TouchableOpacity onPress={logout}>
                                <Text style={styles.logoutText}>Salir</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Mi Billetera</Text>

                        {/* EL HEADER DE DINERO */}
                        <WalletHeader
                            efectivo={saldos.saldo_efectivo}
                            virtual={saldos.saldo_virtual}
                            onAddMoney={() => setMoneyModalVisible(true)} // Abre el modal único
                        />

                        {/* BOTONES DE NAVEGACIÓN */}
                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                            <TouchableOpacity style={styles.navButtonPrimary} onPress={() => navigation.navigate('MisCuotas')}>
                                <Text style={styles.navButtonText}>Cuotas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.navButtonSecondary} onPress={() => navigation.navigate('MisSuscripciones')}>
                                <Text style={styles.navButtonText}>Suscripciones</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Mis Gastos</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Buscar gasto..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                        {loading && <ActivityIndicator size="large" color="#000" style={{ marginBottom: 20 }} />}
                    </>
                }
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No hay gastos registrados aún.</Text> : null}
            />

            {/* MODAL UNIFICADO */}
            <AddMoneyModal
                visible={moneyModalVisible}
                onClose={() => setMoneyModalVisible(false)}
                onConfirm={handleUpdateSaldos}
                saldoActual={{ efectivo: saldos.saldo_efectivo, virtual: saldos.saldo_virtual }}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AgregarGasto')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    // ... Tus estilos existentes ...
    // Copia los estilos del archivo anterior, son los mismos
    container: { flex: 1, backgroundColor: '#f2f2f2', paddingHorizontal: 20, paddingTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    welcomeText: { fontSize: 20, fontWeight: 'bold' },
    logoutText: { color: 'red', fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#555' },
    itemCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
    itemDesc: { fontSize: 16, fontWeight: '600', color: '#333' },
    itemCat: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: 'bold' },
    itemMonto: { fontSize: 18, fontWeight: 'bold', color: '#e74c3c' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
    fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    fabText: { color: 'white', fontSize: 30, marginTop: -2 },
    searchInput: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', elevation: 2 },
    navButtonPrimary: { backgroundColor: '#6200ee', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
    navButtonSecondary: { backgroundColor: '#FF9800', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 },
    navButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6, borderWidth: 1 },
    badgeVirtual: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
    textVirtual: { color: '#1565c0', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    badgeEfectivo: { backgroundColor: '#e8f5e9', borderColor: '#4caf50' },
    textEfectivo: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
});