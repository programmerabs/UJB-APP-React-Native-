import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "../components/AdmobBanner";

const TestScreen = (props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>hjbjh</Text>
      {admobConfig?.admobEnabled && <AdmobBanner />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default TestScreen;
