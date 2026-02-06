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
    RefreshControl // Importante para deslizar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import  api  from '../api/axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WalletHeader } from '../components/WalletHeader';
import { AddMoneyModal } from '../components/AddMoneyModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Gasto {
    id: number;
    descripcion: string;
    monto: string;
    fecha: string;
    metodo_pago: "efectivo" | "virtual";
    // categoria: string; // Descomenta si usas categorías
}



export const HomeScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [searchTerm, setSearchTerm] = useState('');
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [saldos, setSaldos] = useState({ saldo_efectivo: 0, saldo_virtual: 0 });

    // Estados de carga
    const [loading, setLoading] = useState(true); // Carga inicial
    const [refreshing, setRefreshing] = useState(false); // Carga al deslizar

    const [modalVisible, setModalVisible] = useState(false);

    // --- FUNCIÓN PRINCIPAL DE CARGA (GASTOS + SALDO) ---
    const cargarDatos = async () => {
        try {
            const [resGastos, resSaldo] = await Promise.all([
                api.get('/gastos/listar', {
                    params: { search: searchTerm }
                }),
                api.get('/wallet/saldo')
            ]);
            setGastos(resGastos.data.gastos);
            setSaldos(resSaldo.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    // 1. Carga inicial y Buscador (Debounce)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Solo mostramos loading si es la primera vez o búsqueda, no en refresh
            if (!refreshing) setLoading(true);
            cargarDatos().finally(() => setLoading(false));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 2. SOLUCIÓN AL PROBLEMA: Actualizar al volver a la pantalla (Focus)
    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    // 3. Función para "Deslizar para actualizar"
    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };

    const handleIngresoConfirmado = async (monto: number, tipo: 'efectivo' | 'virtual') => {
        try {
            await api.post('/wallet/cargar', { monto, tipo });
            await cargarDatos(); // Actualizar saldo inmediatamente
        } catch (error) {
            console.error("Error cargando saldo", error);
            alert("Error al cargar saldo");
        }
    };

    const handleDelete = (id: number, monto: string) => {
        Alert.alert(
            "Eliminar Gasto",
            `¿Borrar este gasto de $${monto}? El dinero volverá a tu saldo.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive", // En iOS se pone rojo
                    onPress: async () => {
                        try {
                            await api.delete(`/gastos/eliminar/${id}`);
                            // Recargamos datos para ver el gasto borrado y el saldo actualizado
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
        const isVirtual = item.metodo_pago === 'virtual';

        return (
            <View style={styles.itemCard}>
                {/* LADO IZQUIERDO: Descripción y Fecha */}
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

                {/* LADO DERECHO: Precio y Botón Borrar */}
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemMonto}>${item.monto}</Text>

                    <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.monto)}
                        style={{ marginTop: 10, padding: 5 }} // Padding para que sea fácil de tocar
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#aaa" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Usamos FlatList como contenedor principal para que el scroll funcione en toda la pantalla */}
            <FlatList
                data={gastos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }} // Espacio extra abajo para el botón flotante

                // CONTROL DE REFRESCO (Pull to Refresh)
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6200ee']}
                        tintColor={'#6200ee'}
                    />
                }

                // CABECERA DE LA LISTA (Todo lo que va antes de los gastos)
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

                        {/* Si está cargando (y no es refresco manual), mostramos spinner */}
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

            {/* Botón Flotante (FAB) */}
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
        paddingHorizontal: 20, // Movemos el padding al contenedor, pero cuidado con el FlatList
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
    // Estilos optimizados para botones de navegación
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
        alignSelf: 'flex-start', // Para que no ocupe todo el ancho
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        borderWidth: 1,
    },

    // Estilos específicos para Virtual (Azul)
    badgeVirtual: {
        backgroundColor: '#e3f2fd', // Azul muy clarito
        borderColor: '#2196f3',
    },
    textVirtual: {
        color: '#1565c0', // Azul oscuro
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },

    // Estilos específicos para Efectivo (Verde)
    badgeEfectivo: {
        backgroundColor: '#e8f5e9', // Verde muy clarito
        borderColor: '#4caf50',
    },
    textEfectivo: {
        color: '#2e7d32', // Verde oscuro
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