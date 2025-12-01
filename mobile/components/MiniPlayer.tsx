import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../lib/audio";

export default function MiniPlayer() {
  const { currentTrack, isPlaying, pause, resume } = useAudio();

  if (!currentTrack) return null;

  return (
    <TouchableOpacity
      className="absolute bottom-20 left-2 right-2 bg-surface-elevated border border-border rounded-xl p-3 flex-row items-center"
      onPress={() => router.push("/player")}
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: currentTrack.coverImageUrl || "https://via.placeholder.com/50",
        }}
        className="w-12 h-12 rounded-lg"
      />
      <View className="flex-1 mx-3">
        <Text className="text-white font-medium" numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text className="text-muted text-sm" numberOfLines={1}>
          {currentTrack.artist?.stageName}
        </Text>
      </View>
      <TouchableOpacity
        className="w-10 h-10 items-center justify-center"
        onPress={(e) => {
          e.stopPropagation();
          isPlaying ? pause() : resume();
        }}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={28}
          color="white"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
