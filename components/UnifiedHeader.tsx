import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CurrentDate from './CurrentDate';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

type Props = {
  settings: any;
  title: string;
  onLogout?: () => void;
};

const UnifiedHeader = ({ settings, title, onLogout }: Props) => {
  return (
    <View style={[styles.container, { paddingTop: onLogout ? 40 : 60 }]}>

      {/* Apsolutno pozicioniran datum */}
      <CurrentDate settings={settings} />

      {/* Gornji red: Logout dugme lijevo */}
      <View style={styles.topRow}>
        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <SimpleLineIcons name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Naslov centriran ispod */}
      <View style={styles.titleRow}>
        <Text
          style={[
            styles.title,
            {
              fontSize: settings.fontSize + 6,
              fontFamily: settings.font,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  titleRow: {
    marginTop: 15,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default UnifiedHeader;
