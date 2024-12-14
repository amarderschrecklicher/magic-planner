import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const SideButtons = ({ onChatPress, onSOSPress }: { onChatPress: any; onSOSPress: any }) => {
  return (
    <View style={styles.container}>
      {/* Chat button */}
      <TouchableOpacity style={[styles.button, { backgroundColor: '#4CAF50' }]} onPress={onChatPress}>
        <Ionicons name="chatbox-outline" size={windowWidth * 0.08} color="white" />
      </TouchableOpacity>
      {/* SOS button */}
      <TouchableOpacity style={[styles.button, { backgroundColor: '#FF5733' }]} onPress={onSOSPress}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: windowHeight * 0.03,
    right: windowWidth * 0.05,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 999,
    marginBottom: 50
  },
  button: {
    width: windowWidth * 0.15,
    height: windowWidth * 0.15,
    borderRadius: windowWidth * 0.071,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sosText: {
    fontSize: windowWidth * 0.05,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SideButtons;