import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useAudio } from "../../lib/audio";
import type { PostWithDetails, TrackWithArtist } from "../../../shared/types";
import { timeAgo, formatNumber } from "../../../shared/validation";

export default function HomeScreen() {
  const { user } = useAuth();
  const { playTrack } = useAudio();
  const [refreshing, setRefreshing] = useState(false);

  const { data: feed, isLoading: feedLoading, refetch: refetchFeed } = useQuery({
    queryKey: ["/api/feed"],
    queryFn: () => apiRequest<PostWithDetails[]>("/feed"),
  });

  const { data: trending, isLoading: trendingLoading, refetch: refetchTrending } = useQuery({
    queryKey: ["/api/tracks/trending"],
    queryFn: () => apiRequest<TrackWithArtist[]>("/tracks/trending"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFeed(), refetchTrending()]);
    setRefreshing(false);
  };

  const handlePlayTrack = (track: TrackWithArtist) => {
    playTrack(track);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#E84A5F"
        />
      }
    >
      <View className="px-4 pt-14 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-sm">Welcome back,</Text>
            <Text className="text-white text-xl font-bold">
              {user?.fullName?.split(" ")[0] || "Music Lover"}
            </Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-surface rounded-full items-center justify-center">
            <Ionicons name="notifications-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-4 mb-6">
        <Text className="text-white text-lg font-bold mb-4">Trending Now</Text>
        {trendingLoading ? (
          <ActivityIndicator color="#E84A5F" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trending?.slice(0, 10).map((track) => (
              <TouchableOpacity
                key={track.id}
                className="mr-4 w-36"
                onPress={() => handlePlayTrack(track)}
              >
                <Image
                  source={{ uri: track.coverImageUrl || "https://via.placeholder.com/150" }}
                  className="w-36 h-36 rounded-xl"
                />
                <Text className="text-white font-medium mt-2" numberOfLines={1}>
                  {track.title}
                </Text>
                <Text className="text-muted text-sm" numberOfLines={1}>
                  {track.artist?.stageName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View className="px-4 mb-6">
        <Text className="text-white text-lg font-bold mb-4">Artist Feed</Text>
        {feedLoading ? (
          <ActivityIndicator color="#E84A5F" />
        ) : feed?.length === 0 ? (
          <View className="bg-surface rounded-xl p-6 items-center">
            <Ionicons name="newspaper-outline" size={40} color="#737373" />
            <Text className="text-muted text-center mt-3">
              No posts yet. Follow some artists to see their updates!
            </Text>
          </View>
        ) : (
          feed?.slice(0, 5).map((post) => (
            <View key={post.id} className="bg-surface rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <TouchableOpacity
                  className="flex-row items-center flex-1"
                  onPress={() => router.push(`/artist/${post.artistId}`)}
                >
                  <Image
                    source={{
                      uri: post.artist?.profileImageUrl || "https://via.placeholder.com/40",
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <View className="ml-3">
                    <Text className="text-white font-semibold">
                      {post.artist?.stageName}
                    </Text>
                    <Text className="text-muted text-xs">
                      {timeAgo(post.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text className="text-white mb-3">{post.content}</Text>

              {post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  className="w-full h-48 rounded-lg mb-3"
                  resizeMode="cover"
                />
              )}

              {post.track && (
                <TouchableOpacity
                  className="flex-row items-center bg-background rounded-lg p-3"
                  onPress={() => handlePlayTrack(post.track as TrackWithArtist)}
                >
                  <Image
                    source={{
                      uri: post.track.coverImageUrl || "https://via.placeholder.com/50",
                    }}
                    className="w-12 h-12 rounded-md"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium" numberOfLines={1}>
                      {post.track.title}
                    </Text>
                    <Text className="text-muted text-sm" numberOfLines={1}>
                      {post.artist?.stageName}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                    <Ionicons name="play" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              )}

              <View className="flex-row items-center mt-3 pt-3 border-t border-border">
                <TouchableOpacity className="flex-row items-center mr-6">
                  <Ionicons
                    name={post.isLiked ? "heart" : "heart-outline"}
                    size={20}
                    color={post.isLiked ? "#E84A5F" : "#737373"}
                  />
                  <Text className="text-muted ml-1">
                    {formatNumber(post.likeCount)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center mr-6">
                  <Ionicons name="chatbubble-outline" size={18} color="#737373" />
                  <Text className="text-muted ml-1">
                    {formatNumber(post.commentCount)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="share-outline" size={20} color="#737373" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="h-24" />
    </ScrollView>
  );
}
