/* eslint-disable react/display-name */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

// Custom Components
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import NewListingButton from "./NewListingButton";
import AccountScreen from "../screens/AccountScreen";
import ChatListScreen from "../screens/ChatListScreen";
import HomeScreen from "../screens/HomeScreen";
import NewListingScreen from "../screens/NewListingScreen";
import SearchScreen from "../screens/SearchScreen";
import TestScreen from "../screens/TestScreen";
import { __ } from "../language/stringPicker";
import { routes } from "./routes";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [{ user, chat_badge, appSettings }, dispatch] = useStateValue();
  return (
    <Tab.Navigator
      tabBarOptions={{
        showLabel: true,
        activeTintColor: COLORS.primary,
        keyboardHidesTabBar: true,
        labelStyle: {
          marginBottom: 5,
          fontSize: 12,
        },
        style: {
          height: 50,
        },
      }}
    >
      <Tab.Screen
        name={__("tabTitles.home", appSettings.lng)}
        component={HomeScreen}
        // component={TestScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={__("tabTitles.search", appSettings.lng)}
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="search" size={20} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={routes.newListingScreen}
        component={NewListingScreen}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <NewListingButton
              onPress={() => {
                navigation.navigate(routes.newListingScreen);
                dispatch({
                  type: "SET_NEW_LISTING_SCREEN",
                  newListingScreen: true,
                });
              }}
            />
          ),
          tabBarVisible: !user,
        })}
      />
      <Tab.Screen
        name={__("tabTitles.chatList", appSettings.lng)}
        component={ChatListScreen}
        options={{
          tabBarBadge: chat_badge,
          tabBarIcon: ({ color }) => (
            <FontAwesome name="comments" size={23} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={__("tabTitles.account", appSettings.lng)}
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user-alt" size={20} color={color} />
          ),
          title: __("screenTitles.accountScreen", appSettings.lng),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
