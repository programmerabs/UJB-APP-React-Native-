import React, { useState, useEffect } from "react";
import { create } from "apisauce";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import {
  createPaymentMethod,
  confirmPayment,
  handleCardAction,
} from "@stripe/stripe-react-native";
import { COLORS } from "../variables/color";
import { decodeString, getPrice } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import PaymentMethodCard from "../components/PaymentMethodCard";
import AppSeparator from "../components/AppSeparator";

import { __ } from "../language/stringPicker";
import api, { apiKey, removeAuthToken, setAuthToken } from "../api/client";
import { AntDesign } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

const PaymentMethodScreen = ({ navigation, route }) => {
  const [{ config, ios, appSettings, auth_token, user, rtl_support }] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [selected] = useState(route.params.selected);
  const [selectedMethod, setSelectedMethod] = useState();
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState();
  const [paymentError, setPaymentError] = useState();
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [cardData, setCardData] = useState();
  const [paypalData, setPaypalData] = useState(null);
  const [razorpayData, setRazorpayData] = useState(null);
  const [razorpaySuccess, setRazorpaySuccess] = useState(null);
  const [stripe3dConfirming, setStripe3dConfirming] = useState(false);

  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", _keyboardDidShow);
    Keyboard.addListener("keyboardDidHide", _keyboardDidHide);

    // cleanup function
    return () => {
      Keyboard.removeListener("keyboardDidShow", _keyboardDidShow);
      Keyboard.removeListener("keyboardDidHide", _keyboardDidHide);
    };
  }, []);

  const _keyboardDidShow = () => setKeyboardStatus(true);
  const _keyboardDidHide = () => setKeyboardStatus(false);

  useEffect(() => {
    if (!loading) return;
    getPaymentMethods();

    return () => {
      // TODO
    };
  }, []);

  const getPaymentMethods = () => {
    api
      .get("payment-gateways")
      .then((res) => {
        if (res.ok) {
          setPaymentMethodData(res.data);
        } else {
          // TODO handle error
        }
      })
      .then(() => {
        setLoading(false);
      });
  };

  const handlePaymentMethodSelection = (method) => {
    setSelectedMethod(method);
    setCardData();
    setTimeout(() => {
      selectedMethod;
    }, 500);
  };

  const handlePayment = () => {
    Keyboard.dismiss();
    let args = {};
    if (route?.params?.type === "membership") {
      args = {
        type: "membership",
        gateway_id: selectedMethod?.id,
        plan_id: route?.params?.selected?.id,
      };
    } else if (route?.params?.type === "promotion") {
      args = {
        type: "promotion",
        promotion_type: "regular",
        gateway_id: selectedMethod?.id,
        plan_id: route?.params?.selected?.id,
        listing_id: route?.params?.listingID,
      };
    }

    if (selectedMethod?.id === "stripe") {
      handleStripeCardPayment(args);
    } else if (selectedMethod?.id === "authorizenet") {
      setPaymentLoading(true);
      setPaymentModal(true);
      handleAuthorizeCardPayment(args);
    } else if (selectedMethod?.id === "paypal") {
      setPaymentLoading(true);
      setPaymentModal(true);
      handlePaypalPayment(args);
    } else if (selectedMethod?.id === "razorpay") {
      setPaymentLoading(true);
      setPaymentModal(true);
      handleRazorpayPayment(args);
    } else {
      setPaymentLoading(true);
      setPaymentModal(true);
      handleCheckout(args);
    }
  };

  const handlePaypalPayment = (args) => {
    setAuthToken(auth_token);

    // return;
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          setPaypalLoading(true);
          setPaymentLoading(false);
          if (args?.gateway_id === "paypal" && res?.data?.redirect) {
            setPaypalData(res.data);
          }
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
      });
  };
  const handleRazorpayPayment = (args) => {
    setAuthToken(auth_token);

    // return;
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          setPaypalLoading(true);
          setPaymentLoading(false);
          if (args?.gateway_id === "razorpay" && res?.data?.redirect) {
            setRazorpayData(res.data);
          }
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
      });
  };

  const handleCheckout = (args) => {
    setAuthToken(auth_token);

    // return;
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
      });
  };

  const handleCardData = (cardData) => {
    setCardData(cardData);
  };

  const proccedPaymentBtn =
    selectedMethod?.id === "stripe" && !cardData?.complete;

  const handleStripeCardPayment = async (args) => {
    if (!cardData?.complete) {
      Alert.alert(
        __("paymentMethodScreen.invalidCardMessage", appSettings.lng)
      );
      return;
    }
    setPaymentLoading(true);
    setPaymentModal(true);
    // const { error, paymentMethod } = await createPaymentMethod({
    //   type: "card",
    //   card: cardData,
    //   billing_details: {
    //     name: [user.first_name, user.last_name].join(" "),
    //     email: user.email,
    //   },
    // });
    // if (error) {
    //   setPaymentLoading(false);
    //   setPaymentError(error.message);
    //   Alert.alert(error.message);
    //   return;
    // }
    setAuthToken(auth_token);
    api
      .post("checkout", args)
      .then(async (res) => {
        console.log(res);
        if (res.ok) {
          if (
            res?.data?.requiresAction &&
            res?.data?.payment_intent_client_secret
          ) {
            setStripe3dConfirming(true);
            const { error, paymentIntent } = await confirmPayment(
              res?.data?.payment_intent_client_secret,
              {
                type: "Card",
              }
            );
            console.log(error, paymentIntent);
            // const { error, paymentIntent } = await handleCardAction(
            //   res?.data?.payment_intent_client_secret
            // );
            if (error) {
              setPaymentData(res?.data);
              return;
            }
            const raw_api = create({
              baseURL: res?.data?.gateway.routes.confirm_payment_intent,
              headers: {
                Accept: "application/json",
                "X-API-KEY": apiKey,
              },
              timeout: 30000,
            });
            raw_api.setHeader("Authorization", "Bearer " + auth_token);
            raw_api
              .post("", {
                rest_api: true,
                order_id: res?.data.id,
              })
              .then((confirmRes) => {
                console.log(confirmRes);
                if (confirmRes.ok && confirmRes?.data.result === "success") {
                  setPaymentData(confirmRes?.data.order_data);
                } else {
                  setPaymentData(res?.data);
                }
              });
          } else {
            setPaymentData(res?.data);
          }
        } else {
          setPaymentError(
            res?.data?.error_message || res?.data?.error || res?.problem
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
        setStripe3dConfirming(false);
      });
  };

  const handleAuthorizeCardPayment = (args) => {
    if (!cardData?.valid) {
      Alert.alert(
        __("paymentMethodScreen.invalidCardMessage", appSettings.lng)
      );
      return;
    }

    setAuthToken(auth_token);
    api
      .post("checkout", {
        card_number: cardData?.values?.number,
        card_exp_month: cardData?.values?.expiry.split("/")[0],
        card_exp_year: cardData?.values?.expiry.split("/")[1],
        card_cvc: cardData?.values?.cvc,
        ...args,
      })
      .then((res) => {
        if (res.ok) {
          setPaymentData(res?.data);
        } else {
          setPaymentError(
            res?.data?.message ||
              res?.data?.error ||
              res?.problem ||
              res?.status
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
      });
  };

  const handlePaymentSumaryDismiss = () => {
    Keyboard.dismiss();
    if (paymentError) {
      setPaymentModal(false);
      setPaymentError();
      return;
    }
    setPaymentModal(false);
    navigation.pop(3);
  };

  const handleWebviewDataChange = (data) => {
    if (data.url.search("rtcl_return=success") > -1) {
      setPaymentModal(false);
      navigation.pop(3);
      return;
    } else if (data.url.search("rtcl_return=cancel") > -1) {
      setPaymentModal(false);
      setPaymentLoading(false);
      return;
    }

    return;
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  let HTML = `<html>
		<head>
			<title>Payment</title>
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
		<head>
		<body  style="height:100vh">
		</body>
    </html>`;
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={ios ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        keyboardShouldPersistTaps="never"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 90,
        }}
      >
        <View style={[styles.paymentDetailWrap]}>
          <View
            style={[
              styles.paymentDetailHeaderWrap,
              { alignItems: rtl_support ? "flex-end" : "flex-start" },
            ]}
          >
            <Text style={[styles.paymentDetailHeaderText, rtlTextA]}>
              {__("paymentMethodScreen.paymentDetail", appSettings.lng)}
            </Text>
          </View>
          <View style={{ paddingHorizontal: "3%" }}>
            {route?.params?.type === "membership" && (
              <View style={[styles.selectedPackageWrap, rtlView]}>
                <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                  <Text style={[styles.selectedLabelText, rtlTextA]}>
                    {__("paymentMethodScreen.selectedPackage", appSettings.lng)}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    alignItems: rtl_support ? "flex-start" : "flex-end",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.selectedPackageNameText}
                  >
                    {selected.title}
                  </Text>
                </View>
              </View>
            )}
            {route?.params?.type === "promotion" && (
              <>
                <View style={[styles.selectedPackageWrap, rtlView]}>
                  <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                    <Text style={[styles.selectedLabelText, rtlTextA]}>
                      {__(
                        "paymentMethodScreen.promotionConfirmation",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      alignItems: rtl_support ? "flex-start" : "flex-end",
                    }}
                  >
                    <Text style={[styles.selectedPackageNameText, rtlText]}>
                      {decodeString(route.params.listingTitle)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.selectedPackageWrap,
                    rtlView,
                    { marginTop: 15 },
                  ]}
                >
                  <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                    <Text style={[styles.selectedLabelText, rtlTextA]}>
                      {__("paymentMethodScreen.promotionPlan", appSettings.lng)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      alignItems: rtl_support ? "flex-start" : "flex-end",
                    }}
                  >
                    <Text style={[styles.selectedPackageNameText, rtlText]}>
                      {decodeString(selected.title)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <AppSeparator style={styles.separator} />
            <View style={styles.pricingWrap}>
              <View style={[styles.priceRow, rtlView]}>
                <Text style={[styles.priceRowLabel, rtlText]}>
                  {__(
                    route.params.type === "membership"
                      ? "paymentMethodScreen.packagePrice"
                      : "paymentMethodScreen.promotionPrice",
                    appSettings.lng
                  )}
                </Text>
                <Text style={[styles.priceRowValue, rtlText]} numberOfLines={1}>
                  {getPrice(config.payment_currency, {
                    pricing_type: "price",
                    price_type: "fixed",
                    price: selected.price,
                    max_price: 0,
                  })}
                </Text>
              </View>
            </View>
            <AppSeparator style={styles.separator} />
            <View style={styles.pricingWrap}>
              <View style={[styles.priceRow, rtlView]}>
                <Text
                  style={[
                    styles.priceRowLabel,
                    { color: COLORS.text_dark },
                    rtlText,
                  ]}
                >
                  {__("paymentMethodScreen.subTotal", appSettings.lng)}
                </Text>
                <Text
                  style={[
                    styles.priceRowValue,
                    { color: COLORS.primary },
                    rtlText,
                  ]}
                  numberOfLines={1}
                >
                  {getPrice(config.payment_currency, {
                    pricing_type: "price",
                    price_type: "fixed",
                    price: selected.price,
                    max_price: 0,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ paddingVertical: 10 }} />
        <View style={styles.paymentSectionWrap}>
          <View
            style={[
              styles.paymentSectionTitle,
              { alignItems: rtl_support ? "flex-end" : "flex-start" },
            ]}
          >
            <Text
              style={[styles.paymentHeaderTitle, rtlText]}
              numberOfLines={1}
            >
              {__("paymentMethodScreen.choosePayment", appSettings.lng)}
            </Text>
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
          ) : (
            <View style={styles.paymentMethodsWrap}>
              {paymentMethodData?.map((method, index, arr) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  isLast={arr.length - 1 === index}
                  onSelect={handlePaymentMethodSelection}
                  selected={selectedMethod}
                  onCardDataUpdate={handleCardData}
                />
              ))}
            </View>
          )}
        </View>
        {ios && selectedMethod?.id === "stripe" && (
          <View
            style={{
              marginHorizontal: "3%",
              backgroundColor: "transparent",
            }}
          >
            <TouchableOpacity
              style={[
                styles.showMoreButton,
                {
                  backgroundColor: proccedPaymentBtn
                    ? COLORS.button.disabled
                    : COLORS.button.active,
                },
              ]}
              onPress={handlePayment}
              disabled={proccedPaymentBtn}
            >
              <Text
                style={[styles.showMoreButtonText, rtlText]}
                numberOfLines={1}
              >
                {__("paymentMethodScreen.proceedPayment", appSettings.lng)}
              </Text>
              <View style={styles.iconWrap}>
                <AntDesign name="arrowright" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {((ios && !!selectedMethod && selectedMethod?.id !== "stripe") ||
        (!ios && !keyboardStatus && !!selectedMethod)) && (
        <View style={[styles.buttonWrap, { marginHorizontal: "3%" }]}>
          <TouchableOpacity
            style={[
              styles.showMoreButton,
              {
                backgroundColor: proccedPaymentBtn
                  ? COLORS.button.disabled
                  : COLORS.button.active,
              },
            ]}
            onPress={handlePayment}
            disabled={proccedPaymentBtn}
          >
            <Text
              style={[styles.showMoreButtonText, rtlText]}
              numberOfLines={1}
            >
              {__("paymentMethodScreen.proceedPayment", appSettings.lng)}
            </Text>
            <View style={styles.iconWrap}>
              <AntDesign name="arrowright" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      <Modal animationType="slide" transparent={true} visible={paymentModal}>
        <View
          style={[
            styles.modalInnerWrap,
            { backgroundColor: paypalLoading ? COLORS.primary : COLORS.white },
          ]}
        >
          {paymentLoading ? (
            <View style={styles.paymentLoadingWrap}>
              {razorpaySuccess ? (
                <Text style={styles.text}>
                  {__("paymentMethodScreen.paymentVerifying", appSettings.lng)}
                </Text>
              ) : (
                <Text style={styles.text}>
                  {__("paymentMethodScreen.paymentProcessing", appSettings.lng)}
                </Text>
              )}
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              {paypalLoading ? (
                <>
                  {selectedMethod?.id === "razorpay" && (
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      {ios ? (
                        <WebView
                          style={{ marginTop: 20 }}
                          startInLoadingState={true}
                          renderLoading={() => (
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                          source={{ html: HTML }}
                          injectedJavaScript={`(function(){
                    
                        var razorpayCheckout = new Razorpay({
                          key: "${paymentData.checkout_data.key}",
                          currency: "${paymentData.checkout_data.currency}",
                          description: "${paymentData.checkout_data.description}",
                          name: "${paymentData.checkout_data.name}",
                          notes: {
                            rtcl_payment_id: ${paymentData.id}
                          },
                          order_id: "${paymentData.checkout_data.order_id}",
                          modal:{
                            ondismiss: function(e){
                              var resp = {reason:'dismiss', success:false, payment:null};
                              window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                            }
                          },
                          handler: function(payment){
                            var resp = {reason:'', success:true, payment: payment};
                            window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                          }
                        });
                        razorpayCheckout.open();
                      
                  })();`}
                          onMessage={(event) => {
                            // var response = JSON.parse(event);
                            const result = event.nativeEvent.data;
                            if (result) {
                              const res = JSON.parse(result);
                              if (res.success) {
                                setRazorpaySuccess(true);
                                setPaymentLoading(true);

                                var formdata = new FormData();
                                formdata.append("payment_id", paymentData.id);
                                formdata.append("rest_api", 1);
                                formdata.append(
                                  "razorpay_payment_id",
                                  res?.payment?.razorpay_payment_id
                                );
                                formdata.append(
                                  "razorpay_order_id",
                                  res?.payment?.razorpay_order_id
                                );
                                formdata.append(
                                  "razorpay_signature",
                                  res?.payment?.razorpay_signature
                                );
                                const myHeaders = new Headers();
                                myHeaders.append("Accept", "application/json");
                                myHeaders.append("X-API-KEY", apiKey);
                                myHeaders.append(
                                  "Authorization",
                                  "Bearer " + auth_token
                                );

                                fetch(paymentData.auth_api_url, {
                                  method: "POST",
                                  body: formdata,
                                  headers: myHeaders,
                                })
                                  .then((response) => response.json())
                                  .then((json) => {
                                    if (json?.success) {
                                      setPaymentData(json.data);
                                    }
                                  })
                                  .catch((error) => alert(error))
                                  .finally(() => {
                                    setPaypalLoading(false);
                                    setPaymentLoading(false);
                                  });
                              } else {
                                setPaymentError(res.reason);
                                setPaypalLoading(false);
                                setPaymentLoading(false);
                              }
                            }
                            // console.log(response);
                          }}
                          javaScriptEnabled={true}
                          // javaScriptEnabledAndroid={true}
                          // domStorageEnabled={true}
                          onError={console.error.bind(console, "error")}
                        />
                      ) : (
                        <WebView
                          style={{ marginTop: 20 }}
                          startInLoadingState={true}
                          renderLoading={() => (
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                          source={{ html: HTML }}
                          injectedJavaScript={`(function(){
                    if(!window.Razorpay){ 
                        var resp = {reason:'Could not initiate Razerpay', success:false, payment:null};
                        window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                      }else{
                        var razorpayCheckout = new Razorpay({
                          key: "${paymentData.checkout_data.key}",
                          currency: "${paymentData.checkout_data.currency}",
                          description: "${paymentData.checkout_data.description}",
                          name: "${paymentData.checkout_data.name}",
                          notes: {
                            rtcl_payment_id: ${paymentData.id}
                          },
                          order_id: "${paymentData.checkout_data.order_id}",
                          modal:{
                            ondismiss: function(e){
                              var resp = {reason:'dismiss', success:false, payment:null};
                              window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                            }
                          },
                          handler: function(payment){
                            var resp = {reason:'', success:true, payment: payment};
                            window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                          }
                        });
                        razorpayCheckout.open();
                      }
                  })();`}
                          onMessage={(event) => {
                            // var response = JSON.parse(event);
                            const result = event.nativeEvent.data;
                            if (result) {
                              const res = JSON.parse(result);
                              if (res.success) {
                                setRazorpaySuccess(true);
                                setPaymentLoading(true);

                                var formdata = new FormData();
                                formdata.append("payment_id", paymentData.id);
                                formdata.append("rest_api", 1);
                                formdata.append(
                                  "razorpay_payment_id",
                                  res?.payment?.razorpay_payment_id
                                );
                                formdata.append(
                                  "razorpay_order_id",
                                  res?.payment?.razorpay_order_id
                                );
                                formdata.append(
                                  "razorpay_signature",
                                  res?.payment?.razorpay_signature
                                );
                                const myHeaders = new Headers();
                                myHeaders.append("Accept", "application/json");
                                myHeaders.append("X-API-KEY", apiKey);
                                myHeaders.append(
                                  "Authorization",
                                  "Bearer " + auth_token
                                );

                                fetch(paymentData.auth_api_url, {
                                  method: "POST",
                                  body: formdata,
                                  headers: myHeaders,
                                })
                                  .then((response) => response.json())
                                  .then((json) => {
                                    if (json?.success) {
                                      setPaymentData(json.data);
                                    }
                                  })
                                  .catch((error) => alert(error))
                                  .finally(() => {
                                    setPaypalLoading(false);
                                    setPaymentLoading(false);
                                  });
                              } else {
                                setPaymentError(res.reason);
                                setPaypalLoading(false);
                                setPaymentLoading(false);
                              }
                            }
                            // console.log(response);
                          }}
                          javaScriptEnabled={true}
                          javaScriptEnabledAndroid={true}
                          domStorageEnabled={true}
                          onError={console.error.bind(console, "error")}
                        />
                      )}
                    </View>
                  )}
                  {selectedMethod?.id === "paypal" && (
                    <View style={{ flex: 1, justifyContent: "center" }}>
                      <WebView
                        source={{ uri: paymentData.redirect }}
                        style={{ marginTop: 20 }}
                        onNavigationStateChange={(data) =>
                          handleWebviewDataChange(data)
                        }
                        startInLoadingState={true}
                        renderLoading={() => (
                          <View
                            style={{
                              flex: 1,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ActivityIndicator
                              size="large"
                              color={COLORS.primary}
                            />
                          </View>
                        )}
                        onMessage={(e) => {
                          console.log(e.nativeEvent.data);
                        }}
                        javaScriptEnabled={true}
                        javaScriptEnabledAndroid={true}
                        domStorageEnabled={true}
                        onError={console.error.bind(console, "error")}
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  {!paymentError && !paymentData && (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={styles.text}>
                        {__(
                          "paymentMethodScreen.paymentProcessing",
                          appSettings.lng
                        )}
                      </Text>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                  {!!paymentError && (
                    <View style={styles.paymentErrorWrap}>
                      <Text style={styles.paymentError}>{paymentError}</Text>
                    </View>
                  )}
                  {paymentData && !paymentError && (
                    <ScrollView style={styles.paymentDataWrap}>
                      {!!paymentData && (
                        <View style={styles.paymentTableWrap}>
                          {!!paymentData?.id && (
                            <View style={styles.paymentTableHeaderWrap}>
                              <View
                                style={{
                                  paddingVertical: ios ? 10 : 7,
                                  alignItems: "center",
                                  paddingHorizontal: 10,
                                }}
                              >
                                <Text
                                  style={[
                                    styles.paymentTableValue,
                                    { color: COLORS.white },
                                  ]}
                                >
                                  {"#"}
                                  {paymentData.id}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!paymentData?.method && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.method",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {paymentData.method}
                                </Text>
                              </View>
                            </View>
                          )}

                          {!!paymentData?.price && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.totalAmount",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {getPrice(config.payment_currency, {
                                    pricing_type: "price",
                                    price_type: "fixed",
                                    price: paymentData.price,
                                    max_price: 0,
                                  })}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!paymentData?.paid_date && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.date",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {paymentData.paid_date}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!paymentData?.transaction_id && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.transactionID",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {paymentData.transaction_id}
                                </Text>
                              </View>
                            </View>
                          )}

                          {!!paymentData?.status && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.status",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {paymentData.status}
                                </Text>
                              </View>
                            </View>
                          )}
                          {paymentData?.status !== "Completed" &&
                            !!selectedMethod?.instructions && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.instructions",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {decodeString(selectedMethod.instructions)}
                                  </Text>
                                </View>
                              </View>
                            )}
                        </View>
                      )}
                      {!!paymentData?.plan && (
                        <View style={styles.planTableWrap}>
                          <View
                            style={{
                              paddingHorizontal: 5,
                              paddingVertical: ios ? 10 : 7,
                              backgroundColor: COLORS.primary,
                              borderTopLeftRadius: 10,
                              borderTopRightRadius: 10,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={[
                                styles.paymentTableValue,
                                { color: COLORS.white },
                              ]}
                            >
                              {__(
                                "paymentMethodScreen.plan.details",
                                appSettings.lng
                              )}
                            </Text>
                          </View>

                          {!!paymentData?.plan?.title && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.plan.pricingOption",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {decodeString(paymentData.plan.title)}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!paymentData?.plan?.visible && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.plan.duration",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {paymentData.plan.visible}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!paymentData?.plan?.price && (
                            <View style={styles.paymentTableRow}>
                              <View style={styles.paymentTableLabelWrap}>
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.plan.amount",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {getPrice(config.payment_currency, {
                                    pricing_type: "price",
                                    price_type: "fixed",
                                    price: paymentData.plan.price,
                                    max_price: 0,
                                  })}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </ScrollView>
                  )}

                  <View style={styles.buttonWrap}>
                    <TouchableOpacity
                      style={[
                        styles.showMoreButton,
                        {
                          backgroundColor: COLORS.button.active,
                        },
                      ]}
                      onPress={handlePaymentSumaryDismiss}
                    >
                      <Text style={styles.showMoreButtonText} numberOfLines={1}>
                        {__(
                          !!paymentError
                            ? "paymentMethodScreen.closeButton"
                            : "paymentMethodScreen.goToAccountButton",
                          appSettings.lng
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  buttonWrap: {
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingWrap: {
    width: "100%",
    marginVertical: 50,
  },
  iconWrap: {
    marginLeft: 5,
    marginTop: 2,
  },

  modalInnerWrap: {
    backgroundColor: COLORS.bg_light,
    flex: 1,
    padding: 15,
  },
  paymentDetailHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  paymentDetailHeaderWrap: {
    paddingHorizontal: "3%",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    marginBottom: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  paymentDetailWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    paddingBottom: "3%",
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  paymentError: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: "bold",
  },
  paymentErrorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 75,
  },
  paymentHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  paymentLoadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodsWrap: {},
  paymentSectionWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  paymentSectionTitle: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: "3%",
  },
  paymentTableHeaderWrap: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  paymentTableLabel: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  paymentTableLabelWrap: {
    justifyContent: "center",
    flex: 2,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
    paddingHorizontal: 5,
  },
  paymentTableRow: {
    flexDirection: "row",

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
  },
  paymentTableValue: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  paymentTableValueWrap: {
    justifyContent: "center",
    flex: 2.5,
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  paymentTableWrap: {},
  planTableWrap: {
    marginTop: 30,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRowLabel: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  priceRowValue: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  selectedLabelText: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  selectedPackageNameText: {
    fontWeight: "bold",
    color: COLORS.text_dark,
    textAlign: "right",
  },
  selectedPackageWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  separator: {
    width: "100%",
    marginVertical: 15,
  },
  showMoreButton: {
    borderRadius: 3,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  showMoreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

export default PaymentMethodScreen;
