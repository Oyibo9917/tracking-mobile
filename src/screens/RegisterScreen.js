import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../config/api';
import { saveAuth } from '../utils/auth';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '', role: 'driver',
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/register', form);
      const { token, user } = data.data;
      await saveAuth(token, user);

      navigation.replace(
        user.role === 'dispatcher' ? 'DispatcherDashboard' : 'DriverDashboard',
        { user },
      );
    } catch (err) {
      // Show validation errors if present, otherwise show the message
      const errors = err.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join('\n');
        Alert.alert('Validation Error', messages);
      } else {
        const msg = err.response?.data?.message ?? err.message ?? 'Registration failed.';
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Full Name"
        value={form.name} onChangeText={set('name')} />
      <TextInput style={styles.input} placeholder="Email"
        autoCapitalize="none" keyboardType="email-address"
        value={form.email} onChangeText={set('email')} />
      <TextInput style={styles.input} placeholder="Password"
        secureTextEntry value={form.password} onChangeText={set('password')} />
      <TextInput style={styles.input} placeholder="Confirm Password"
        secureTextEntry value={form.password_confirmation}
        onChangeText={set('password_confirmation')} />

      {/* Role selector */}
      <View style={styles.roleRow}>
        {['driver', 'dispatcher'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
            onPress={() => set('role')(r)}
          >
            <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f9f9f9' },
  container:        { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title:            { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input:            { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' },
  roleRow:          { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn:          { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', backgroundColor: '#fff' },
  roleBtnActive:    { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleBtnText:      { color: '#555', fontWeight: '600' },
  roleBtnTextActive:{ color: '#fff' },
  button:           { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText:       { color: '#fff', fontWeight: '600', fontSize: 16 },
  link:             { textAlign: 'center', color: '#2563eb', marginTop: 4 },
});
