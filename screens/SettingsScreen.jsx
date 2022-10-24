import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import AppSeparator from "../components/AppSeparator";
import { COLORS } from "../variables/color";
import authStorage from "../app/auth/authStorage";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";
import settingsStorage from "../app/settings/settingsStorage";
import api, { removeAuthToken, setAuthToken, setLocale } from "../api/client";
const languages = require("../language/languages.json");
import rtlSupoortedLng from "../language/rtlSupoortedLng.json";
import { listViewConfig } from "../app/services/listViewConfig";

const SettingsScreen = () => {
  const [
    { user, appSettings, config, rtl_support, push_token, auth_token },
    dispatch,
  ] = useStateValue();
  const [notification, setNotifiaction] = useState(appSettings.notifications);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLanguageChange = (languageCode) => {
    setLoggingOut(true);
    if (appSettings.lng === languageCode) {
      return true;
    }
    setLocale(languageCode);
    const tempSettings = {
      ...appSettings,
      lng: languageCode,
    };

    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });

    if (!rtl_support) {
      if (rtlSupoortedLng.includes(languageCode)) {
        dispatch({
          type: "SET_RTL_SUPPORT",
          rtl_support: true,
        });
      }
    } else {
      if (!rtlSupoortedLng.includes(languageCode)) {
        dispatch({
          type: "SET_RTL_SUPPORT",
          rtl_support: false,
        });
      }
    }

    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    setTimeout(() => {
      setLoggingOut(false);
    }, 1000);
  };

  const toggleSwitch = (type) => {
    setLoggingOut(true);
    const temparr = notification?.includes(type)
      ? [...notification.filter((_noti) => _noti !== type)]
      : [...notification, type];
    setNotifiaction(temparr);

    const tempSettings = {
      ...appSettings,
      notifications: [...temparr],
    };

    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    handlePushRegister(temparr);
  };

  const handlePushRegister = (data) => {
    if (user) {
      setAuthToken(auth_token);
    }
    let nCon = [];
    if (data?.length) {
      data.map((_item) => {
        if (config.pn_events.includes(_item)) {
          nCon.push(_item);
        }
      });
    }

    api
      .post("push-notification/register", {
        push_token: push_token,
        events: nCon,
      })
      .then((res) => {
        if (!res?.ok) {
          console.log(
            __("alerts.notificationRegistrationFail", appSettings.lng),
            res.data
          );
        }
      })
      .then(() => {
        if (user) {
          removeAuthToken();
        }
        setLoggingOut(false);
      });
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };

  const handleLogout = () => {
    setLoggingOut(true);
    if (user) {
      setAuthToken(auth_token);
    }
    api
      .post("logout", { push_token: push_token })
      .then((res) => {
        dispatch({
          type: "SET_AUTH_DATA",
          data: {
            user: null,
            auth_token: null,
          },
        });
        authStorage.removeUser();
        // if (res?.ok) {
        //   dispatch({
        //     type: "SET_AUTH_DATA",
        //     data: {
        //       user: null,
        //       auth_token: null,
        //     },
        //   });
        //   authStorage.removeUser();
        // } else {
        //   Alert.alert(
        //     "Logout failed!",
        //     res?.data?.error_message || res?.data?.error || res?.problem,
        //     [{ text: "Ok" }]
        //   );
        // }
      })
      .then(() => {
        removeAuthToken();
        setLoggingOut(false);
      });
  };

  const toggleView = (val) => {
    setLoggingOut(true);

    const tempSettings = {
      ...appSettings,
      listView: !val,
    };
    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    setTimeout(() => {
      setLoggingOut(false);
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingBottom: 30 }}>
        <View style={styles.contentWrapper}>
          {/* Setting Title */}
          <Text style={[styles.screenTitle, rtlText]}>
            {__("settingsScreenTexts.screenTitle", appSettings.lng)}
          </Text>
          <AppSeparator style={styles.separator} />
          {/* Language Setting */}
          {Object.keys(languages)?.length === 2 && (
            <>
              <View style={styles.notiWrapper}>
                <Text style={[styles.notiTitle, rtlText]}>
                  {__("settingsScreenTexts.languageTitle", appSettings.lng)}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginVertical: 15,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      width: "48.5%",
                      backgroundColor:
                        appSettings.lng === Object.keys(languages)[0]
                          ? COLORS.primary
                          : COLORS.white,
                      borderWidth: 1,
                      borderColor: "blue",
                      alignItems: "center",
                      paddingVertical: 5,
                    }}
                    onPress={() =>
                      handleLanguageChange(Object.keys(languages)[0])
                    }
                  >
                    <Text
                      style={[
                        {
                          color:
                            appSettings.lng === Object.keys(languages)[0]
                              ? COLORS.white
                              : COLORS.primary,
                        },
                        rtlText,
                      ]}
                    >
                      {languages[`${Object.keys(languages)[0]}`]}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      width: "48.5%",
                      backgroundColor:
                        appSettings.lng === Object.keys(languages)[1]
                          ? COLORS.primary
                          : COLORS.white,
                      borderWidth: 1,
                      borderColor: "blue",
                      alignItems: "center",
                      paddingVertical: 5,
                    }}
                    onPress={() =>
                      handleLanguageChange(Object.keys(languages)[1])
                    }
                  >
                    <Text
                      style={[
                        {
                          color:
                            appSettings.lng === Object.keys(languages)[1]
                              ? COLORS.white
                              : COLORS.primary,
                        },
                        rtlText,
                      ]}
                    >
                      {languages[`${Object.keys(languages)[1]}`]}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <AppSeparator style={styles.separator} />
            </>
          )}
          {Object.keys(languages)?.length > 2 && (
            <>
              <View style={styles.notiWrapper}>
                <Text style={[styles.notiTitle, rtlText]}>
                  {__("settingsScreenTexts.languageTitle", appSettings.lng)}
                </Text>
                <View
                  style={{
                    alignItems: "center",
                    marginVertical: 15,
                  }}
                >
                  {Object.keys(languages).map((_language, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor:
                          appSettings.lng === _language
                            ? COLORS.primary
                            : COLORS.white,
                        borderWidth: 1,
                        borderColor: "blue",
                        alignItems: "center",
                        paddingVertical: 5,
                        width: "100%",
                        marginVertical: 5,
                      }}
                      onPress={() => handleLanguageChange(_language)}
                    >
                      <Text
                        style={[
                          {
                            color:
                              appSettings.lng === _language
                                ? COLORS.white
                                : COLORS.primary,
                          },
                          rtlText,
                        ]}
                      >
                        {languages[_language]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <AppSeparator style={styles.separator} />
            </>
          )}
          {!!config?.pn_events?.length && (
            <View style={styles.notificationSection}>
              <View style={styles.notiWrapper}>
                <Text
                  style={[{ marginBottom: 15 }, styles.notiTitle, rtlTextA]}
                >
                  {__("settingsScreenTexts.notificationTitle", appSettings.lng)}
                </Text>
                {config?.pn_events?.includes("news_letter") && (
                  <View style={[styles.notiSetWrap, rtlView]}>
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.newsletterNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={
                          notification?.reminder ? "#f5dd4b" : "#f4f3f4"
                        }
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => toggleSwitch("news_letter")}
                        value={notification.includes("news_letter")}
                      />
                    </View>
                  </View>
                )}
                {config?.pn_events?.includes("listing_approved") && (
                  <View style={[styles.notiSetWrap, rtlView]}>
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.ListingApprovalNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={
                          notification?.adApproval ? "#f5dd4b" : "#f4f3f4"
                        }
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => toggleSwitch("listing_approved")}
                        value={notification.includes("listing_approved")}
                      />
                    </View>
                  </View>
                )}
                {config?.pn_events?.includes("chat") && (
                  <View style={[styles.notiSetWrap, rtlView]}>
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.messageNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={
                          notification?.newChat ? "#f5dd4b" : "#f4f3f4"
                        }
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => toggleSwitch("chat")}
                        value={notification.includes("chat")}
                      />
                    </View>
                  </View>
                )}

                {config?.pn_events?.includes("listing_expired") && (
                  <View style={[styles.notiSetWrap, rtlView]}>
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.expiredListingNotification",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={
                          notification?.expired ? "#f5dd4b" : "#f4f3f4"
                        }
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={() => toggleSwitch("listing_expired")}
                        value={notification.includes("listing_expired")}
                      />
                    </View>
                  </View>
                )}
                {!!user?.isAdmin && (
                  <>
                    {config?.pn_events?.includes("listing_created") && (
                      <View style={[styles.notiSetWrap, rtlView]}>
                        <View style={styles.notisetTtlWrap}>
                          <Text style={[styles.notisetTtl, rtlTextA]}>
                            {__(
                              "settingsScreenTexts.onlyAdmin.newListing",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View style={styles.notiSetBtnWrap}>
                          <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={
                              notification?.newListing ? "#f5dd4b" : "#f4f3f4"
                            }
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={() =>
                              toggleSwitch("listing_created")
                            }
                            value={notification.includes("listing_created")}
                          />
                        </View>
                      </View>
                    )}
                    {config?.pn_events?.includes("order_created") && (
                      <View style={[styles.notiSetWrap, rtlView]}>
                        <View style={styles.notisetTtlWrap}>
                          <Text style={[styles.notisetTtl, rtlTextA]}>
                            {__(
                              "settingsScreenTexts.onlyAdmin.newOrder",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View style={styles.notiSetBtnWrap}>
                          <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={
                              notification?.newOrder ? "#f5dd4b" : "#f4f3f4"
                            }
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={() => toggleSwitch("order_created")}
                            value={notification.includes("order_created")}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
              <AppSeparator style={styles.separator} />
            </View>
          )}

          {listViewConfig?.enableUserControl && (
            <View style={styles.notificationSection}>
              <View style={[styles.notiWrapper]}>
                <Text
                  style={[{ marginBottom: 15 }, styles.notiTitle, rtlTextA]}
                >
                  {__("settingsScreenTexts.viewStyleTitle", appSettings.lng)}
                </Text>

                <View style={[styles.notiSetWrap, rtlView]}>
                  <View style={styles.notisetTtlWrap}>
                    <Text style={[styles.notisetTtl, rtlTextA]}>
                      {__("settingsScreenTexts.listView", appSettings.lng)}
                    </Text>
                  </View>
                  <View style={styles.notiSetBtnWrap}>
                    <Switch
                      trackColor={{ false: "#767577", true: "#81b0ff" }}
                      thumbColor={appSettings?.listView ? "#f5dd4b" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={() => toggleView(appSettings.listView)}
                      value={appSettings.listView}
                    />
                  </View>
                </View>
              </View>
              <AppSeparator style={styles.separator} />
            </View>
          )}
        </View>

        {user && (
          <View style={styles.contentWrapper}>
            <TouchableOpacity
              style={[styles.logOutWrap, rtlView]}
              onPress={handleLogout}
            >
              <FontAwesome5 name="power-off" size={16} color={COLORS.primary} />
              <Text
                style={[
                  styles.logOutTitle,
                  rtlText,
                  { paddingEnd: rtl_support ? 10 : 0 },
                ]}
              >
                {__("settingsScreenTexts.logoutbuttonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal animationType="slide" transparent={true} visible={loggingOut}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.black,
            opacity: 0.3,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  btnCommon: {
    width: "50%",
    paddingVertical: 9,
    borderRadius: 0,
  },
  btninActive: {
    backgroundColor: COLORS.white,
  },
  btnTextinActive: {
    color: COLORS.text_gray,
  },
  btnTextCommon: {
    color: COLORS.white,
  },
  changeDetailTitle: {
    padding: "3%",
    fontWeight: "bold",
  },
  changePassTitle: {
    padding: "3%",
    fontWeight: "bold",
  },

  container: {
    backgroundColor: COLORS.bg_dark,
  },
  contentWrapper: {
    backgroundColor: COLORS.white,
  },

  form: {
    paddingHorizontal: "3%",
    paddingTop: 10,
    paddingBottom: 20,
  },

  formSeparator: {
    backgroundColor: COLORS.gray,
    width: "100%",
    marginBottom: 10,
  },
  label: {
    color: COLORS.text_gray,
  },
  languageTitle: {
    fontSize: 20,
  },
  languageTitle2: {
    padding: "3%",
    fontWeight: "bold",
  },
  langButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  languageSupport: {
    padding: "3%",
  },
  languageSupport2: {
    paddingBottom: 10,
  },
  logOutWrap: {
    flexDirection: "row",
    paddingHorizontal: "5%",
    paddingVertical: 10,
    alignItems: "center",
  },
  logOutTitle: {
    fontWeight: "bold",
    paddingLeft: 10,
  },
  notiSetBtnWrap: {
    flex: 1.5,
  },
  notisetTtlWrap: {
    flex: 3.5,
  },
  notiSetWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  notiSetBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  notiTitle: {
    fontSize: 20,
  },
  notiWrapper: {
    padding: "3%",
  },
  pickerWrap: {
    paddingHorizontal: "1%",
    paddingTop: 10,
  },
  screenTitle: {
    padding: "3%",
    fontWeight: "bold",
  },

  separator: {
    width: "100%",
  },
  toggleSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  updateButton: {
    width: "100%",
    borderRadius: 0,
    paddingVertical: 10,
  },
});

export default SettingsScreen;
