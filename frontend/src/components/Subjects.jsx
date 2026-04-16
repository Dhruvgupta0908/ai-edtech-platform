function Subjects() {
  const subjects = ["Operating Systems", "Computer Networks", "Data Structures", "DBMS","Toc","Discrete Mathematics","Algorithms"];

  return (
    <section className="subjects">
      <h2>Core Subjects</h2>
      <div className="subject-grid">
        {subjects.map((subject, index) => (
          <div key={index} className="card">
            {subject}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Subjects;
