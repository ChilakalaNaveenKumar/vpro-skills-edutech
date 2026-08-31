import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/RootNavigator'
import { getCourse } from '../services/coursesService'
import { listCourseTopics } from '../services/topicsService'
import type { Course, Topic } from '../types'
import colors from '../theme/colors'

type Props = NativeStackScreenProps<AppStackParamList, 'Topics'>

// Course -> topic navigation (Phase 10), porting
// web/src/pages/TopicsPage.tsx. Backend already enforces enrollment for a
// non-admin caller (Phase 4) - this screen just renders what it's given.
export default function TopicsScreen({ route, navigation }: Props) {
  const { courseId } = route.params

  const [course, setCourse] = useState<Course | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([getCourse(courseId), listCourseTopics(courseId)])
      .then(([courseData, topicsData]) => {
        if (!isMounted) return
        setCourse(courseData)
        setTopics(topicsData)
        navigation.setOptions({ title: courseData.name })
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Could not load this course’s topics right now. Please try again later.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
    // navigation is stable across renders (React Navigation guarantees this),
    // so it's intentionally left out of the dependency array to avoid
    // re-fetching on every navigation state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

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
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{course?.name}</Text>

      {topics.length === 0 ? (
        <Text style={styles.muted}>No topics have been added to this course yet.</Text>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(topic) => String(topic.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: topic }) => (
            <View style={styles.row}>
              <Text style={styles.rowTitle}>{topic.name}</Text>
              <Pressable
                onPress={() => navigation.navigate('Assessment', { topicId: topic.id })}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              >
                <Text style={styles.buttonText}>Start Assessment</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.white },
  title: { fontSize: 20, fontWeight: '600', color: colors.gray900 },
  muted: { marginTop: 12, color: colors.gray500 },
  errorText: { marginTop: 12, color: colors.red600 },
  listContent: { paddingTop: 16, paddingBottom: 24, gap: 10 },
  row: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.gray900 },
  button: { backgroundColor: colors.brand600, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12 },
  buttonPressed: { backgroundColor: colors.brand700 },
  buttonText: { color: colors.white, fontSize: 13, fontWeight: '600' },
})
