const subjectsData = {
  "operating-systems": {
    title: "Operating Systems",
    topics: [
      { title: "Introduction to Operating Systems", key: "introduction-to-operating-systems", prerequisites: [] },
      { title: "System Calls and OS Structure", key: "system-calls-and-os-structure", prerequisites: ["Introduction to Operating Systems"] },
      { title: "Process Concept", key: "process-concept", prerequisites: ["Introduction to Operating Systems"] },
      { title: "Process Scheduling", key: "process-scheduling", prerequisites: ["Process Concept"] },
      { title: "Threads and Multithreading", key: "threads-and-multithreading", prerequisites: ["Process Concept"] },
      { title: "Process Synchronization", key: "process-synchronization", prerequisites: ["Process Concept", "Threads and Multithreading"] },
      { title: "Deadlocks", key: "deadlocks", prerequisites: ["Process Synchronization"] },
      { title: "Memory Management", key: "memory-management", prerequisites: ["Introduction to Operating Systems"] },
      { title: "Virtual Memory", key: "virtual-memory", prerequisites: ["Memory Management"] },
      { title: "File Systems", key: "file-systems", prerequisites: ["Memory Management"] },
    ]
  },
  "computer-networks": {
    title: "Computer Networks",
    topics: [
      { title: "Introduction to Computer Networks", key: "introduction-to-computer-networks", prerequisites: [] },
      { title: "OSI and TCP/IP Models", key: "osi-and-tcp-ip-models", prerequisites: ["Introduction to Computer Networks"] },
      { title: "Physical Layer", key: "physical-layer", prerequisites: ["OSI and TCP/IP Models"] },
      { title: "Data Link Layer", key: "data-link-layer", prerequisites: ["Physical Layer"] },
      { title: "Network Layer", key: "network-layer", prerequisites: ["Data Link Layer"] },
      { title: "Transport Layer", key: "transport-layer", prerequisites: ["Network Layer"] },
      { title: "Application Layer", key: "application-layer", prerequisites: ["Transport Layer"] },
      { title: "Routing Algorithms", key: "routing-algorithms", prerequisites: ["Network Layer"] },
      { title: "Congestion Control", key: "congestion-control", prerequisites: ["Transport Layer"] },
      { title: "Network Security Basics", key: "network-security-basics", prerequisites: ["Transport Layer", "Application Layer"] }
    ]
  },
  "data-structures": {
    title: "Data Structures",
    topics: [
      { title: "Introduction to Data Structures", key: "introduction-to-data-structures", prerequisites: [] },
      { title: "Arrays", key: "arrays", prerequisites: ["Introduction to Data Structures"] },
      { title: "Linked Lists", key: "linked-lists", prerequisites: ["Arrays"] },
      { title: "Stacks", key: "stacks", prerequisites: ["Arrays"] },
      { title: "Queues", key: "queues", prerequisites: ["Arrays"] },
      { title: "Trees", key: "trees", prerequisites: ["Linked Lists", "Stacks"] },
      { title: "Binary Search Trees", key: "binary-search-trees", prerequisites: ["Trees"] },
      { title: "Heaps and Priority Queues", key: "heaps-and-priority-queues", prerequisites: ["Trees"] },
      { title: "Graphs", key: "graphs", prerequisites: ["Trees", "Linked Lists"] },
      { title: "Hashing", key: "hashing", prerequisites: ["Arrays"] }
    ]
  },
  "algorithms": {
    title: "Algorithms",
    topics: [
      { title: "Algorithm Analysis and Asymptotic Notations", key: "algorithm-analysis-and-asymptotic-notations", prerequisites: [] },
      { title: "Recursion and Divide & Conquer", key: "recursion-and-divide-and-conquer", prerequisites: ["Algorithm Analysis and Asymptotic Notations"] },
      { title: "Greedy Algorithms", key: "greedy-algorithms", prerequisites: ["Algorithm Analysis and Asymptotic Notations"] },
      { title: "Dynamic Programming", key: "dynamic-programming", prerequisites: ["Recursion and Divide and Conquer"] },
      { title: "Backtracking", key: "backtracking", prerequisites: ["Recursion and Divide and Conquer"] },
      { title: "Branch and Bound", key: "branch-and-bound", prerequisites: ["Backtracking"] },
      { title: "Graph Algorithms", key: "graph-algorithms", prerequisites: ["Recursion and Divide and Conquer"] },
      { title: "Shortest Path Algorithms", key: "shortest-path-algorithms", prerequisites: ["Graph Algorithms"] },
      { title: "Minimum Spanning Tree", key: "minimum-spanning-tree", prerequisites: ["Graph Algorithms", "Greedy Algorithms"] },
      { title: "NP-Completeness", key: "np-completeness", prerequisites: ["Algorithm Analysis and Asymptotic Notations"] }
    ]
  },
  "dbms": {
    title: "Database Management Systems",
    topics: [
      { title: "Introduction to DBMS", key: "introduction-to-dbms", prerequisites: [] },
      { title: "ER Model", key: "er-model", prerequisites: ["Introduction to DBMS"] },
      { title: "Relational Model", key: "relational-model", prerequisites: ["ER Model"] },
      { title: "SQL", key: "sql", prerequisites: ["Relational Model"] },
      { title: "Relational Algebra", key: "relational-algebra", prerequisites: ["Relational Model"] },
      { title: "Normalization", key: "normalization", prerequisites: ["Relational Model"] },
      { title: "Transaction Management", key: "transaction-management", prerequisites: ["SQL"] },
      { title: "Concurrency Control", key: "concurrency-control", prerequisites: ["Transaction Management"] },
      { title: "Indexing and Hashing", key: "indexing-and-hashing", prerequisites: ["SQL"] },
      { title: "Recovery Techniques", key: "recovery-techniques", prerequisites: ["Transaction Management"] }
    ]
  },
  "compiler-design": {
    title: "Compiler Design",
    topics: [
      { title: "Introduction to Compilers", key: "introduction-to-compilers", prerequisites: [] },
      { title: "Lexical Analysis", key: "lexical-analysis", prerequisites: ["Introduction to Compilers"] },
      { title: "Syntax Analysis", key: "syntax-analysis", prerequisites: ["Lexical Analysis"] },
      { title: "Parsing Techniques", key: "parsing-techniques", prerequisites: ["Syntax Analysis"] },
      { title: "Semantic Analysis", key: "semantic-analysis", prerequisites: ["Syntax Analysis"] },
      { title: "Intermediate Code Generation", key: "intermediate-code-generation", prerequisites: ["Semantic Analysis"] },
      { title: "Code Optimization", key: "code-optimization", prerequisites: ["Intermediate Code Generation"] },
      { title: "Code Generation", key: "code-generation", prerequisites: ["Code Optimization"] },
      { title: "Symbol Table", key: "symbol-table", prerequisites: ["Introduction to Compilers"] },
      { title: "Runtime Environment", key: "runtime-environment", prerequisites: ["Code Generation"] }
    ]
  },
  "discrete-mathematics": {
    title: "Discrete Mathematics",
    topics: [
      { title: "Propositional Logic", key: "propositional-logic", prerequisites: [] },
      { title: "Predicate Logic", key: "predicate-logic", prerequisites: ["Propositional Logic"] },
      { title: "Set Theory", key: "set-theory", prerequisites: [] },
      { title: "Relations and Functions", key: "relations-and-functions", prerequisites: ["Set Theory"] },
      { title: "Mathematical Induction", key: "mathematical-induction", prerequisites: ["Propositional Logic"] },
      { title: "Combinatorics", key: "combinatorics", prerequisites: ["Set Theory"] },
      { title: "Recurrence Relations", key: "recurrence-relations", prerequisites: ["Mathematical Induction", "Combinatorics"] },
      { title: "Graph Theory", key: "graph-theory", prerequisites: ["Relations and Functions"] },
      { title: "Trees", key: "trees", prerequisites: ["Graph Theory"] },
      { title: "Boolean Algebra", key: "boolean-algebra", prerequisites: ["Propositional Logic"] }
    ]
  },
  "theory-of-computation": {
    title: "Theory of Computation",
    topics: [
      { title: "Introduction to Automata Theory", key: "introduction-to-automata-theory", prerequisites: [] },
      { title: "Finite Automata", key: "finite-automata", prerequisites: ["Introduction to Automata Theory"] },
      { title: "Regular Expressions", key: "regular-expressions", prerequisites: ["Finite Automata"] },
      { title: "Context-Free Grammars", key: "context-free-grammars", prerequisites: ["Regular Expressions"] },
      { title: "Pushdown Automata", key: "pushdown-automata", prerequisites: ["Context-Free Grammars"] },
      { title: "Turing Machines", key: "turing-machines", prerequisites: ["Pushdown Automata"] },
      { title: "Undecidability", key: "undecidability", prerequisites: ["Turing Machines"] },
      { title: "Decidability Problems", key: "decidability-problems", prerequisites: ["Undecidability"] },
      { title: "Chomsky Hierarchy", key: "chomsky-hierarchy", prerequisites: ["Context-Free Grammars"] },
      { title: "Complexity Theory Basics", key: "complexity-theory-basics", prerequisites: ["Turing Machines"] }
    ]
  }
};

export default subjectsData;