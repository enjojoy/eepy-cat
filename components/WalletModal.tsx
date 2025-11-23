import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRecording } from '../app/context/RecordingContext';

const WalletModal = () => {
  const { showWalletModal, setShowWalletModal, walletAddress, setWalletAddress, saveWalletAddress } = useRecording();

  const handleSave = () => {
    saveWalletAddress(walletAddress);
    setShowWalletModal(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showWalletModal}
      onRequestClose={() => setShowWalletModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Enter your wallet address:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setWalletAddress}
            value={walletAddress}
            placeholder="e.g., vitalik.eth or 0xAb5801..."
          />
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.textStyle}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 5,
  },
});

export default WalletModal;
