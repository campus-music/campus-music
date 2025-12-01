import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { validateLoginForm } from "../../../shared/validation";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    setError("");
    setFieldErrors({});

    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-20 pb-8">
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
              <Ionicons name="musical-notes" size={40} color="white" />
            </View>
            <Text className="text-white text-3xl font-bold">Campus Music</Text>
            <Text className="text-muted text-base mt-2">
              Stream music from student artists
            </Text>
          </View>

          <View className="space-y-4">
            {error ? (
              <View className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                <Text className="text-red-400 text-center">{error}</Text>
              </View>
            ) : null}

            <View>
              <Text className="text-white text-sm mb-2 ml-1">Email</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="mail-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#737373"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {fieldErrors.email ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {fieldErrors.email}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-white text-sm mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#737373"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#737373"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {fieldErrors.password}
                </Text>
              ) : null}
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity className="self-end">
                <Text className="text-primary text-sm">Forgot password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-4 ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-muted">Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
