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
import { validateSignupForm, isEduEmail } from "../../../shared/validation";

type Role = "listener" | "artist";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<Role>("listener");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep("form");
  };

  const handleSignup = async () => {
    setError("");
    setFieldErrors({});

    const validation = validateSignupForm(
      email,
      password,
      fullName,
      universityName,
      role
    );
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email,
        password,
        fullName,
        universityName,
        country: "United States",
        role,
      });
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "role") {
    return (
      <View className="flex-1 bg-background px-6 pt-20">
        <TouchableOpacity
          className="absolute top-14 left-4 p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center mb-12">
          <Text className="text-white text-2xl font-bold">Join Campus Music</Text>
          <Text className="text-muted text-base mt-2 text-center">
            How would you like to use the app?
          </Text>
        </View>

        <TouchableOpacity
          className="bg-surface border border-border rounded-2xl p-6 mb-4"
          onPress={() => handleRoleSelect("listener")}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-primary/20 rounded-full items-center justify-center">
              <Ionicons name="headset" size={28} color="#E84A5F" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg font-semibold">Listener</Text>
              <Text className="text-muted text-sm mt-1">
                Discover and stream music from student artists
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#737373" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-surface border border-border rounded-2xl p-6"
          onPress={() => handleRoleSelect("artist")}
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-primary/20 rounded-full items-center justify-center">
              <Ionicons name="mic" size={28} color="#E84A5F" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg font-semibold">Artist</Text>
              <Text className="text-muted text-sm mt-1">
                Upload your music and connect with fans
              </Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="school" size={14} color="#E84A5F" />
                <Text className="text-primary text-xs ml-1">
                  Requires .edu email
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#737373" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-14 pb-8">
          <TouchableOpacity
            className="mb-6"
            onPress={() => setStep("role")}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-white text-2xl font-bold">
              Create {role === "artist" ? "Artist" : "Listener"} Account
            </Text>
            <Text className="text-muted text-base mt-2">
              {role === "artist"
                ? "Share your music with the campus community"
                : "Start discovering amazing student artists"}
            </Text>
          </View>

          <View className="space-y-4">
            {error ? (
              <View className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                <Text className="text-red-400 text-center">{error}</Text>
              </View>
            ) : null}

            <View>
              <Text className="text-white text-sm mb-2 ml-1">Full Name</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="person-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Enter your full name"
                  placeholderTextColor="#737373"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
              {fieldErrors.fullName ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {fieldErrors.fullName}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-white text-sm mb-2 ml-1">Email</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="mail-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder={
                    role === "artist" ? "Enter your .edu email" : "Enter your email"
                  }
                  placeholderTextColor="#737373"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {role === "artist" && email && (
                  <Ionicons
                    name={isEduEmail(email) ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={isEduEmail(email) ? "#22c55e" : "#ef4444"}
                  />
                )}
              </View>
              {fieldErrors.email ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {fieldErrors.email}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-white text-sm mb-2 ml-1">University</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="school-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Enter your university"
                  placeholderTextColor="#737373"
                  value={universityName}
                  onChangeText={setUniversityName}
                />
              </View>
              {fieldErrors.universityName ? (
                <Text className="text-red-400 text-xs mt-1 ml-1">
                  {fieldErrors.universityName}
                </Text>
              ) : null}
            </View>

            <View>
              <Text className="text-white text-sm mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#737373" />
                <TextInput
                  className="flex-1 py-4 px-3 text-white text-base"
                  placeholder="Create a password"
                  placeholderTextColor="#737373"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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

            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-4 ${
                isLoading ? "opacity-70" : ""
              }`}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-muted">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
