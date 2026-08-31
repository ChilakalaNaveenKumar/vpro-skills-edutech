import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'
import colors from '../theme/colors'
import LoginScreen from '../screens/LoginScreen'
import DashboardScreen from '../screens/DashboardScreen'
import TopicsScreen from '../screens/TopicsScreen'
import AssessmentScreen from '../screens/AssessmentScreen'
import ResultsScreen from '../screens/ResultsScreen'
import ResultDetailScreen from '../screens/ResultDetailScreen'

export type AuthStackParamList = {
  Login: undefined
}

export type AppStackParamList = {
  Dashboard: undefined
  Topics: { courseId: number }
  Assessment: { topicId: number }
  Results: undefined
  ResultDetail: { attemptId: number }
}

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>()
const AppStackNav = createNativeStackNavigator<AppStackParamList>()

function AuthStack() {
  return (
    <AuthStackNav.Navigator>
      <AuthStackNav.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Student Login' }}
      />
    </AuthStackNav.Navigator>
  )
}

// Small header-right control shown on the Dashboard screen only. Reads
// useAuth() directly (safe - AuthProvider wraps the whole app in App.tsx,
// this component only ever renders inside that tree) rather than plumbing
// a logout callback down through navigation options.
function LogoutHeaderButton() {
  const { logout } = useAuth()
  return (
    <Pressable onPress={logout} hitSlop={8}>
      <Text style={styles.logoutText}>Log out</Text>
    </Pressable>
  )
}

function AppStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerTintColor: colors.brand600 }}>
      <AppStackNav.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'My Courses', headerRight: () => <LogoutHeaderButton /> }}
      />
      <AppStackNav.Screen name="Topics" component={TopicsScreen} options={{ title: 'Topics' }} />
      <AppStackNav.Screen
        name="Assessment"
        component={AssessmentScreen}
        options={{ title: 'Assessment', headerBackVisible: false, gestureEnabled: false }}
      />
      <AppStackNav.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: 'My Results' }}
      />
      <AppStackNav.Screen
        name="ResultDetail"
        component={ResultDetailScreen}
        options={{ title: 'Result' }}
      />
    </AppStackNav.Navigator>
  )
}

// Auth-gated navigation (Phase 10): rather than a per-route guard like
// web's ProtectedRoute.tsx, this uses React Navigation's idiomatic
// top-level conditional between two whole stacks. React Navigation
// unmounts/remounts the right one automatically when `user` changes, so
// login/logout never need a manual navigation.reset() call - the same
// "declarative redirect, no imperative navigation" property
// ProtectedRoute.tsx has on web.
export default function RootNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand600} />
      </View>
    )
  }

  return <NavigationContainer>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  logoutText: { color: colors.brand600, fontSize: 14, fontWeight: '600' },
})
