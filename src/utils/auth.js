import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY  = '@auth_user';

export async function saveAuth(token, user) {
  global.__authToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadAuth() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const user  = await AsyncStorage.getItem(USER_KEY);
  if (token) global.__authToken = token;
  return {
    token,
    user: user ? JSON.parse(user) : null,
  };
}

export async function clearAuth() {
  global.__authToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}
