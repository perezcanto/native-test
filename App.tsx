/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Button,
  StyleSheet,
  Text,
  useColorScheme,
  PermissionsAndroid,
  Platform,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';

import { ContributionGraph } from 'react-native-chart-kit';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [scanningMessage, setScanningMessage] = useState('Press Start Scan');


  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);

  // State for discovered services and characteristics
  const [services, setServices] = useState<any[]>([]);
  const [characteristics, setCharacteristics] = useState<any[]>([]);

  // Placeholder data for the heatmap chart
  const heatmapData = [
    { date: "2017-01-02", count: 1 },
    { date: "2017-01-03", count: 2 },
    { date: "2017-01-04", count: 3 },
    { date: "2017-01-05", count: 4 },
    { date: "2017-01-06", count: 5 },
    { date: "2017-01-30", count: 2 },
    { date: "2017-01-31", count: 3 },
    { date: "2017-03-01", count: 2 },
    { date: "2017-03-02", count: 4 },
    { date: "2017-03-05", count: 6 },
    { date: "2017-04-05", count: 2 },
    { date: "2017-04-06", count: 3 },
    { date: "2017-04-07", count: 5 },
    { date: "2017-05-01", count: 1 },
    { date: "2017-05-02", count: 2 },
    { date: "2017-05-03", count: 3 },
    { date: "2017-05-04", count: 4 },
    { date: "2017-06-01", count: 2 },
    { date: "2017-06-02", count: 4 },
    { date: "2017-06-03", count: 5 }
  ];

  // Example UUIDs (replace with your device's UUIDs)
  const SERVICE_UUID = '0000180F-0000-1000-8000-00805F9B34FB'; // Example Battery Service UUID
  const CHARACTERISTIC_UUID = '00002A19-0000-1000-8000-00805F9B34FB'; // Example Battery Level Characteristic UUID
  const WRITE_CHARACTERISTIC_UUID = 'YOUR_WRITE_CHARACTERISTIC_UUID'; // Replace with your write characteristic UUID

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  /*
   * To keep the template simple and small we're adding padding to prevent view
   * from rendering under the System UI.
   * For bigger apps the recommendation is to use `react-native-safe-area-context`:
   * https://github.com/AppAndFlow/react-native-safe-area-context
   *
   * You can read more about it here:
   * https://github.com/react-native-community/discussions-and-proposals/discussions/827
   */
  const safePadding = '5%';

  useEffect(() => {
    BleManager.start({showAlert: false});

    // Handle discovered peripherals
    const handleDiscoverPeripheral = (peripheral) => {
      console.log('Got blessed when discover a peripheral', peripheral);
      if (!discoveredDevices.find(dev => dev.id === peripheral.id)) {
        setDiscoveredDevices(prevState => [...prevState, peripheral]);
      }
    }

    // Handle scan stop
    const handleStopScan = () => {
      setIsScanning(false);
      setScanningMessage('Scan stopped');
      console.log('Scan is stopped');
    }

    // Handle device disconnection
    const handleDisconnectedPeripheral = (data) => {
      setConnectedDevice(null);
      console.log('Disconnected from ' + data.peripheral);
    }

    // Handle data updates from characteristics
    const handleUpdateValueForCharacteristic = (data) => {
      console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }

    // Handle successful connection
    const handleConnectPeripheral = async (data) => {
      console.log('Connected to ' + data.peripheral);
    }

    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );
    bleManagerEmitter.addListener('BleManagerConnectPeripheral', handleConnectPeripheral );

    return () => {
      bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan );
      bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
      bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );
      bleManagerEmitter.removeListener('BleManagerConnectPeripheral', handleConnectPeripheral );
    }
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth requires Location permission',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS doesn't require explicit location permission for BLE
  };

  const startScan = async () => {
    const granted = await requestPermissions();
    if (granted) {
      setIsScanning(true);
      setScanningMessage('Scanning...');
      BleManager.scan([], 5, true).catch((err) => console.error(err));
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      await BleManager.connect(deviceId);
      setConnectedDevice(deviceId);
      console.log(`Connected to ${deviceId}`);
      // Discover services and characteristics after connecting
      const peripheralInfo = await BleManager.retrieveServices(deviceId);
      console.log('Peripheral info:', peripheralInfo);
      setServices(peripheralInfo.services);
      setCharacteristics(peripheralInfo.characteristics);

      // Example: Start notification on a characteristic
      // Replace with your actual service and characteristic UUIDs
      await BleManager.startNotification(deviceId, SERVICE_UUID, CHARACTERISTIC_UUID);
      console.log('Started notification on characteristic');

    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const sendData = async (data: string) => {
    if (connectedDevice) {
      try {
        // Replace with your actual service and characteristic UUIDs for writing
        await BleManager.write(connectedDevice, SERVICE_UUID, WRITE_CHARACTERISTIC_UUID, Buffer.from(data).toJSON().data);
        console.log(`Sent data: ${data}`);
      } catch (error) {
        console.error('Error sending data:', error);
      }
    }
  };

  return (
    <View style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        style={backgroundStyle}>
        <View style={{paddingRight: safePadding}}>
          <Header/>
        </View>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
 paddingHorizontal: safePadding,
 paddingBottom: safePadding,
 flex: 1, // Add flex: 1 to take up available space
 }}>
          <Section title="BLE Manager">
            <Button
              title={isScanning ? "Stop Scan" : "Start Scan"}
              onPress={() => isScanning ? BleManager.stopScan() : startScan()}
            />
            <Text>{scanningMessage}</Text>
            {discoveredDevices.map(device => (
              <Button key={device.id} title={`Connect to ${device.name || 'Unknown Device'}`} onPress={() => connectToDevice(device.id)} />
            ))}
            <Button
              title={connectedDevice ? `Connected to ${connectedDevice}` : "Connect to Device"}
              onPress={() => {
                // Implement BLE connection logic here
                // For now, just simulate a connection
                // This will be replaced by selecting from discovered devices
                // connectToDevice('YOUR_DEVICE_ID'); // Replace with a known device ID for testing
                // This button will be replaced by the discovered device buttons
              }}
              disabled={isScanning} // Disable connect button while scanning
            />
          </Section>
          <Section title="Heatmap Chart">
 {/* Heatmap chart using react-native-chart-kit */}
            <ContributionGraph
              values={heatmapData}
              endDate={new Date("2017-07-01")}
              numDays={105}
              chartConfig={{
                backgroundColor: '#e26a00',
                backgroundGradientFrom: '#fb8c00',
                backgroundGradientTo: '#ffa726',
                decimalPlaces: 2, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
 }
              }}
              width={350} // Adjust width as needed
              height={220} // Adjust height as needed
            />
          </Section>
          {connectedDevice && (
            <Section title="Connected Device Info">
              <Text>Services:</Text>
              {services.map((service, index) => <Text key={index}>{service.uuid}</Text>)}
              <Text>Characteristics:</Text>
              {characteristics.map((characteristic, index) => <Text key={index}>{characteristic.characteristic}</Text>)}
            </Section>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
