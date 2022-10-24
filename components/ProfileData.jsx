import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useStateValue } from "../StateProvider";

// Custom Components & Constants
import { COLORS } from "../variables/color";

const ProfileData = ({ label, value }) => {
  const [{ rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  return (
    <View
      style={[
        styles.container,
        { alignItems: rtl_support ? "flex-end" : "flex-start" },
      ]}
    >
      <Text style={[styles.rowLabel, rtlText]}>{label}</Text>
      <Text style={[styles.rowValue, rtlText]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  rowLabel: {
    color: COLORS.text_gray,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  rowValue: {
    color: COLORS.text_gray,
    fontSize: 15,
  },
});

export default ProfileData;
