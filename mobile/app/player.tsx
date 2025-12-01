import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../lib/audio";
import { formatDuration } from "../../shared/validation";

export default function PlayerScreen() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    pause,
    resume,
    seekTo,
  } = useAudio();

  if (!currentTrack) {
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-background px-6 pt-4">
      <View className="flex-row items-center justify-between mb-8">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-down" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-medium">Now Playing</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        <Image
          source={{
            uri: currentTrack.coverImageUrl || "https://via.placeholder.com/300",
          }}
          className="w-72 h-72 rounded-2xl"
        />

        <View className="w-full mt-8">
          <Text className="text-white text-2xl font-bold text-center">
            {currentTrack.title}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/artist/${currentTrack.artistId}`)}
          >
            <Text className="text-primary text-lg text-center mt-1">
              {currentTrack.artist?.stageName}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="w-full mt-8">
          <View className="h-1 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-muted text-sm">
              {formatDuration(Math.floor(progress))}
            </Text>
            <Text className="text-muted text-sm">
              {formatDuration(Math.floor(duration))}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center mt-8">
          <TouchableOpacity className="w-14 h-14 items-center justify-center">
            <Ionicons name="shuffle" size={24} color="#737373" />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 items-center justify-center mx-4">
            <Ionicons name="play-skip-back" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-16 h-16 bg-primary rounded-full items-center justify-center"
            onPress={isPlaying ? pause : resume}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 items-center justify-center mx-4">
            <Ionicons name="play-skip-forward" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 items-center justify-center">
            <Ionicons name="repeat" size={24} color="#737373" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center mt-8">
          <TouchableOpacity className="mx-6">
            <Ionicons name="heart-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="mx-6">
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="mx-6">
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
