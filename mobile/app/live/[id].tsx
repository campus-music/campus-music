import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { LiveStream } from "../../../shared/types";

interface LiveStreamWithArtist extends LiveStream {
  artist?: {
    stageName: string;
    profileImageUrl: string | null;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export default function LiveStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "demo",
      userName: "Demo User",
      content: "Hey everyone! So excited for this stream!",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      userId: "demo2",
      userName: "Music Fan",
      content: "Love your music! Play the new track please!",
      createdAt: new Date().toISOString(),
    },
  ]);

  const { data: stream, isLoading } = useQuery({
    queryKey: ["/api/live", id],
    queryFn: () => apiRequest<LiveStreamWithArtist>(`/live/${id}`),
    enabled: !!id,
  });

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.fullName,
        content: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessage("");
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#E84A5F" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1">
        <View className="relative">
          <View className="w-full aspect-video bg-surface-elevated items-center justify-center">
            <Ionicons name="videocam" size={64} color="#737373" />
            <Text className="text-muted mt-4">Live stream preview</Text>
          </View>

          <TouchableOpacity
            className="absolute top-14 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="absolute top-14 right-4 flex-row items-center bg-red-500 px-2 py-1 rounded">
            <View className="w-2 h-2 bg-white rounded-full mr-1" />
            <Text className="text-white text-xs font-bold">LIVE</Text>
          </View>

          <View className="absolute bottom-4 left-4 flex-row items-center bg-black/50 px-3 py-2 rounded-full">
            <Ionicons name="eye" size={16} color="white" />
            <Text className="text-white text-sm ml-2">
              {stream?.viewerCount || 0} watching
            </Text>
          </View>
        </View>

        <View className="p-4 border-b border-border">
          <View className="flex-row items-center">
            <Image
              source={{
                uri:
                  stream?.artist?.profileImageUrl ||
                  "https://via.placeholder.com/40",
              }}
              className="w-10 h-10 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold">
                {stream?.title || "Live Stream"}
              </Text>
              <Text className="text-muted text-sm">
                {stream?.artist?.stageName}
              </Text>
            </View>
            <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
              <Text className="text-white font-medium">Follow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-2">
          {messages.map((msg) => (
            <View key={msg.id} className="flex-row mb-3">
              <View className="w-8 h-8 bg-surface rounded-full items-center justify-center">
                <Ionicons name="person" size={16} color="#737373" />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-primary text-sm font-medium">
                  {msg.userName}
                </Text>
                <Text className="text-white">{msg.content}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="flex-row items-center p-4 border-t border-border">
          <View className="flex-1 flex-row items-center bg-surface rounded-full px-4">
            <TextInput
              className="flex-1 py-3 text-white"
              placeholder="Say something..."
              placeholderTextColor="#737373"
              value={message}
              onChangeText={setMessage}
            />
          </View>
          <TouchableOpacity
            className="w-12 h-12 bg-primary rounded-full items-center justify-center ml-2"
            onPress={handleSendMessage}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
