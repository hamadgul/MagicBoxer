import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const EDGE_WIDTH = 20; // Width of the edge area that blocks gestures

/**
 * Component that blocks drawer gestures when shouldBlock is true
 * Place this component at the root of your screen to prevent drawer gestures
 */
const DrawerGestureBlocker = ({ shouldBlock, children }) => {
  // If we shouldn't block, just render children
  if (!shouldBlock) {
    return children;
  }

  // Handler for gesture events
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.BEGAN) {
      // Just log that we've blocked the gesture
      // We don't need to call preventDefault - the PanGestureHandler will handle blocking
      console.log('Drawer gesture blocked');
      return true;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      {/* Left edge blocker */}
      <PanGestureHandler
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]} // Activate for small horizontal movements
        style={styles.leftEdgeBlocker}
      >
        <View style={styles.leftEdgeBlocker} />
      </PanGestureHandler>
      
      {/* Main content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  leftEdgeBlocker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 999, // Make sure it's above other elements
  },
});

export default DrawerGestureBlocker;
