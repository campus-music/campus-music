import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "heart-outline",
      label: "Liked Songs",
      onPress: () => {},
    },
    {
      icon: "list-outline",
      label: "Playlists",
      onPress: () => {},
    },
    {
      icon: "people-outline",
      label: "Following",
      onPress: () => {},
    },
    {
      icon: "time-outline",
      label: "Listening History",
      onPress: () => {},
    },
    {
      icon: "settings-outline",
      label: "Settings",
      onPress: () => {},
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () => {},
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="px-4 pt-14 pb-6">
          <View className="items-center">
            <Image
              source={{
                uri: user?.profileImageUrl || "https://via.placeholder.com/100",
              }}
              className="w-24 h-24 rounded-full"
            />
            <Text className="text-white text-xl font-bold mt-4">
              {user?.fullName}
            </Text>
            <Text className="text-muted">{user?.email}</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="school-outline" size={14} color="#737373" />
              <Text className="text-muted text-sm ml-1">
                {user?.universityName}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-3 py-1 rounded-full ${
                  user?.role === "artist" ? "bg-primary/20" : "bg-surface"
                }`}
              >
                <Text
                  className={
                    user?.role === "artist" ? "text-primary" : "text-muted"
                  }
                >
                  {user?.role === "artist" ? "Artist" : "Listener"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="bg-surface border border-border rounded-xl py-3 mt-6 items-center">
            <Text className="text-white font-medium">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="px-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center py-4 ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
              onPress={item.onPress}
            >
              <View className="w-10 h-10 bg-surface rounded-full items-center justify-center">
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color="#737373"
                />
              </View>
              <Text className="flex-1 text-white ml-3">{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#737373" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-4 mt-6">
          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={handleLogout}
          >
            <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text className="flex-1 text-red-400 ml-3">Log Out</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center py-8">
          <Text className="text-muted text-xs">Campus Music v1.0.0</Text>
        </View>

        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
