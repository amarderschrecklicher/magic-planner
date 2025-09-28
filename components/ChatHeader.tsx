import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ChatHeader = ({ title }: {title:string}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
    <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
    >
  <View style={styles.backButtonContainer}>
    <AntDesign name="arrowleft" size={24} color="black" />
    <Text style={styles.backButtonText}>Back</Text>
  </View>
</TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingTop: Platform.OS === 'ios' ? screenHeight * 0.04 : screenHeight * 0.03,
      paddingBottom: screenHeight * 0.01,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      height: Platform.OS === 'ios' ? screenHeight * 0.08 : screenHeight * 0.1,
    },
    backButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
    },
    backButton: {
      marginRight: 8,
    },
    backButtonText: {
      fontSize: screenWidth * 0.04,
      fontWeight: 'bold',
      color: 'black',
    },
    title: {
      fontSize: screenWidth * 0.05,
      fontWeight: 'bold',
      textAlign: 'center',
      flex: 1,
    },
  });


export default ChatHeader;
