// src/components/AddMoneyModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (nuevoEfectivo: string, nuevoVirtual: string) => Promise<void>;
  saldoActual: { efectivo: number; virtual: number };
}

export const AddMoneyModal = ({ visible, onClose, onConfirm, saldoActual }: Props) => {
  // Guardamos los valores como TEXTO (string) para manejar los puntos
  const [efectivo, setEfectivo] = useState('');
  const [virtual, setVirtual] = useState('');
  const [loading, setLoading] = useState(false);

  // --- HERRAMIENTAS DE FORMATO ---

  // 1. Pone los puntos visuales (Ej: "1000" -> "1.000")
  const formatWithDots = (val: string) => {
    if (!val) return '';
    // Quitamos cualquier cosa que no sea número o coma
    let clean = val.replace(/[^0-9,]/g, ''); 
    
    // Separamos enteros de decimales (si usas coma)
    const parts = clean.split(',');
    
    // Agregamos puntos de mil a la parte entera
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Unimos de nuevo (solo permitimos una coma)
    return parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0];
  };

  // 2. Limpia los puntos para guardar en la base de datos (Ej: "1.000" -> "1000")
  const cleanNumber = (val: string) => {
    // Reemplaza puntos por nada y coma por punto (para que JS lo entienda como número)
    return val.replace(/\./g, '').replace(',', '.');
  };

  // --- FIN HERRAMIENTAS ---

  useEffect(() => {
    if (visible) {
      // Al abrir, mostramos el valor actual formateado
      // Usamos replace para asegurar que el decimal sea coma visualmente
      setEfectivo(formatWithDots(saldoActual.efectivo.toString().replace('.', ',')));
      setVirtual(formatWithDots(saldoActual.virtual.toString().replace('.', ',')));
    }
  }, [visible, saldoActual]);

  const handleConfirm = async () => {
    setLoading(true);
    // Enviamos los valores LIMPIOS al backend
    await onConfirm(cleanNumber(efectivo), cleanNumber(virtual));
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>💰 Gestionar Mi Dinero</Text>
          <Text style={styles.subtitle}>Actualiza los montos reales que tienes.</Text>

          {/* INPUT EFECTIVO */}
          <Text style={styles.label}>💵 Efectivo en mano:</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric" // Teclado numérico
            value={efectivo}
            // Al escribir, aplicamos el formato visual instantáneamente
            onChangeText={(text) => setEfectivo(formatWithDots(text))}
          />

          {/* INPUT VIRTUAL */}
          <Text style={styles.label}>💳 Dinero en Banco/Apps:</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={virtual}
            onChangeText={(text) => setVirtual(formatWithDots(text))}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={handleConfirm}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.confirmText}>Actualizar Saldos</Text>
                )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24, // Hice la letra más grande para leer mejor los números
    fontWeight: 'bold', // Y negrita
    textAlign: 'center', // Y centrado, queda más estilo "banco"
    marginBottom: 20,
    color: '#333'
  },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
  cancelText: { color: 'red', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#6200ee', paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  confirmText: { color: 'white', fontWeight: 'bold' }
});