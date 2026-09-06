import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import BatchesPage from './pages/BatchesPage'
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
import AdminContentPage from './pages/AdminContentPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import DataDeletionPage from './pages/DataDeletionPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<HomePage />} />
        <Route path="/batches" element={<BatchesPage />} />
        {/* Linked from the footer since it shipped; until now all three fell
            through to the catch-all and rendered a 404. Meta will not approve
            an ad account without a reachable privacy and data-deletion URL. */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/data-deletion" element={<DataDeletionPage />} />
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
          <Route path="content" element={<AdminContentPage />} />
        </Route>
      </Route>

      {/* Inside PublicLayout so an unmatched path still gets the header, the
          footer and a way back, rather than the blank screen it rendered
          before. */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
