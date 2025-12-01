import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
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

export default function LiveScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: streams, isLoading, refetch } = useQuery({
    queryKey: ["/api/live"],
    queryFn: () => apiRequest<LiveStreamWithArtist[]>("/live"),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const liveStreams = streams?.filter((s) => s.status === "live") || [];
  const scheduledStreams = streams?.filter((s) => s.status === "scheduled") || [];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">Live</Text>
          {user?.role === "artist" && (
            <TouchableOpacity
              className="flex-row items-center bg-primary px-4 py-2 rounded-full"
              onPress={() => router.push("/live/go-live")}
            >
              <Ionicons name="radio" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Go Live</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E84A5F"
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#E84A5F" className="mt-8" />
        ) : (
          <>
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <Text className="text-white text-lg font-bold ml-2">
                  Live Now
                </Text>
              </View>

              {liveStreams.length === 0 ? (
                <View className="bg-surface rounded-xl p-8 items-center">
                  <Ionicons name="radio-outline" size={48} color="#737373" />
                  <Text className="text-white font-medium mt-4">
                    No one is live right now
                  </Text>
                  <Text className="text-muted text-sm text-center mt-2">
                    Check back later or follow your favorite artists to get
                    notified when they go live
                  </Text>
                </View>
              ) : (
                liveStreams.map((stream) => (
                  <TouchableOpacity
                    key={stream.id}
                    className="bg-surface rounded-xl overflow-hidden mb-4"
                    onPress={() => router.push(`/live/${stream.id}`)}
                  >
                    <View className="relative">
                      <View className="w-full h-48 bg-surface-elevated items-center justify-center">
                        <Ionicons name="videocam" size={48} color="#737373" />
                      </View>
                      <View className="absolute top-3 left-3 flex-row items-center bg-red-500 px-2 py-1 rounded">
                        <View className="w-2 h-2 bg-white rounded-full mr-1" />
                        <Text className="text-white text-xs font-bold">LIVE</Text>
                      </View>
                      <View className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded">
                        <Text className="text-white text-xs">
                          {stream.viewerCount} watching
                        </Text>
                      </View>
                    </View>
                    <View className="p-4">
                      <View className="flex-row items-center">
                        <Image
                          source={{
                            uri:
                              stream.artist?.profileImageUrl ||
                              "https://via.placeholder.com/40",
                          }}
                          className="w-10 h-10 rounded-full"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold">
                            {stream.title}
                          </Text>
                          <Text className="text-muted text-sm">
                            {stream.artist?.stageName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {scheduledStreams.length > 0 && (
              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-4">
                  Coming Up
                </Text>
                {scheduledStreams.map((stream) => (
                  <View
                    key={stream.id}
                    className="flex-row items-center bg-surface rounded-xl p-4 mb-3"
                  >
                    <Image
                      source={{
                        uri:
                          stream.artist?.profileImageUrl ||
                          "https://via.placeholder.com/50",
                      }}
                      className="w-12 h-12 rounded-full"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-medium">
                        {stream.title}
                      </Text>
                      <Text className="text-muted text-sm">
                        {stream.artist?.stageName}
                      </Text>
                    </View>
                    <TouchableOpacity className="bg-primary/20 px-3 py-2 rounded-full">
                      <Text className="text-primary text-sm font-medium">
                        Remind me
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
