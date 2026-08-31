import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/RootNavigator'
import { useAuth } from '../contexts/AuthContext'
import { getMyBatches } from '../services/enrollmentService'
import type { Batch } from '../types'
import colors from '../theme/colors'

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>

// Student dashboard "My Courses" (Phase 10), porting
// web/src/pages/DashboardPage.tsx's data-fetching and empty/error states.
// A "My Results" link is added here (not present as text on the web page
// itself, but web's PublicLayout.tsx nav bar carries the equivalent link
// site-wide) since this screen is the only place to reach ResultsScreen
// from - there's no persistent nav bar on mobile.
export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  function loadBatches() {
    getMyBatches()
      .then((data) => {
        setBatches(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadBatches, [])

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.full_name}</Text>

      <Pressable onPress={() => navigation.navigate('Results')} hitSlop={8}>
        <Text style={styles.resultsLink}>My Results &rarr;</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>My Courses</Text>

      {isLoading && <Text style={styles.muted}>Loading...</Text>}

      {loadError && (
        <Text style={styles.errorText}>
          Could not load your courses right now. Please try again later.
        </Text>
      )}

      {!isLoading && !loadError && batches.length === 0 && (
        <Text style={styles.muted}>
          You are not enrolled in any courses yet. Check back once your batch has been assigned.
        </Text>
      )}

      {!isLoading && !loadError && batches.length > 0 && (
        <FlatList
          data={batches}
          keyExtractor={(batch) => String(batch.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: batch }) => (
            <Pressable
              onPress={() => navigation.navigate('Topics', { courseId: batch.course_id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle}>{batch.course_name}</Text>
              <Text style={styles.cardLine}>Batch {batch.batch_number}</Text>
              <Text style={styles.cardLine}>
                {batch.start_date} to {batch.end_date}
              </Text>
              <Text style={styles.cardLine}>
                {batch.start_time} - {batch.end_time}
              </Text>
              <Text style={styles.cardLine}>Trainer: {batch.trainer_name}</Text>
              <Text style={styles.cardLink}>View Topics &rarr;</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.white },
  welcome: { fontSize: 20, fontWeight: '600', color: colors.gray900 },
  resultsLink: { marginTop: 8, color: colors.brand600, fontWeight: '600', fontSize: 14 },
  sectionTitle: { marginTop: 20, fontSize: 18, fontWeight: '600', color: colors.gray900 },
  muted: { marginTop: 8, color: colors.gray500 },
  errorText: { marginTop: 8, color: colors.red600 },
  listContent: { paddingTop: 12, paddingBottom: 24, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 16,
  },
  cardPressed: { borderColor: colors.brand200 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.gray900 },
  cardLine: { marginTop: 4, fontSize: 13, color: colors.gray600 },
  cardLink: { marginTop: 10, fontSize: 14, fontWeight: '600', color: colors.brand600 },
})
