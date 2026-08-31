import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import axios from 'axios'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/RootNavigator'
import { getAssessment, submitAssessment } from '../services/assessmentService'
import type { Assessment, AssessmentResult } from '../types'
import colors from '../theme/colors'

type Props = NativeStackScreenProps<AppStackParamList, 'Assessment'>

// Topic-wise MCQ assessment (Phase 10), porting
// web/src/pages/AssessmentPage.tsx's state machine 1:1: one question at a
// time, answers held only in this component's state - nothing is sent to
// the backend until Submit, which is the only write for the whole attempt.
// RootNavigator disables the header back button and swipe-back gesture on
// this screen (see RootNavigator.tsx) so an accidental gesture mid-attempt
// can't silently discard progress the way a stray tap could on web.
export default function AssessmentScreen({ route, navigation }: Props) {
  const { topicId } = route.params
  const startedAtRef = useRef(new Date().toISOString())

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number | null>>({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  useEffect(() => {
    let isMounted = true

    getAssessment(topicId)
      .then((data) => {
        if (isMounted) {
          setAssessment(data)
          navigation.setOptions({ title: data.topic_name })
        }
      })
      .catch((err) => {
        if (!isMounted) return
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setLoadError('You are not enrolled in this course.')
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          setLoadError('No assessment is available for this topic yet.')
        } else {
          setLoadError('Could not load this assessment right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId])

  async function handleSubmit() {
    if (!assessment) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const answers = assessment.questions.map((question) => ({
        question_id: question.id,
        selected_option_id: selectedByQuestion[question.id] ?? null,
      }))
      const submitResult = await submitAssessment(topicId, startedAtRef.current, answers)
      setResult(submitResult)
      navigation.setOptions({ headerBackVisible: true, gestureEnabled: true })
    } catch {
      setSubmitError('Could not submit your assessment right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable onPress={() => navigation.navigate('Dashboard')} hitSlop={8}>
          <Text style={styles.linkText}>&larr; Back to My Courses</Text>
        </Pressable>
      </View>
    )
  }

  if (!assessment) {
    return null
  }

  if (result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Assessment Submitted</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreText}>
            {result.score} / {result.total_questions}
          </Text>
          <Text style={styles.muted}>{result.percentage}% correct</Text>
          <Text style={styles.mutedSmall}>{result.wrong_count} incorrect</Text>
        </View>
        <View style={styles.resultActions}>
          <Pressable
            onPress={() => navigation.replace('ResultDetail', { attemptId: result.attempt_id })}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>View Full Result</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Dashboard')}
            style={({ pressed }) => [styles.buttonOutline, pressed && styles.buttonOutlinePressed]}
          >
            <Text style={styles.buttonOutlineText}>Back to My Courses</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const question = assessment.questions[currentIndex]
  const isLastQuestion = currentIndex === assessment.questions.length - 1

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.progress}>
        Question {currentIndex + 1} of {assessment.total_questions}
      </Text>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question_text}</Text>

        <View style={styles.optionsList}>
          {question.options.map((option) => {
            const isSelected = selectedByQuestion[question.id] === option.id
            return (
              <Pressable
                key={option.id}
                onPress={() =>
                  setSelectedByQuestion((prev) => ({ ...prev, [question.id]: option.id }))
                }
                style={styles.optionRow}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>
                  {option.option_label}. {option.option_text}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {submitError && <Text style={styles.errorText}>{submitError}</Text>}

      <View style={styles.navRow}>
        <Pressable
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex((i) => i - 1)}
          style={({ pressed }) => [
            styles.buttonOutline,
            currentIndex === 0 && styles.buttonDisabled,
            pressed && styles.buttonOutlinePressed,
          ]}
        >
          <Text style={styles.buttonOutlineText}>Previous</Text>
        </Pressable>

        {isLastQuestion ? (
          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.button,
              isSubmitting && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setCurrentIndex((i) => i + 1)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '600', color: colors.gray900, padding: 20 },
  muted: { color: colors.gray500 },
  mutedSmall: { marginTop: 4, fontSize: 13, color: colors.gray500 },
  errorText: { color: colors.red600, marginBottom: 12 },
  linkText: { marginTop: 12, color: colors.gray600, fontSize: 14 },
  progress: { fontSize: 13, color: colors.gray500 },
  questionCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 20,
  },
  questionText: { fontSize: 16, fontWeight: '500', color: colors.gray900 },
  optionsList: { marginTop: 16, gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: colors.brand600 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand600 },
  optionText: { flex: 1, fontSize: 14, color: colors.gray900 },
  navRow: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  scoreCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 24,
  },
  scoreText: { fontSize: 30, fontWeight: '700', color: colors.gray900 },
  resultActions: { marginTop: 20, paddingHorizontal: 20, gap: 12 },
  button: { backgroundColor: colors.brand600, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  buttonPressed: { backgroundColor: colors.brand700 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  buttonOutlinePressed: { backgroundColor: colors.gray50 },
  buttonOutlineText: { color: colors.gray900, fontSize: 14, fontWeight: '600' },
})
