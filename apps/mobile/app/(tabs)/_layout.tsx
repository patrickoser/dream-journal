import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Colors, Typography } from '../../src/constants/theme';

function TabBarIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconDot, focused && styles.iconDotFocused]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.starGold,
        tabBarInactiveTintColor: Colors.dusty,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sky',
          tabBarIcon: ({ focused }) => <TabBarIcon symbol="✦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Dream',
          tabBarIcon: ({ focused }) => <TabBarIcon symbol="◌" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Visions',
          tabBarIcon: ({ focused }) => <TabBarIcon symbol="◈" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(5, 5, 16, 0.95)',
    borderTopColor: 'rgba(232, 232, 240, 0.08)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
  },
  tabLabel: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 24,
  },
  iconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dusty,
  },
  iconDotFocused: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.starGold,
    shadowColor: Colors.starGold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
