// frontend/src/data/SubjectsData.js
// FIXED — slugify now converts & to 'and' before removing special chars
// This makes "Recursion and Divide & Conquer" → "recursion-and-divide-and-conquer"
// which matches what is stored in MongoDB

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/&/g, "and")          // & → and  (must be BEFORE removing special chars)
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");
};

const subjectsData = {
  "operating-systems": {
    title: "Operating Systems",
    topics: [
      { title: "Introduction to Operating Systems",  prerequisites: [] },
      { title: "System Calls and OS Structure",      prerequisites: ["Introduction to Operating Systems"] },
      { title: "Process Concept",                    prerequisites: ["System Calls and OS Structure"] },
      { title: "Process Scheduling",                 prerequisites: ["Process Concept"] },
      { title: "Threads and Multithreading",         prerequisites: ["Process Concept"] },
      { title: "Process Synchronization",            prerequisites: ["Process Concept"] },
      { title: "Deadlocks",                          prerequisites: ["Process Synchronization"] },
      { title: "Memory Management",                  prerequisites: ["Process Concept"] },
      { title: "Virtual Memory",                     prerequisites: ["Memory Management"] },
      { title: "File Systems",                       prerequisites: ["Memory Management"] }
    ]
  },

  "computer-networks": {
    title: "Computer Networks",
    topics: [
      { title: "Introduction to Computer Networks",  prerequisites: [] },
      { title: "OSI and TCP/IP Models",              prerequisites: ["Introduction to Computer Networks"] },
      { title: "Physical Layer",                     prerequisites: ["OSI and TCP/IP Models"] },
      { title: "Data Link Layer",                    prerequisites: ["Physical Layer"] },
      { title: "Network Layer",                      prerequisites: ["Data Link Layer"] },
      { title: "Transport Layer",                    prerequisites: ["Network Layer"] },
      { title: "Application Layer",                  prerequisites: ["Transport Layer"] },
      { title: "Routing Algorithms",                 prerequisites: ["Network Layer"] },
      { title: "Congestion Control",                 prerequisites: ["Transport Layer"] },
      { title: "Network Security Basics",            prerequisites: ["Application Layer"] }
    ]
  },

  "data-structures": {
    title: "Data Structures",
    topics: [
      { title: "Introduction to Data Structures",    prerequisites: [] },
      { title: "Arrays",                             prerequisites: ["Introduction to Data Structures"] },
      { title: "Linked Lists",                       prerequisites: ["Arrays"] },
      { title: "Stacks",                             prerequisites: ["Linked Lists"] },
      { title: "Queues",                             prerequisites: ["Stacks"] },
      { title: "Trees",                              prerequisites: ["Queues"] },
      { title: "Binary Search Trees",                prerequisites: ["Trees"] },
      { title: "Heaps and Priority Queues",          prerequisites: ["Trees"] },
      { title: "Graphs",                             prerequisites: ["Trees"] },
      { title: "Hashing",                            prerequisites: ["Arrays"] }
    ]
  },

  "algorithms": {
    title: "Algorithms",
    topics: [
      { title: "Algorithm Analysis and Asymptotic Notations", prerequisites: [] },
      { title: "Recursion and Divide & Conquer",              prerequisites: ["Algorithm Analysis and Asymptotic Notations"] },
      { title: "Greedy Algorithms",                           prerequisites: ["Recursion and Divide & Conquer"] },
      { title: "Dynamic Programming",                         prerequisites: ["Recursion and Divide & Conquer"] },
      { title: "Backtracking",                                prerequisites: ["Recursion and Divide & Conquer"] },
      { title: "Branch and Bound",                            prerequisites: ["Backtracking"] },
      { title: "Graph Algorithms",                            prerequisites: ["Dynamic Programming"] },
      { title: "Shortest Path Algorithms",                    prerequisites: ["Graph Algorithms"] },
      { title: "Minimum Spanning Tree",                       prerequisites: ["Graph Algorithms"] },
      { title: "NP-Completeness",                             prerequisites: ["Dynamic Programming"] }
    ]
  },

  "dbms": {
    title: "Database Management Systems",
    topics: [
      { title: "Introduction to DBMS",      prerequisites: [] },
      { title: "ER Model",                  prerequisites: ["Introduction to DBMS"] },
      { title: "Relational Model",          prerequisites: ["ER Model"] },
      { title: "SQL",                       prerequisites: ["Relational Model"] },
      { title: "Relational Algebra",        prerequisites: ["Relational Model"] },
      { title: "Normalization",             prerequisites: ["Relational Model"] },
      { title: "Transaction Management",    prerequisites: ["Normalization"] },
      { title: "Concurrency Control",       prerequisites: ["Transaction Management"] },
      { title: "Indexing and Hashing",      prerequisites: ["SQL"] },
      { title: "Recovery Techniques",       prerequisites: ["Transaction Management"] }
    ]
  },

  "compiler-design": {
    title: "Compiler Design",
    topics: [
      { title: "Introduction to Compilers",        prerequisites: [] },
      { title: "Lexical Analysis",                 prerequisites: ["Introduction to Compilers"] },
      { title: "Syntax Analysis",                  prerequisites: ["Lexical Analysis"] },
      { title: "Parsing Techniques",               prerequisites: ["Syntax Analysis"] },
      { title: "Semantic Analysis",                prerequisites: ["Parsing Techniques"] },
      { title: "Intermediate Code Generation",     prerequisites: ["Semantic Analysis"] },
      { title: "Code Optimization",                prerequisites: ["Intermediate Code Generation"] },
      { title: "Code Generation",                  prerequisites: ["Code Optimization"] },
      { title: "Symbol Table",                     prerequisites: ["Semantic Analysis"] },
      { title: "Runtime Environment",              prerequisites: ["Code Generation"] }
    ]
  },

  "discrete-mathematics": {
    title: "Discrete Mathematics",
    topics: [
      { title: "Propositional Logic",        prerequisites: [] },
      { title: "Predicate Logic",            prerequisites: ["Propositional Logic"] },
      { title: "Set Theory",                 prerequisites: ["Predicate Logic"] },
      { title: "Relations and Functions",    prerequisites: ["Set Theory"] },
      { title: "Mathematical Induction",     prerequisites: ["Relations and Functions"] },
      { title: "Combinatorics",              prerequisites: ["Mathematical Induction"] },
      { title: "Recurrence Relations",       prerequisites: ["Combinatorics"] },
      { title: "Graph Theory",               prerequisites: ["Recurrence Relations"] },
      { title: "Trees",                      prerequisites: ["Graph Theory"] },
      { title: "Boolean Algebra",            prerequisites: ["Propositional Logic"] }
    ]
  },

  "theory-of-computation": {
    title: "Theory of Computation",
    topics: [
      { title: "Introduction to Automata Theory",  prerequisites: [] },
      { title: "Finite Automata",                  prerequisites: ["Introduction to Automata Theory"] },
      { title: "Regular Expressions",              prerequisites: ["Finite Automata"] },
      { title: "Context-Free Grammars",            prerequisites: ["Regular Expressions"] },
      { title: "Pushdown Automata",                prerequisites: ["Context-Free Grammars"] },
      { title: "Turing Machines",                  prerequisites: ["Pushdown Automata"] },
      { title: "Undecidability",                   prerequisites: ["Turing Machines"] },
      { title: "Decidability Problems",            prerequisites: ["Turing Machines"] },
      { title: "Chomsky Hierarchy",                prerequisites: ["Context-Free Grammars"] },
      { title: "Complexity Theory Basics",         prerequisites: ["Turing Machines"] }
    ]
  }
};

/* ADD KEYS AUTOMATICALLY */
Object.keys(subjectsData).forEach(subject => {
  subjectsData[subject].topics = subjectsData[subject].topics.map(topic => ({
    ...topic,
    key: slugify(topic.title)
  }));
});

export default subjectsData;