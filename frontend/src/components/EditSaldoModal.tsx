// src/components/EditSaldoModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (efectivo: string, virtual: string) => Promise<void>;
  saldoActual: { efectivo: number; virtual: number }; // Para mostrar lo que hay ahora
}

export const EditSaldoModal = ({ visible, onClose, onConfirm, saldoActual }: Props) => {
  const [efectivo, setEfectivo] = useState('');
  const [virtual, setVirtual] = useState('');
  const [loading, setLoading] = useState(false);

  // Cuando se abre el modal, rellenamos con los datos actuales
  useEffect(() => {
    if (visible) {
      setEfectivo(saldoActual.efectivo.toString());
      setVirtual(saldoActual.virtual.toString());
    }
  }, [visible, saldoActual]);

  const handleSave = async () => {
    setLoading(true);
    await onConfirm(efectivo, virtual);
    setLoading(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🔧 Corregir Saldos</Text>
          <Text style={styles.subtitle}>Ingresa el monto real que tienes actualmente.</Text>

          <Text style={styles.label}>Efectivo Actual:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={efectivo}
            onChangeText={setEfectivo}
          />

          <Text style={styles.label}>Dinero Virtual Actual:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={virtual}
            onChangeText={setVirtual}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.textCancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnConfirm} onPress={handleSave}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.textConfirm}>Actualizar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 15, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancel: { flex: 1, padding: 12, marginRight: 10, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center' },
  btnConfirm: { flex: 1, padding: 12, marginLeft: 10, backgroundColor: '#6200ee', borderRadius: 8, alignItems: 'center' },
  textCancel: { fontWeight: 'bold', color: '#333' },
  textConfirm: { fontWeight: 'bold', color: 'white' },
});