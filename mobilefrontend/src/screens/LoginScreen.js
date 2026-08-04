import React, { useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function handleLogin() {
    setError("");

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      setError("Backend not connected yet.");
    }, 2000);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          log in
        </Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Button
          title="Login"
          loading={loading}
          onPress={handleLogin}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#32d8eb",
    padding: 20,
  },

  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },

  title: {
    fontSize: 35,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },

  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
});