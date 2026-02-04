// src/screens/AddGastoScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import { api } from '../api/axios';
import { useNavigation } from '@react-navigation/native';

export const AddGastoScreen = () => {
    const navigation = useNavigation();

    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    // const [categoria, setCategoria] = useState('');
    const [loading, setLoading] = useState(false);

    const [metodo, setMetodo] = useState<'efectivo' | 'virtual'>('efectivo');

    const handleGuardar = async () => {
        // 1. Validaciones
        if (!descripcion || !monto) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            // 2. Enviar al Backend
            await api.post('/gastos/unico', {
                descripcion,
                monto: parseFloat(monto), // Convertir texto a número
                // categoria,
                fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD (Hoy),
                metodo_pago: metodo // 'efectivo' o 'virtual'
            });

            Alert.alert('Éxito', 'Gasto guardado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() } // Volver al Home al terminar
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo guardar el gasto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nuevo Gasto 💸</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Cena, Gasolina, Cine"
                    value={descripcion}
                    onChangeText={setDescripcion}
                />

                <Text style={styles.label}>Monto ($)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={monto}
                    onChangeText={setMonto}
                    keyboardType="numeric" // Teclado numérico
                />

                {/* <Text style={styles.label}>Categoría</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Comida, Transporte"
                    value={categoria}
                    onChangeText={setCategoria}
                /> */}

                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <TouchableOpacity
                        onPress={() => setMetodo('efectivo')}
                        style={[styles.radioBtn, metodo === 'efectivo' && styles.radioSelected]}
                    >
                        <Text style={metodo === 'efectivo' ? { color: 'white' } : { color: 'black' }}>💵 Efectivo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setMetodo('virtual')}
                        style={[styles.radioBtn, metodo === 'virtual' && styles.radioSelected, { marginLeft: 10 }]}
                    >
                        <Text style={metodo === 'virtual' ? { color: 'white' } : { color: 'black' }}>💳 Virtual</Text>
                    </TouchableOpacity>
                </View>


                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGuardar}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Guardar Gasto</Text>
                    )}
                </TouchableOpacity>

                {/* Botón cancelar */}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#ccc', marginTop: 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
        marginTop: 20
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#555',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#28a745', // Verde dinero
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    radioBtn: {
        flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center'
    },
    radioSelected: {
        backgroundColor: '#333', borderColor: '#333'
    }
});