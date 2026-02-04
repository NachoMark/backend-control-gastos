import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    efectivo: number;
    virtual: number;
    onAddMoney: () => void;
}

export const WalletHeader = ({ efectivo, virtual, onAddMoney }: Props) => {
  return (
    <View style={styles.container}>
        <View style={styles.card}>
            <Text style={styles.label}>💵 Efectivo</Text>
            <Text style={styles.amount}>${efectivo || '0'}</Text>
        </View>
        
        <View style={styles.separator} />

        <View style={styles.card}>
            <Text style={styles.label}>💳 Virtual</Text>
            <Text style={styles.amount}>${virtual || '0'}</Text>
        </View>

        <TouchableOpacity onPress={onAddMoney} style={styles.btn}>
            <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#333',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    card: { flex: 1 },
    label: { color: '#ccc', fontSize: 12, marginBottom: 4 },
    amount: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    separator: { width: 1, height: '80%', backgroundColor: '#555', marginHorizontal: 15 },
    btn: { backgroundColor: '#28a745', width: 35, height: 35, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: -2 }
});