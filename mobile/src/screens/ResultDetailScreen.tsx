import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import axios from 'axios'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/RootNavigator'
import { getResultDetail } from '../services/resultsService'
import type { ResultDetail } from '../types'
import colors from '../theme/colors'

type Props = NativeStackScreenProps<AppStackParamList, 'ResultDetail'>

// Per-attempt result detail (Phase 10), porting
// web/src/pages/ResultDetailPage.tsx. Unlike AssessmentScreen's shapes,
// this is allowed to show the correct answer alongside the student's own
// selection - the attempt is already submitted, so there's nothing left
// to protect by hiding it.
export default function ResultDetailScreen({ route, navigation }: Props) {
  const { attemptId } = route.params

  const [detail, setDetail] = useState<ResultDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getResultDetail(attemptId)
      .then((data) => {
        if (isMounted) {
          setDetail(data)
          navigation.setOptions({ title: data.topic_name })
        }
      })
      .catch((err) => {
        if (!isMounted) return
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setLoadError('This is not your result to view.')
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          setLoadError('That result could not be found.')
        } else {
          setLoadError('Could not load this result right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    )
  }

  if (loadError || !detail) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.courseText}>{detail.course_name}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.scoreText}>
          {detail.score} / {detail.total_questions}
        </Text>
        <Text style={styles.muted}>{detail.percentage}% correct</Text>
        <Text style={styles.mutedSmall}>{detail.wrong_count} incorrect</Text>
        <Text style={styles.mutedSmall}>
          Submitted {new Date(detail.submitted_at).toLocaleString()}
        </Text>
      </View>

      <View style={styles.answersList}>
        {detail.answers.map((answer, index) => (
          <View
            key={answer.question_id}
            style={[
              styles.answerCard,
              { borderColor: answer.is_correct ? colors.green300 : colors.red300 },
            ]}
          >
            <Text style={styles.questionText}>
              {index + 1}. {answer.question_text}
            </Text>
            <Text style={styles.answerLine}>
              Your answer:{' '}
              <Text style={{ color: answer.is_correct ? colors.green700 : colors.red600 }}>
                {answer.selected_option_label
                  ? `${answer.selected_option_label}. ${answer.selected_option_text}`
                  : 'Not answered'}
              </Text>
            </Text>
            {!answer.is_correct && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {answer.correct_option_label}. {answer.correct_option_text}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 20 },
  scrollContent: { paddingBottom: 32 },
  muted: { color: colors.gray500 },
  mutedSmall: { marginTop: 4, fontSize: 12, color: colors.gray500 },
  errorText: { color: colors.red600 },
  courseText: { fontSize: 13, color: colors.gray500 },
  summaryCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 20,
  },
  scoreText: { fontSize: 28, fontWeight: '700', color: colors.gray900 },
  answersList: { marginTop: 20, gap: 12 },
  answerCard: { borderWidth: 1, borderRadius: 10, padding: 16 },
  questionText: { fontSize: 15, fontWeight: '500', color: colors.gray900 },
  answerLine: { marginTop: 8, fontSize: 13, color: colors.gray900 },
  correctAnswerText: { marginTop: 4, fontSize: 13, color: colors.green700 },
})
