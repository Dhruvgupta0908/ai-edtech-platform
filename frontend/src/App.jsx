// frontend/src/App.jsx
// UPDATED — DarkModeToggle added globally so it appears on every single page

import { Routes, Route } from "react-router-dom";

import Home            from "./pages/Home";
import Login           from "./pages/Login";
import Signup          from "./pages/Signup";
import Dashboard       from "./pages/Dashboard";
import SubjectPage     from "./pages/SubjectPage";
import TopicPage       from "./pages/Topicpage";
import ProfilePage     from "./pages/ProfilePage";
import AnalyticsPage   from "./pages/AnalyticsPage";
import ConceptMap      from "./pages/ConceptMap";
import StudyPlan       from "./pages/StudyPlan";
import DarkModeToggle  from "./components/DarkModeToggle";

function App() {
  return (
    <>
      {/* Floating dark mode toggle — visible on every page automatically */}
      <DarkModeToggle />

      <Routes>
        <Route path="/"                              element={<Home />}          />
        <Route path="/login"                         element={<Login />}         />
        <Route path="/signup"                        element={<Signup />}        />
        <Route path="/dashboard"                     element={<Dashboard />}     />
        <Route path="/profile"                       element={<ProfilePage />}   />
        <Route path="/subject/:subjectName"          element={<SubjectPage />}   />
        <Route path="/topic/:subjectName/:topicName" element={<TopicPage />}     />
        <Route path="/analytics"                     element={<AnalyticsPage />} />
        <Route path="/concept-map/:subjectName"      element={<ConceptMap />}    />
        <Route path="/study-plan"                    element={<StudyPlan />}     />
      </Routes>
    </>
  );
}

export default App;