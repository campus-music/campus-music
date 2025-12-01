import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { isValidEmail } from "../../../shared/validation";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (isValidEmail(email)) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-background px-6 pt-20">
        <View className="items-center flex-1 justify-center">
          <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-6">
            <Ionicons name="mail" size={40} color="#E84A5F" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">
            Check your email
          </Text>
          <Text className="text-muted text-base mt-4 text-center px-8">
            We've sent password reset instructions to {email}
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 px-12 rounded-xl mt-8"
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text className="text-white text-base font-semibold">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-6 pt-14">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-white text-2xl font-bold">Reset Password</Text>
          <Text className="text-muted text-base mt-2">
            Enter your email and we'll send you instructions to reset your
            password.
          </Text>
        </View>

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
        </View>

        <TouchableOpacity
          className={`bg-primary py-4 rounded-xl items-center mt-6 ${
            !isValidEmail(email) ? "opacity-50" : ""
          }`}
          onPress={handleSubmit}
          disabled={!isValidEmail(email)}
        >
          <Text className="text-white text-base font-semibold">
            Send Reset Link
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
