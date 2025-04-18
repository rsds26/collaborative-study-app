import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD6LWQtONhuxvUUkBZobZcLhYwy2HAcv1Q';

interface Library {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  todayOpeningHours?: string;
  isOpenNow?: boolean;
}

const LibraryScreen = () => {
  const [postalCode, setPostalCode] = useState<string>('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | undefined>(undefined);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to show nearby libraries.');
        setRegion({
          latitude: 1.3521,
          longitude: 103.8198,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } catch (error) {
        console.error("Error getting current location:", error);
        Alert.alert("Error", "Could not fetch current location. Please enter a postal code.");
        setRegion({
          latitude: 1.3521,
          longitude: 103.8198,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    })();
  }, []);

  const fetchNearbyLibraries = async () => {
    if (!postalCode.trim()) {
      Alert.alert('Input needed', 'Please enter a postal code.');
      return;
    }

    setIsLoading(true);
    setLibraries([]);
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=${GOOGLE_MAPS_API_KEY}&components=country:SG`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || geocodeData.results.length === 0) {
        throw new Error(geocodeData.error_message || 'Could not find coordinates for the postal code.');
      }

      const { lat, lng } = geocodeData.results[0].geometry.location;

      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });

      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=7000&type=library&keyword=NLB&key=${GOOGLE_MAPS_API_KEY}`;
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();

      if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
        throw new Error(placesData.error_message || 'Error fetching nearby libraries.');
      }

      if (placesData.results && placesData.results.length > 0) {
        const detailPromises = placesData.results.map(async (place: any) => {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,opening_hours,geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const detailResponse = await fetch(detailUrl);
          const detailData = await detailResponse.json();

          let todayHours = 'Hours unavailable';
          let isOpen = false;

          if (detailData.status === 'OK' && detailData.result) {
            const openingHoursData = detailData.result.opening_hours;
            if (openingHoursData) {
              isOpen = openingHoursData.open_now ?? false;
              const weekdayText = openingHoursData.weekday_text;
              if (weekdayText && weekdayText.length === 7) {
                const jsDayIndex = new Date().getDay();
                const googleApiDayIndex = jsDayIndex === 0 ? 6 : jsDayIndex - 1;
                const todayString = weekdayText[googleApiDayIndex];
                const colonIndex = todayString?.indexOf(':');
                todayHours = colonIndex !== -1 ? todayString.substring(colonIndex + 1).trim() : todayString?.trim() || 'Hours unavailable';
              }
            }

            return {
              id: place.place_id,
              name: detailData.result.name,
              latitude: detailData.result.geometry.location.lat,
              longitude: detailData.result.geometry.location.lng,
              todayOpeningHours: todayHours,
              isOpenNow: isOpen,
            };
          }

          return {
            id: place.place_id,
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            todayOpeningHours: 'Not available',
            isOpenNow: false,
          };
        });

        const fetchedLibrariesWithDetails: Library[] = await Promise.all(detailPromises);
        setLibraries(fetchedLibrariesWithDetails);
      } else {
        setLibraries([]);
        Alert.alert('No Libraries Found', 'No NLB libraries found within 7km of this postal code.');
      }

    } catch (error: any) {
      console.error("Error fetching libraries:", error);
      Alert.alert('Error', `Failed to fetch library data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Find Nearby Libraries</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Postal Code (e.g., 530000)"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
          />
          <Button title="Search Libraries" onPress={fetchNearbyLibraries} />

          {region ? (
            <MapView style={styles.map} region={region}>
              {libraries.map((library) => (
                <Marker
                  key={library.id}
                  coordinate={{ latitude: library.latitude, longitude: library.longitude }}
                  title={library.name}
                >
                  <Callout tooltip>
                    <View style={styles.calloutView}>
                      <Text style={styles.calloutTitle}>{library.name}</Text>
                      <Text
                        style={[styles.calloutStatus, { color: library.isOpenNow ? 'green' : 'red' }]}
                      >
                        {library.isOpenNow ? 'Open' : 'Closed'}
                      </Text>
                      <Text style={styles.calloutDescription}>
                        {library.todayOpeningHours || 'Hours not available'}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          ) : (
            <Text style={styles.loadingText}>Loading Map...</Text>
          )}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>Searching for libraries...</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  map: {
    flex: 1,
    marginTop: 15,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  calloutView: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    width: 200,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    marginBottom: 3,
  },
  calloutStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LibraryScreen;
