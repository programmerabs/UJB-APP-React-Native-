/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";

// External Libraries
import ReactNativeZoomableView from "@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import { COLORS } from "../variables/color";
import ProfileData from "../components/ProfileData";
import { useStateValue } from "../StateProvider";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import AppSeparator from "../components/AppSeparator";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");
const MyProfileScreen = ({ navigation }) => {
  const [
    { auth_token, user, is_connected, appSettings, rtl_support },
    dispatch,
  ] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const [imageViewer, setImageViewer] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1200);
  };
  useEffect(() => {
    setAuthToken(auth_token);
    api.get("my").then((res) => {
      if (res.ok) {
        dispatch({
          type: "SET_AUTH_DATA",
          data: { user: res.data },
        });
        setLoading(false);
        removeAuthToken();
      } else {
        // TODO handle error && add retry button on error

        setErrorMessage(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myProfileScreenTexts.customResponseError", appSettings.lng)
        );
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myProfileScreenTexts.customResponseError", appSettings.lng)
        );
        setLoading(false);
        removeAuthToken();
      }
    });
  }, []);
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "center",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  const handleLocationTaxonomy = (locations) => {
    if (!locations) return;
    let result = "";
    for (let i = 0; i < locations.length; i++) {
      if (result.length < 1) {
        result = locations[i].name;
      } else {
        result = result + `, ${locations[i].name}`;
      }
    }
    return result;
  };

  const handleImageViewer = () => {
    if (!user.pp_thumb_url) return;
    setImageViewer(!imageViewer);
  };

  return is_connected ? (
    <>
      {loading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingMessage, rtlText]}>
              {__("myProfileScreenTexts.loadingMessage", appSettings.lng)}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {!imageViewer && (
            <View style={styles.container}>
              <ScrollView>
                <View style={styles.mainWrap}>
                  <View style={[styles.titleRow, rtlView]}>
                    <TouchableWithoutFeedback onPress={handleImageViewer}>
                      <View>
                        <View style={styles.imageWrap}>
                          {user.pp_thumb_url ? (
                            <Image
                              source={{ uri: user.pp_thumb_url }}
                              style={styles.image}
                            />
                          ) : (
                            <FontAwesome
                              name="camera"
                              size={20}
                              color={COLORS.text_gray}
                            />
                          )}
                        </View>
                        <View
                          style={
                            rtl_support
                              ? {
                                  height: 26,
                                  width: 26,
                                  backgroundColor: COLORS.bg_light,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  borderRadius: 13,
                                }
                              : {
                                  height: 26,
                                  width: 26,
                                  backgroundColor: COLORS.bg_light,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "absolute",
                                  bottom: 0,
                                  right: 0,
                                  borderRadius: 13,
                                }
                          }
                        >
                          <View
                            style={{
                              height: 22,
                              width: 22,
                              backgroundColor: COLORS.bg_dark,
                              alignItems: "center",
                              justifyContent: "center",

                              borderRadius: 11,
                            }}
                          >
                            <FontAwesome
                              name="camera"
                              size={12}
                              color={COLORS.text_gray}
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                    <View
                      style={[
                        styles.titleRight,
                        {
                          marginLeft: rtl_support ? 0 : 15,
                          marginRight: rtl_support ? 15 : 0,
                        },
                      ]}
                    >
                      {!!user.username && (
                        <View style={[styles.phoneWrap, rtlView]}>
                          <FontAwesome
                            name="user"
                            size={24}
                            color={COLORS.gray}
                          />

                          <Text
                            style={[
                              styles.name,
                              {
                                marginLeft: rtl_support ? 0 : 10,
                                marginRight: rtl_support ? 10 : 0,
                              },
                              rtlText,
                            ]}
                            numberOfLines={1}
                          >
                            {user.username}
                          </Text>
                        </View>
                      )}
                      {!!user.phone && (
                        <View style={[styles.phoneWrap, rtlView]}>
                          <FontAwesome5
                            name="phone"
                            size={20}
                            color={COLORS.gray}
                          />
                          <Text
                            style={[
                              styles.phone,
                              {
                                marginLeft: rtl_support ? 0 : 10,
                                marginRight: rtl_support ? 10 : 0,
                              },
                              rtlText,
                            ]}
                            numberOfLines={1}
                          >
                            {user.phone}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate(routes.editPersonalDetailScreen, {
                          data: user,
                        })
                      }
                      style={{
                        position: "absolute",
                        top: "15%",
                        right: rtl_support ? 5 : 0,
                      }}
                    >
                      <FontAwesome
                        name="edit"
                        size={24}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <AppSeparator style={styles.separator} />
                  <View style={styles.detail}>
                    {(!!user.first_name || !!user.last_name) && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.name",
                          appSettings.lng
                        )}
                        value={`${user.first_name} ${user.last_name}`}
                      />
                    )}
                    {!!user.email && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.email",
                          appSettings.lng
                        )}
                        value={user.email}
                      />
                    )}
                    {!!user.phone && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.phone",
                          appSettings.lng
                        )}
                        value={user.phone}
                      />
                    )}
                    {!!user.whatsapp_number && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.whatsapp",
                          appSettings.lng
                        )}
                        value={user.whatsapp_number}
                      />
                    )}
                    {!!user.website && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.website",
                          appSettings.lng
                        )}
                        value={user.website}
                      />
                    )}
                    {(!!user.locations.length || !!user.address) && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.address",
                          appSettings.lng
                        )}
                        value={
                          handleLocationTaxonomy(user.locations)
                            ? `${handleLocationTaxonomy(user.locations)}, ${
                                user.zipcode ? user.zipcode + "," : ""
                              } ${user.address}`
                            : `${user.zipcode ? user.zipcode + "," : ""} ${
                                user.address
                              }`
                        }
                      />
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
          {imageViewer && !!user.pp_thumb_url && (
            <View style={styles.imageViewerWrap}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={handleImageViewer}
              >
                <FontAwesome5 name="times" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.imageViewer}>
                <ReactNativeZoomableView
                  maxZoom={1.5}
                  minZoom={1}
                  zoomStep={0.5}
                  initialZoom={1}
                  bindToBorders={true}
                  style={{
                    padding: 10,
                    backgroundColor: COLORS.bg_dark,
                  }}
                >
                  <Image
                    style={{
                      width: deviceWidth,
                      height: deviceHeight,
                      resizeMode: "contain",
                    }}
                    source={{
                      uri: user.pp_thumb_url,
                    }}
                  />
                </ReactNativeZoomableView>
              </View>
            </View>
          )}
        </>
      )}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </>
  ) : (
    <View style={styles.noInternet}>
      <FontAwesome5
        name="exclamation-circle"
        size={24}
        color={COLORS.primary}
      />
      <Text style={styles.text}>
        {__("myProfileScreenTexts.noInternet", appSettings.lng)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  image: {
    height: 60,
    width: 60,
    resizeMode: "cover",
  },
  imageViewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
    height: 25,
    width: 25,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  imageViewerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  imageWrap: {
    height: 60,
    width: 60,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg_dark,
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },
  loadingWrap: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  mainWrap: {
    backgroundColor: COLORS.bg_light,
    paddingVertical: 15,
    paddingHorizontal: "3%",
  },
  name: {
    fontSize: 18,
    color: COLORS.text_dark,
  },
  noInternet: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  phone: {
    fontSize: 16,
    color: COLORS.text_gray,
  },
  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.bg_dark,
    marginVertical: 15,
  },
  titleRight: {},
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default MyProfileScreen;
