import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { useAudio } from "../../lib/audio";
import type { TrackWithArtist, ArtistProfile } from "../../../shared/types";
import { formatDuration, formatNumber } from "../../../shared/validation";

const GENRES = [
  "All",
  "Pop",
  "Hip-Hop",
  "Electronic",
  "Rock",
  "R&B",
  "Indie",
  "Jazz",
];

export default function ExploreScreen() {
  const { playTrack } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["/api/tracks", selectedGenre],
    queryFn: () =>
      apiRequest<TrackWithArtist[]>(
        `/tracks${selectedGenre !== "All" ? `?genre=${selectedGenre}` : ""}`
      ),
  });

  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ["/api/artists"],
    queryFn: () => apiRequest<ArtistProfile[]>("/artists"),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: () =>
      apiRequest<{ tracks: TrackWithArtist[]; artists: ArtistProfile[] }>(
        `/search?q=${encodeURIComponent(searchQuery)}`
      ),
    enabled: searchQuery.length >= 2,
  });

  const handlePlayTrack = (track: TrackWithArtist) => {
    playTrack(track);
  };

  const isSearching = searchQuery.length >= 2;

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-white text-2xl font-bold mb-4">Explore</Text>
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-4">
          <Ionicons name="search" size={20} color="#737373" />
          <TextInput
            className="flex-1 py-3 px-3 text-white text-base"
            placeholder="Search artists, tracks..."
            placeholderTextColor="#737373"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#737373" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearching && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre}
              className={`px-4 py-2 rounded-full ${
                selectedGenre === genre ? "bg-primary" : "bg-surface"
              }`}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text
                className={
                  selectedGenre === genre ? "text-white font-medium" : "text-muted"
                }
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView className="flex-1 px-4">
        {isSearching ? (
          searchLoading ? (
            <ActivityIndicator color="#E84A5F" className="mt-8" />
          ) : (
            <>
              {searchResults?.artists && searchResults.artists.length > 0 && (
                <View className="mb-6">
                  <Text className="text-white text-lg font-bold mb-3">Artists</Text>
                  {searchResults.artists.map((artist) => (
                    <TouchableOpacity
                      key={artist.id}
                      className="flex-row items-center py-3"
                      onPress={() => router.push(`/artist/${artist.id}`)}
                    >
                      <Image
                        source={{
                          uri: artist.profileImageUrl || "https://via.placeholder.com/50",
                        }}
                        className="w-14 h-14 rounded-full"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-semibold">
                          {artist.stageName}
                        </Text>
                        <Text className="text-muted text-sm">{artist.mainGenre}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#737373" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searchResults?.tracks && searchResults.tracks.length > 0 && (
                <View className="mb-6">
                  <Text className="text-white text-lg font-bold mb-3">Tracks</Text>
                  {searchResults.tracks.map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      className="flex-row items-center py-3"
                      onPress={() => handlePlayTrack(track)}
                    >
                      <Image
                        source={{
                          uri: track.coverImageUrl || "https://via.placeholder.com/50",
                        }}
                        className="w-14 h-14 rounded-lg"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-medium" numberOfLines={1}>
                          {track.title}
                        </Text>
                        <Text className="text-muted text-sm" numberOfLines={1}>
                          {track.artist?.stageName}
                        </Text>
                      </View>
                      <Text className="text-muted text-sm">
                        {formatDuration(track.durationSeconds)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {(!searchResults?.artists?.length && !searchResults?.tracks?.length) && (
                <View className="items-center py-12">
                  <Ionicons name="search-outline" size={48} color="#737373" />
                  <Text className="text-muted text-center mt-4">
                    No results found for "{searchQuery}"
                  </Text>
                </View>
              )}
            </>
          )
        ) : (
          <>
            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                Featured Artists
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {artistsLoading ? (
                  <ActivityIndicator color="#E84A5F" />
                ) : (
                  artists?.slice(0, 10).map((artist) => (
                    <TouchableOpacity
                      key={artist.id}
                      className="items-center mr-4"
                      onPress={() => router.push(`/artist/${artist.id}`)}
                    >
                      <Image
                        source={{
                          uri: artist.profileImageUrl || "https://via.placeholder.com/80",
                        }}
                        className="w-20 h-20 rounded-full"
                      />
                      <Text
                        className="text-white text-sm font-medium mt-2 text-center"
                        numberOfLines={1}
                      >
                        {artist.stageName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                {selectedGenre === "All" ? "All Tracks" : `${selectedGenre} Tracks`}
              </Text>
              {tracksLoading ? (
                <ActivityIndicator color="#E84A5F" />
              ) : (
                tracks?.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    className="flex-row items-center py-3 border-b border-border"
                    onPress={() => handlePlayTrack(track)}
                  >
                    <Image
                      source={{
                        uri: track.coverImageUrl || "https://via.placeholder.com/50",
                      }}
                      className="w-14 h-14 rounded-lg"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-medium" numberOfLines={1}>
                        {track.title}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-muted text-sm" numberOfLines={1}>
                          {track.artist?.stageName}
                        </Text>
                        <Text className="text-muted text-xs mx-2">•</Text>
                        <Text className="text-muted text-sm">
                          {formatNumber(track.streamCount)} plays
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity className="mr-3">
                        <Ionicons
                          name={track.isLiked ? "heart" : "heart-outline"}
                          size={20}
                          color={track.isLiked ? "#E84A5F" : "#737373"}
                        />
                      </TouchableOpacity>
                      <Text className="text-muted text-sm">
                        {formatDuration(track.durationSeconds)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}

        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
