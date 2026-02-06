// src/screens/HomeScreen.tsx
import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    RefreshControl
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WalletHeader } from '../components/WalletHeader';
import { AddMoneyModal } from '../components/AddMoneyModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// CORRECCIÓN 1: Adaptar la interfaz a MongoDB
interface Gasto {
    _id: string;          // MongoDB usa _id (guion bajo) y es String
    descripcion: string;
    monto: number;        // En la BD es numérico
    fecha: string;
    tipo: "efectivo" | "virtual"; // En el Modelo lo llamamos 'tipo', no 'metodo_pago'
}

export const HomeScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [searchTerm, setSearchTerm] = useState('');
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [saldos, setSaldos] = useState({ saldo_efectivo: 0, saldo_virtual: 0 });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const cargarDatos = async () => {
        try {
            const [resGastos, resSaldo] = await Promise.all([
                api.get('/gastos/listar', {
                    params: { search: searchTerm }
                }),
                api.get('/wallet/saldo')
            ]);
            // El backend devuelve { count: n, gastos: [...] }
            setGastos(resGastos.data.gastos);
            setSaldos(resSaldo.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!refreshing) setLoading(true);
            cargarDatos().finally(() => setLoading(false));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };

    const handleIngresoConfirmado = async (monto: number, tipo: 'efectivo' | 'virtual') => {
        try {
            await api.post('/wallet/cargar', { monto, tipo });
            await cargarDatos();
        } catch (error) {
            console.error("Error cargando saldo", error);
            alert("Error al cargar saldo");
        }
    };

    // CORRECCIÓN 2: Recibimos string (_id) y number (monto)
    const handleDelete = (id: string, monto: number) => {
        Alert.alert(
            "Eliminar Gasto",
            `¿Borrar este gasto de $${monto}? El dinero volverá a tu saldo.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Usamos el ID correcto en la URL
                            await api.delete(`/gastos/eliminar/${id}`);
                            await cargarDatos();
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "No se pudo eliminar el gasto");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Gasto }) => {
        // CORRECCIÓN 3: Usamos 'item.tipo' en lugar de 'metodo_pago'
        const isVirtual = item.tipo === 'virtual';

        return (
            <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc}>{item.descripcion}</Text>
                    <Text style={styles.itemCat}>{new Date(item.fecha).toLocaleDateString()}</Text>

                    <View style={[
                        styles.badge,
                        isVirtual ? styles.badgeVirtual : styles.badgeEfectivo
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            isVirtual ? styles.textVirtual : styles.textEfectivo
                        ]}>
                            {isVirtual ? '💳 Virtual' : '💵 Efectivo'}
                        </Text>
                    </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                    {/* Convertimos el número a string fijo con 2 decimales */}
                    <Text style={styles.itemMonto}>${item.monto.toFixed(2)}</Text>

                    <TouchableOpacity
                        // CORRECCIÓN 4: Pasamos _id
                        onPress={() => handleDelete(item._id, item.monto)}
                        style={{ marginTop: 10, padding: 5 }}
                    >
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
                // CORRECCIÓN 5: Key extractor usa _id
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6200ee']}
                        tintColor={'#6200ee'}
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.welcomeText}>Hola, {user?.nombre}</Text>
                            <TouchableOpacity onPress={logout}>
                                <Text style={styles.logoutText}>Salir</Text>
                            </TouchableOpacity>
                        </View>

                        <WalletHeader
                            efectivo={saldos.saldo_efectivo}
                            virtual={saldos.saldo_virtual}
                            onAddMoney={() => setModalVisible(true)}
                        />

                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                            <TouchableOpacity
                                style={styles.navButtonPrimary}
                                onPress={() => navigation.navigate('MisCuotas')}
                            >
                                <Text style={styles.navButtonText}>Cuotas</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.navButtonSecondary}
                                onPress={() => navigation.navigate('MisSuscripciones')}
                            >
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
                ListEmptyComponent={
                    !loading ? <Text style={styles.emptyText}>No hay gastos registrados aún.</Text> : null
                }
            />

            <AddMoneyModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handleIngresoConfirmado}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AgregarGasto')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        paddingHorizontal: 20,
        paddingTop: 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    logoutText: {
        color: 'red',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
    },
    itemCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    itemDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    itemCat: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    itemMonto: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#007AFF',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    fabText: {
        color: 'white',
        fontSize: 30,
        marginTop: -2,
    },
    searchInput: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
    },
    navButtonPrimary: {
        backgroundColor: '#6200ee',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginRight: 5
    },
    navButtonSecondary: {
        backgroundColor: '#FF9800',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginLeft: 5
    },
    navButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        borderWidth: 1,
    },
    badgeVirtual: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    textVirtual: {
        color: '#1565c0',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    badgeEfectivo: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50',
    },
    textEfectivo: {
        color: '#2e7d32',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
});