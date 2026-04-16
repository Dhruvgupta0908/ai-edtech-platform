// frontend/src/pages/Home.jsx
// UPDATED — Navbar added to Home page so the dark mode toggle is accessible
// on the public landing page too.

import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/ai-education.jpg";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="home">

      {/* ── NAVBAR (includes dark mode toggle) ── */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            Master CS Fundamentals with <span>CoreMind AI</span>
          </h1>
          <p>
            Learn Operating Systems, DBMS, Computer Networks and more with AI
            powered explanations, practice tests and smart learning paths
            designed for GATE and placements.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="primary-btn">Get Started</Link>
            <Link to="/login"  className="primary-btn">Login</Link>
          </div>
        </div>
        <div className="hero-right">
          <img src={heroImage} alt="AI Learning Platform" />
        </div>
      </section>

      {/* COURSES SECTION */}
      <section className="courses-section">
        <h2>Core CS Subjects</h2>
        <div className="courses-grid">
          {[
            { title: "Operating Systems",      desc: "Processes, Scheduling, Memory, Deadlocks" },
            { title: "Computer Networks",       desc: "OSI Model, TCP/IP, Routing, Congestion" },
            { title: "Data Structures",         desc: "Arrays, Trees, Graphs, Hashing" },
            { title: "Algorithms",              desc: "Greedy, DP, Graph Algorithms" },
            { title: "Database Systems",        desc: "SQL, Normalization, Transactions" },
            { title: "Discrete Mathematics",    desc: "Logic, Graph Theory, Combinatorics" },
            { title: "Compiler Design",         desc: "Lexical Analysis, Parsing, Code Generation" },
            { title: "Theory of Computation",   desc: "Automata, Regular Languages, Turing Machines" },
          ].map((c, i) => (
            <div key={i} className="course-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <Link to="/login"><button>Start Learning</button></Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <h2>AI Powered Learning</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🤖 AI Doubt Solver</h3>
            <p>Ask questions and get instant explanations.</p>
          </div>
          <div className="feature-card">
            <h3>📊 Smart Progress Tracking</h3>
            <p>Track subject completion and weak areas.</p>
          </div>
          <div className="feature-card">
            <h3>📝 Practice Tests</h3>
            <p>Test your concepts with MCQs and quizzes.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;