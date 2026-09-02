import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/RootNavigator'
import { getMyResults } from '../services/resultsService'
import type { Result } from '../types'
import colors from '../theme/colors'

type Props = NativeStackScreenProps<AppStackParamList, 'Results'>

// "My Results" history (Phase 10), porting web/src/pages/ResultsPage.tsx:
// every past attempt the logged-in student has submitted, newest first.
export default function ResultsScreen({ navigation }: Props) {
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  function loadResults() {
    getMyResults()
      .then((data) => {
        setResults(data)
        setLoadError(false)
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(loadResults, [])

  return (
    <View style={styles.container}>
      {isLoading && <Text style={styles.muted}>Loading...</Text>}

      {loadError && (
        <Text style={styles.errorText}>
          Could not load your results right now. Please try again later.
        </Text>
      )}

      {!isLoading && !loadError && results.length === 0 && (
        <Text style={styles.muted}>You have not attempted any assessments yet.</Text>
      )}

      {!isLoading && !loadError && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(result) => String(result.attempt_id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: result }) => (
            <Pressable
              onPress={() => navigation.navigate('ResultDetail', { attemptId: result.attempt_id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle}>{result.course_name}</Text>
              <Text style={styles.cardLine}>{result.topic_name}</Text>
              <Text style={styles.scoreText}>
                {result.score} / {result.total_questions}
              </Text>
              <Text style={styles.cardLine}>{result.percentage}% correct</Text>
              <Text style={styles.cardMeta}>
                Submitted {new Date(result.submitted_at).toLocaleString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.white },
  muted: { color: colors.gray500 },
  errorText: { color: colors.red600 },
  listContent: { paddingBottom: 24, gap: 12 },
  card: { borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 16 },
  cardPressed: { borderColor: colors.brand200 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  cardLine: { marginTop: 4, fontSize: 13, color: colors.gray600 },
  scoreText: { marginTop: 8, fontSize: 22, fontWeight: '700', color: colors.gray900 },
  cardMeta: { marginTop: 8, fontSize: 11, color: colors.gray500 },
})
