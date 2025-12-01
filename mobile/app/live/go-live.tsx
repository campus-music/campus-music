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
import { useAuth } from "../../lib/auth";

export default function GoLiveScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (user?.role !== "artist") {
    return (
      <View className="flex-1 bg-background px-6 pt-14">
        <TouchableOpacity className="mb-6" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="radio-outline" size={64} color="#737373" />
          <Text className="text-white text-xl font-bold mt-4 text-center">
            Artists Only
          </Text>
          <Text className="text-muted text-center mt-2">
            Only verified artists can go live. Upgrade your account to start streaming.
          </Text>
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
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Go Live</Text>
          <View className="w-7" />
        </View>

        <View className="items-center mb-8">
          <View className="w-32 h-32 bg-surface rounded-full items-center justify-center">
            <Ionicons name="videocam" size={48} color="#E84A5F" />
          </View>
          <Text className="text-white font-medium mt-4">Camera Preview</Text>
          <Text className="text-muted text-sm mt-1">
            Camera permissions required
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-white text-sm mb-2 ml-1">Stream Title</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-white"
              placeholder="What are you streaming today?"
              placeholderTextColor="#737373"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View>
            <Text className="text-white text-sm mb-2 ml-1">Description</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-white h-24"
              placeholder="Tell viewers what to expect..."
              placeholderTextColor="#737373"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View className="flex-1 justify-end pb-8">
          <TouchableOpacity
            className={`bg-primary py-4 rounded-xl items-center flex-row justify-center ${
              !title.trim() ? "opacity-50" : ""
            }`}
            disabled={!title.trim()}
          >
            <Ionicons name="radio" size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Start Live Stream
            </Text>
          </TouchableOpacity>
          <Text className="text-muted text-center text-sm mt-4">
            Live streaming is currently in beta. Full functionality coming soon!
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
