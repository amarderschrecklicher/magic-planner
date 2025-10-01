import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { database } from "../../modules/firebase";
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  fetchSettings,
} from "../../modules/fetchingData";
import LoadingAnimation from '../../components/LoadingAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import UnifiedHeader from '@/components/UnifiedHeader';
import { BACKGROUND_GRADIENT } from '../../constants/Colors';
import { useUser } from '@/modules/UserContext';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { File } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const MATERIALS_CACHE_KEY = 'materials_cache';
const MATERIALS_TIMESTAMP_KEY = 'materials_timestamp';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Material {
  id: string;
  name: string;
  contentType: string;
  downloadURL: string;
  localUri?: string;
}

const InstructionsScreen = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const router = useRouter();
  const { accountID } = useUser();

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Fetch settings
      const settingsData = await fetchSettings(accountID);
      setSettings(settingsData);

      // Check if we have cached data
      const cachedData = await AsyncStorage.getItem(MATERIALS_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(MATERIALS_TIMESTAMP_KEY);

      if (cachedData && timestamp) {
        // Use cached data
        const parsedMaterials = JSON.parse(cachedData);
        setMaterials(parsedMaterials);
        setIsInitialLoad(false);
        
        // Verify local files still exist
        verifyLocalFiles(parsedMaterials);
      } else {
        // Fetch from Firebase
        await fetchAndCacheMaterials();
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      Alert.alert('Error', 'Failed to load materials');
    }
  };

  const fetchAndCacheMaterials = async () => {
    try {
      const materialsCollection = collection(database, 'materials');
      const materialsSnapshot = await getDocs(materialsCollection);
      const materialsList = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Material[];

      // Download all materials locally
      const materialsWithLocalUri = await downloadMaterialsLocally(materialsList);
      
      // Cache the data
      await AsyncStorage.setItem(MATERIALS_CACHE_KEY, JSON.stringify(materialsWithLocalUri));
      await AsyncStorage.setItem(MATERIALS_TIMESTAMP_KEY, Date.now().toString());
      
      setMaterials(materialsWithLocalUri);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to fetch materials');
    }
  };

  const downloadMaterialsLocally = async (materialsList: Material[]) => {
    const downloadedMaterials = await Promise.all(
      materialsList.map(async (material) => {
        try {
          const fileExtension = getFileExtension(material.contentType, material.name);
          const fileName = `${material.id}${fileExtension}`;
          const localUri = `${FileSystem.documentDirectory}${fileName}`;

          // Create File instance
          const file = new File(localUri);

          // Check if file already exists - exists() is synchronous and returns boolean
          const exists = file.exists();
          
          if (!exists) {
            // Download the file
            await file.downloadAsync(material.downloadURL);
            console.log(`Downloaded: ${material.name}`);
          }

          return {
            ...material,
            localUri,
          };
        } catch (error) {
          console.error(`Error downloading ${material.name}:`, error);
          return material; // Return without localUri if download fails
        }
      })
    );

    return downloadedMaterials;
  };

  const verifyLocalFiles = async (materialsList: Material[]) => {
    // Check if local files still exist, re-download if needed
    const verified = await Promise.all(
      materialsList.map(async (material) => {
        if (material.localUri) {
          try {
            const file = new File(material.localUri);
            const exists = await file.exists();
            
            if (!exists) {
              // Re-download if file is missing
              const fileExtension = getFileExtension(material.contentType, material.name);
              const fileName = `${material.id}${fileExtension}`;
              const localUri = `${FileSystem.documentDirectory}${fileName}`;
              
              const newFile = new File(localUri);
              await newFile.downloadAsync(material.downloadURL);
              return { ...material, localUri };
            }
          } catch (error) {
            console.error(`Error verifying ${material.name}:`, error);
          }
        }
        return material;
      })
    );

    setMaterials(verified);
    await AsyncStorage.setItem(MATERIALS_CACHE_KEY, JSON.stringify(verified));
  };

  const getFileExtension = (contentType: string, name: string) => {
    // Try to get extension from name first
    const nameExtension = name.match(/\.[^.]+$/)?.[0];
    if (nameExtension) return nameExtension;

    // Fallback to content type
    const typeMap: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
    };
    return typeMap[contentType] || '';
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAndCacheMaterials();
    setRefreshing(false);
  }, []);

  const openMaterialViewer = (material: Material) => {
    setSelectedMaterial(material);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setSelectedMaterial(null);
  };

  const VideoThumbnail = ({ uri }: { uri: string }) => {
    const player = useVideoPlayer(uri, player => {
      player.pause();
    });

    return (
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    );
  };

  const ImageViewer = ({ uri }: { uri: string }) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = savedScale.value * event.scale;
      })
      .onEnd(() => {
        if (scale.value < 1) {
          scale.value = withSpring(1);
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          savedScale.value = 1;
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        } else {
          savedScale.value = scale.value;
        }
      });

    const panGesture = Gesture.Pan()
      .onUpdate((event) => {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Image
            source={{ uri }}
            style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    );
  };

  const VideoPlayer = ({ uri }: { uri: string }) => {
    const player = useVideoPlayer(uri, player => {
      player.play();
    });

    return (
      <VideoView
        style={styles.fullscreenVideo}
        player={player}
        nativeControls={true}
        contentFit="contain"
        allowsPictureInPicture
      />
    );
  };

  const PDFViewer = ({ uri }: { uri: string }) => {
    const insets = useSafeAreaInsets();
    // For PDF, we need to use Google Docs Viewer or similar
    const pdfUrl = uri.startsWith('http') ? uri : `file://${uri}`;
    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri.startsWith('http') ? uri : selectedMaterial?.downloadURL || '')}`;

    return (
      <View style={{ flex: 1, paddingTop: insets.top + 60 }}>
        <WebView
          source={{ uri: viewerUrl }}
          style={{ flex: 1 }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <LoadingAnimation />
            </View>
          )}
        />
      </View>
    );
  };

  const MaterialViewer = () => {
    const insets = useSafeAreaInsets();
    
    if (!selectedMaterial) return null;

    const uri = selectedMaterial.localUri || selectedMaterial.downloadURL;

    return (
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <StatusBar hidden />
        <GestureHandlerRootView style={styles.viewerContainer}>
          <View style={[styles.viewerHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity 
              onPress={closeViewer} 
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={32} color="white" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedMaterial.name}
            </Text>
          </View>

          <View style={styles.viewerContent}>
            {selectedMaterial.contentType.startsWith('image/') && (
              <ImageViewer uri={uri} />
            )}
            {selectedMaterial.contentType.startsWith('video/') && (
              <VideoPlayer uri={uri} />
            )}
            {selectedMaterial.contentType === 'application/pdf' && (
              <PDFViewer uri={uri} />
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
  };

  const renderImageOrVideo = ({ item }: { item: Material }) => (
    <TouchableOpacity style={styles.materialBox} onPress={() => openMaterialViewer(item)}>
      {item.contentType.startsWith('image/') && (
        <View style={styles.nameContainer}>
          <Image 
            source={{ uri: item.localUri || item.downloadURL }} 
            style={styles.materialImage} 
          />
          <Text style={styles.materialName}>
            {item.name}
          </Text>
        </View>
      )}
      {item.contentType.startsWith('video/') && (
        <View style={styles.nameContainer}>
          <VideoThumbnail uri={item.localUri || item.downloadURL} />
          <Text style={styles.materialName}>
            {item.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPDF = ({ item }: { item: Material }) => (
    <TouchableOpacity 
      style={styles.materialBox} 
      onPress={() => openMaterialViewer(item)}
    >
      <View style={[styles.nameContainer, { minWidth: 230 }]}>
        <Ionicons 
          name="document-text" 
          size={150} 
          color="#D32F2F" 
          style={{ alignSelf: "center" }}
        />
        <Text style={styles.materialName}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!settings || isInitialLoad) {
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
          keyExtractor={() => 'dummy'}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              title="Povuci za osvježavanje"
            />
          }
        />

        <MaterialViewer />
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
  video: {
    width: 200,
    height: 150,
    aspectRatio: 16 / 9,
    marginHorizontal: 10,
    marginTop: 10,
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
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  closeButton: {
    padding: 5,
    marginRight: 15,
    zIndex: 1001,
  },
  viewerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  viewerContent: {
    flex: 1,
  },
  fullscreenVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default InstructionsScreen;