import React from "react"
import{
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    }from "react-native";

export default function Button({
    title,
    onPress,
    loading,
}){
    return(
        <Pressable
            style={styles.button}
            onPress={onPress}
            disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#e61097"/>

                ):(
                    <Text style={styles.text}>
                        {title}
                    </Text>
                )}
            </Pressable>
    )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#3bdf6d",
    padding: 17,
    borderRadius: 30,
    alignItems: "center",
  },

  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
});