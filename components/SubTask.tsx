import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import Checkbox from "expo-checkbox";
import { CameraView } from "expo-camera";
import { saveMaterial } from "../modules/fetchingData";
import { storage } from "../modules/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  SettingsData,
  SubTaskData,
  updateFinishedSubTasks,
} from "../modules/fetchingData";
import * as ImageManipulator from "expo-image-manipulator";

export default function SubTask({
  started,
  subTask,
  subTaskColor,
  settings,
}: {
  started: boolean;
  subTask: SubTaskData;
  subTaskColor: string;
  settings: SettingsData;
}) {
  const [isChecked, setChecked] = useState(subTask.done ?? null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [photo, setPhoto] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  const handleCheckboxChange = () => {
    setChecked(!isChecked);
    if (subTask.needPhoto && !isChecked) {
      setModalVisible(true);
    } else if (!isChecked) {
      updateFinishedSubTasks(subTask.id, true);
      setChecked(true);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      if (result) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.uri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
        setPhoto(manipulatedImage);
      }
    }
  };

  const confirmPhoto = async () => {
    if (photo) {
      const currentDate = new Date().toISOString();
      try {
        const response = await fetch(photo.uri);
        const photoBlob = await response.blob();

        const storageRef = ref(
          storage,
          `Tasks/${subTask.task.id}_${subTask.id}_${currentDate}`
        );

        const uploadTask = uploadBytesResumable(storageRef, photoBlob, {
          contentType: "image/jpeg",
          customMetadata: {
            width: photo.width.toString(),
            height: photo.height.toString(),
            currentDate,
          },
        });

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => console.error("Upload failed:", error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await saveMaterial(
              `${subTask.task.id}_${subTask.id}_${currentDate}`,
              "image/jpeg",
              downloadURL,
              currentDate
            );
            setChecked(null);
            setModalVisible(false);
            setPhoto(null);
            updateFinishedSubTasks(subTask.id, null);
          }
        );
      } catch (error) {
        console.error("Error uploading photo:", error);
        Alert.alert("Greška", "Slanje slike nije uspjelo. Pokušajte ponovo.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          isChecked ? styles.subTaskFinished : styles.subTaskActive,
          { backgroundColor: subTaskColor },
        ]}
      >
        <Text
          style={{
            fontSize: settings.fontSize,
            color: settings.colorForFont,
            fontFamily: settings.font,
            textDecorationLine: isChecked ? "line-through" : "none",
          }}
        >
          {subTask.description}
        </Text>
      </View>
      <View style={styles.checkboxContainer}>
        {subTask.needPhoto && isChecked === null ? (
          <Text style={styles.waitingIcon}>⏳</Text>
        ) : (
          <Checkbox
            style={styles.checkbox}
            color={isChecked ? settings.colorForProgress : undefined}
            value={isChecked}
            onValueChange={handleCheckboxChange}
            disabled={!started}
          />
        )}
      </View>

      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {photo ? (
              <>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.imagePreview}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={confirmPhoto}
                  >
                    <Text style={styles.buttonText}>Potvrdi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setPhoto(null)}
                  >
                    <Text style={styles.buttonText}>Ponovi</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <CameraView ref={cameraRef} style={styles.camera}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.captureButtonText}>📸</Text>
                </TouchableOpacity>
              </CameraView>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setModalVisible(false);
                setChecked(false);
                setPhoto(null);
              }}
            >
              <Text style={styles.closeText}>Odustani</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    marginHorizontal: 12,
  },
  subTaskActive: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 3,
  },
  subTaskFinished: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    opacity: 0.6,
    elevation: 3,
  },
  checkboxContainer: {
    marginLeft: 10,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#666",
  },
  waitingIcon: {
    fontSize: 28,
    color: "gray",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  captureButton: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 50,
    elevation: 3,
  },
  captureButtonText: {
    fontSize: 22,
  },
  modalCloseButton: {
    marginTop: 20,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});