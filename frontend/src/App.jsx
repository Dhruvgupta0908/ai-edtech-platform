// frontend/src/App.jsx
// FINAL — includes Leaderboard route

import { Routes, Route } from "react-router-dom";

import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import SubjectPage    from "./pages/SubjectPage";
import TopicPage      from "./pages/Topicpage";
import ProfilePage    from "./pages/ProfilePage";
import AnalyticsPage  from "./pages/AnalyticsPage";
import ConceptMap     from "./pages/ConceptMap";
import StudyPlan      from "./pages/StudyPlan";
import Leaderboard    from "./pages/Leaderboard";
import DarkModeToggle from "./components/DarkModeToggle";

function App() {
  return (
    <>
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
        <Route path="/leaderboard"                   element={<Leaderboard />}   />
      </Routes>
    </>
  );
}

export default App;