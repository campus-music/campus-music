import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { useAudio } from "../../lib/audio";
import type { ArtistProfile, TrackWithArtist } from "../../../shared/types";
import { formatDuration, formatNumber } from "../../../shared/validation";

interface ArtistDetails extends ArtistProfile {
  tracks: TrackWithArtist[];
  followerCount?: number;
  isFollowing?: boolean;
}

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playTrack } = useAudio();

  const { data: artist, isLoading } = useQuery({
    queryKey: ["/api/artists", id],
    queryFn: () => apiRequest<ArtistDetails>(`/artists/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#E84A5F" />
      </View>
    );
  }

  if (!artist) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-white">Artist not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="relative">
          <View className="w-full h-64 bg-surface-elevated">
            <Image
              source={{
                uri: artist.profileImageUrl || "https://via.placeholder.com/400",
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </View>

          <TouchableOpacity
            className="absolute top-14 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-4 -mt-16">
          <Text className="text-white text-3xl font-bold">{artist.stageName}</Text>
          <Text className="text-muted mt-1">{artist.mainGenre}</Text>

          <View className="flex-row items-center mt-4">
            <View className="mr-6">
              <Text className="text-white text-lg font-bold">
                {formatNumber(artist.followerCount || 0)}
              </Text>
              <Text className="text-muted text-sm">Followers</Text>
            </View>
            <View>
              <Text className="text-white text-lg font-bold">
                {artist.tracks?.length || 0}
              </Text>
              <Text className="text-muted text-sm">Tracks</Text>
            </View>
          </View>

          <View className="flex-row mt-6">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-full items-center mr-3 ${
                artist.isFollowing ? "bg-surface border border-primary" : "bg-primary"
              }`}
            >
              <Text className="text-white font-semibold">
                {artist.isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 bg-surface border border-border rounded-full items-center justify-center">
              <Ionicons name="share-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {artist.bio && (
            <View className="mt-6">
              <Text className="text-white">{artist.bio}</Text>
            </View>
          )}
        </View>

        <View className="px-4 mt-8">
          <Text className="text-white text-xl font-bold mb-4">Tracks</Text>
          {artist.tracks?.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 items-center">
              <Ionicons name="musical-notes-outline" size={40} color="#737373" />
              <Text className="text-muted text-center mt-3">
                No tracks uploaded yet
              </Text>
            </View>
          ) : (
            artist.tracks?.map((track, index) => (
              <TouchableOpacity
                key={track.id}
                className="flex-row items-center py-3 border-b border-border"
                onPress={() => playTrack(track)}
              >
                <Text className="text-muted w-8">{index + 1}</Text>
                <Image
                  source={{
                    uri: track.coverImageUrl || "https://via.placeholder.com/50",
                  }}
                  className="w-12 h-12 rounded-lg"
                />
                <View className="flex-1 mx-3">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-muted text-sm">
                      {formatNumber(track.streamCount)} plays
                    </Text>
                  </View>
                </View>
                <Text className="text-muted text-sm mr-3">
                  {formatDuration(track.durationSeconds)}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#737373" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}
