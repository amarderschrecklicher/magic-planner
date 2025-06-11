import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Linking,
  SafeAreaView,
  SectionList,
  RefreshControl,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { database } from "../../modules/firebase";
import { Video } from 'expo-av';
import {
  fetchAccount,
  fetchSettings,
  SettingsData
} from "../../modules/fetchingData";
import LoadingAnimation from '../../components/LoadingAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import UnifiedHeader from '@/components/UnifiedHeader';
import { BACKGROUND_GRADIENT } from '../../constants/Colors';
import { useUser } from '@/modules/UserContext';

const MaterialsScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(null);
  const router = useRouter();
  const { accountID, email } = useUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const materialsCollection = collection(database, 'materials');
      const materialsSnapshot = await getDocs(materialsCollection);
      const materialsList = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMaterials(materialsList);

      const settingsData = await fetchSettings(accountID);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to fetch materials');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const openMaterial = (material) => {
    if (material.contentType === 'application/pdf') {
      Linking.openURL(material.downloadURL);
    } else {
      setSelectedMaterial(material);
      setModalVisible(true);
    }
  };

  const renderImageOrVideo = ({ item }) => (
    <TouchableOpacity style={styles.materialBox} onPress={() => openMaterial(item)}>
      {item.contentType.startsWith('image/') && (
        <View style={styles.nameContainer}>
          <Image source={{ uri: item.downloadURL }} style={styles.materialImage} />
          <Text style={styles.materialName}>
            {item.name}
          </Text>
        </View>
      )}
      {item.contentType.startsWith('video/') && (
        <View style={styles.nameContainer}>
          <Video
            source={{ uri: item.downloadURL }}
            style={styles.video}
            useNativeControls
          />
          <Text style={styles.materialName}>
            {item.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPDF = ({ item }) => (
    <TouchableOpacity style={[styles.materialBox,]} onPress={() => openMaterial(item)}>
      <View style={[styles.nameContainer, { minWidth: 230 }]}>
        <Ionicons name="book" size={150} color="#D32F2F" style={{ alignSelf: "center" }}></Ionicons>
        <Text style={styles.materialName}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );


  if (!settings) {
    return <LoadingAnimation />;
  }

  const imageMaterials = materials.filter(material => material.contentType.startsWith('image/'));
  const videoMaterials = materials.filter(material => material.contentType.startsWith('video/'));
  const pdfMaterials = materials.filter(material => material.contentType === 'application/pdf');

  return (
<LinearGradient
  colors={BACKGROUND_GRADIENT}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={{ flex: 1 }}
>

      <SafeAreaView style={{ flex: 1 }}>
        <UnifiedHeader
           settings={settings}
            title="Materijali"
        />


        <FlatList
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={() => (
<>
  <Text style={[styles.sectionHeader, { fontSize: settings.fontSize + 6, fontFamily: settings.font }]}>
    Instrukcije
  </Text>

  {imageMaterials.length > 0 && (
    <>
      <Text style={[styles.subsectionTitle, { fontSize: settings.fontSize + 1, fontFamily: settings.font }]}>
        Slike
      </Text>
      <FlatList
        data={imageMaterials}
        renderItem={renderImageOrVideo}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </>
  )}

  {videoMaterials.length > 0 && (
    <>
      <Text style={[styles.subsectionTitle, { fontSize: settings.fontSize + 1, fontFamily: settings.font }]}>
        Videozapisi
      </Text>
      <FlatList
        data={videoMaterials}
        renderItem={renderImageOrVideo}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </>
  )}

  {pdfMaterials.length > 0 && (
    <>
      <Text style={[styles.subsectionTitle, { fontSize: settings.fontSize + 1, fontFamily: settings.font }]}>
        PDF dokumenti
      </Text>
      <FlatList
        data={pdfMaterials}
        renderItem={renderPDF}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      />
    </>
  )}
</>

          )}
          data={[]}
          renderItem={null}
          keyExtractor={() => null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />

        <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>&times;</Text>
            </TouchableOpacity>
            {selectedMaterial && (
              <View style={styles.modalContent}>
                {selectedMaterial.contentType.startsWith('image/') && (
                  <Image source={{ uri: selectedMaterial.downloadURL }} style={styles.modalImage} />
                )}
                {selectedMaterial.contentType.startsWith('video/') && (
                  <Video source={{ uri: selectedMaterial.downloadURL }} style={styles.modalImage} useNativeControls />
                )}
                {selectedMaterial.contentType === 'application/pdf' && (
                  <TouchableOpacity onPress={() => Linking.openURL(selectedMaterial.downloadURL)}>
                    <Text style={styles.pdfLink}>{selectedMaterial.name}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  materialBox: {
    marginBottom: 15,
    alignItems: 'center',
    padding: 15,
  },
  sectionHeader: {
  fontSize: 24,
  fontWeight: '700',
  marginTop: 20,
  marginBottom: 10,
  marginLeft: 20,
  color: '#2c3e50',
},
subsectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 10,
  marginTop: 15,
  marginLeft: 20,
  color: '#333',
},
horizontalList: {
  paddingHorizontal: 15,
  paddingBottom: 10,
},

  materialImage: {
    width: '100%',
    height: 150,
    aspectRatio: 16 / 9,
    marginHorizontal: 10,
    padding: 20,

  },
  pdfLink: {
    marginTop: 5,
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 25,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 213, 213, 0.8)',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 30,
    color: 'white',
    marginTop: 50
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    height: '65%',
    aspectRatio: 1,
    borderRadius: 10,
    marginHorizontal: 5,
    resizeMode: 'contain',
  },
  video: {
    width: '50%',
    height: 150,
    aspectRatio: 16 / 9,
    marginHorizontal: 10,
    marginTop: 10
  },
  nameContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 200,
    justifyContent: "space-between",
  },
  materialName: {
    marginBottom: 10, // Space between image and name
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  }
});

export default MaterialsScreen;