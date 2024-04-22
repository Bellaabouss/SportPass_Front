import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TribunePage = () => {
  return (
    <View style={styles.container}>
      <Text>Tribune Page</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TribunePage;
