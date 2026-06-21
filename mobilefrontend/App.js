import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello PADMAVATHI GARU  </Text>
      <Text>hai is this working</Text>
      <Text>ok i am starting now</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'yellow',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title:{
    fontSize:32,
    fontWeight:'bold',
  }
  
});