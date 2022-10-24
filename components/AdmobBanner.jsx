import React, { useEffect, useState } from "react";

import { admobConfig } from "../app/services/adMobConfig";
import { useStateValue } from "../StateProvider";
import { useNavigation } from "@react-navigation/native";

// import {
//   AdMobBanner,
//   setTestDeviceIDAsync,
//   requestPermissionsAsync,
//   getPermissionsAsync,
// } from "expo-ads-admob";
import { ActivityIndicator, Alert } from "react-native";

const AdmobBanner = (props) => {
  const navigation = useNavigation();
  const [{ ios }, dispatch] = useStateValue();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (ios) {
      getper();
    }

    if (admobConfig?.admobEnabled) {
      configureAdmobTestDeviceID();
    }
  }, []);

  const getper = async () => {
    const { status } = await getPermissionsAsync();
    if (status !== "granted") {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        Alert.alert("", __("adMobTexts.appDisabledAlert", appSettings.lng), [
          {
            text: __("adMobTexts.okButton", appSettings.lng),
            onPress: () => {
              dispatch({
                type: "SET_ADMOB_PERMISSION",
                admobPermission: true,
              });
            },
          },
        ]);
      } else {
        setHasPermission(true);
      }
    } else {
      setHasPermission(true);
    }
  };
  const configureAdmobTestDeviceID = async () => {
    await setTestDeviceIDAsync("EMULATOR");
  };
  return ios ? (
    <>
      {hasPermission ? (
        <AdMobBanner
          bannerSize={admobConfig.listAdType}
          adUnitID={
            ios
              ? admobConfig.admobBannerId.iOS
              : admobConfig.admobBannerId.android
          }
          onDidFailToReceiveAdWithError={(error) => console.error(error)}
        />
      ) : (
        <ActivityIndicator />
      )}
    </>
  ) : (
    <AdMobBanner
      bannerSize={admobConfig.listAdType}
      adUnitID={
        ios ? admobConfig.admobBannerId.iOS : admobConfig.admobBannerId.android
      }
      onDidFailToReceiveAdWithError={(error) => console.error(error)}
    />
  );
};

export default AdmobBanner;
