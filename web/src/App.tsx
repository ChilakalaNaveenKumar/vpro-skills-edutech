import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TopicsPage from './pages/TopicsPage'
import AssessmentPage from './pages/AssessmentPage'
import ResultsPage from './pages/ResultsPage'
import ResultDetailPage from './pages/ResultDetailPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import AdminTopicsPage from './pages/AdminTopicsPage'
import AdminAssessmentsPage from './pages/AdminAssessmentsPage'
import AdminAssessmentQuestionsPage from './pages/AdminAssessmentQuestionsPage'
import AdminBatchesPage from './pages/AdminBatchesPage'
import AdminStudentsPage from './pages/AdminStudentsPage'
import AdminStudentEnrollmentsPage from './pages/AdminStudentEnrollmentsPage'
import AdminResultsPage from './pages/AdminResultsPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses/:courseId/topics" element={<TopicsPage />} />
          <Route path="/topics/:topicId/assessment" element={<AssessmentPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/:attemptId" element={<ResultDetailPage />} />
        </Route>
      </Route>

      {/* /admin routes deliberately sit OUTSIDE PublicLayout - AdminLayout
          is its own self-contained header/nav (including its own "Back to
          site" link and logo), so nesting it inside PublicLayout as well
          rendered two stacked headers/logos on every admin page. */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* Lands on Batches, not Courses - the Courses tab was
              removed from admin nav 2026-08-31 (see AdminLayout.tsx). */}
          <Route index element={<Navigate to="batches" replace />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId/topics" element={<AdminTopicsPage />} />
          <Route path="assessments" element={<AdminAssessmentsPage />} />
          <Route path="assessments/:assessmentId/questions" element={<AdminAssessmentQuestionsPage />} />
          <Route path="batches" element={<AdminBatchesPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route
            path="students/:studentId/enrollments"
            element={<AdminStudentEnrollmentsPage />}
          />
          <Route path="results" element={<AdminResultsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
