// src/components/AddMoneyModal.tsx
import React, { useState } from 'react';
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
  onConfirm: (monto: number, tipo: 'efectivo' | 'virtual') => Promise<void>;
}

export const AddMoneyModal = ({ visible, onClose, onConfirm }: Props) => {
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'efectivo' | 'virtual'>('efectivo');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!monto) return;
    
    setLoading(true);
    await onConfirm(parseFloat(monto), tipo);
    setLoading(false);
    
    // Limpiamos el formulario al cerrar
    setMonto('');
    setTipo('efectivo');
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
          <Text style={styles.modalTitle}>Ingresar Dinero 💰</Text>

          <Text style={styles.label}>¿Cuánto dinero vas a ingresar?</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={monto}
            onChangeText={setMonto}
            autoFocus={true} // El teclado sale automático
          />

          <Text style={styles.label}>¿A dónde va el dinero?</Text>
          <View style={styles.switchContainer}>
            <TouchableOpacity 
                style={[styles.optionBtn, tipo === 'efectivo' && styles.selectedOption]}
                onPress={() => setTipo('efectivo')}
            >
                <Text style={[styles.optionText, tipo === 'efectivo' && styles.selectedText]}>💵 Efectivo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.optionBtn, tipo === 'virtual' && styles.selectedOption]}
                onPress={() => setTipo('virtual')}
            >
                <Text style={[styles.optionText, tipo === 'virtual' && styles.selectedText]}>💳 Virtual</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={handleConfirm}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.confirmText}>Guardar</Text>}
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
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo oscuro transparente
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginBottom: 10 },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 25,
    color: '#333'
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
    marginBottom: 25
  },
  optionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  selectedOption: { backgroundColor: 'white', elevation: 2 },
  optionText: { color: '#666', fontWeight: '600' },
  selectedText: { color: '#000', fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 15 },
  cancelText: { color: 'red', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#6200ee', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  confirmText: { color: 'white', fontWeight: 'bold' }
});