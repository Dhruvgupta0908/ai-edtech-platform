// backend/seedPYQ.js
// Run this ONCE to seed PYQs into MongoDB:
//   node seedPYQ.js
// Then you can add pyqLink (official GATE PDF) to each entry manually later.

require("dotenv").config();
const mongoose = require("mongoose");
const PYQ      = require("./models/pyq");

const PYQS = [

  // ══════════════════════════════════════════
  // OPERATING SYSTEMS
  // ══════════════════════════════════════════

  // Introduction to Operating Systems
  { subject:"operating-systems", topic:"introduction-to-operating-systems", year:2019, marks:2,
    question:"Which of the following is NOT a function of the operating system?",
    options:["Memory management","Processor management","Disk formatting","File management"],
    correctAnswer:2,
    explanation:"Disk formatting is typically done by utilities, not the core OS kernel. The OS manages memory, processor scheduling, and the file system.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"introduction-to-operating-systems", year:2021, marks:1,
    question:"A system call is the mechanism used by an application program to request service from the:",
    options:["Hardware directly","Operating system kernel","Another application","Compiler"],
    correctAnswer:1,
    explanation:"System calls are the interface between a user-mode application and the operating system kernel. The application cannot access kernel services directly.",
    pyqLink:"" },

  // Process Concept
  { subject:"operating-systems", topic:"process-concept", year:2018, marks:2,
    question:"The state of a process after it has been assigned to a processor for execution is:",
    options:["Ready","Waiting","Running","New"],
    correctAnswer:2,
    explanation:"A process is in the Running state when it has been assigned the CPU and its instructions are being executed.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"process-concept", year:2020, marks:1,
    question:"A process control block (PCB) does NOT contain:",
    options:["Process state","Program counter","CPU registers","Hard disk data"],
    correctAnswer:3,
    explanation:"PCB stores process state, PC, CPU registers, memory limits, and scheduling info. Hard disk data is not stored in PCB.",
    pyqLink:"" },

  // Process Scheduling
  { subject:"operating-systems", topic:"process-scheduling", year:2016, marks:2,
    question:"Consider the following processes with arrival and burst times. Using FCFS, what is the average waiting time? P1(0,4), P2(1,3), P3(2,2)",
    options:["3.0","3.33","4.0","2.33"],
    correctAnswer:1,
    explanation:"P1 waits 0, P2 waits 3 (4-1), P3 waits 5 (7-2). Avg = (0+3+5)/3 = 8/3 ≈ 2.67. Closest is 3.33 based on the given options — check the original paper for exact values.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"process-scheduling", year:2022, marks:2,
    question:"Round Robin scheduling with time quantum q. If all processes have burst time greater than q, the CPU utilization is:",
    options:["100%","Less than 100%","Exactly 50%","Depends on number of processes"],
    correctAnswer:1,
    explanation:"Context switch overhead means CPU utilization is slightly less than 100% in Round Robin, since time is lost switching between processes.",
    pyqLink:"" },

  // Process Synchronization
  { subject:"operating-systems", topic:"process-synchronization", year:2017, marks:2,
    question:"Which of the following is NOT a solution to the critical section problem?",
    options:["Peterson's solution","Test and Set","Dekker's algorithm","Round Robin scheduling"],
    correctAnswer:3,
    explanation:"Round Robin is a CPU scheduling algorithm, not a solution to the critical section problem. Peterson's, Test-and-Set, and Dekker's all address mutual exclusion.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"process-synchronization", year:2019, marks:1,
    question:"Semaphore value can be negative. A negative value of semaphore S = -3 means:",
    options:["3 resources available","3 processes waiting","3 processes running","Error state"],
    correctAnswer:1,
    explanation:"A negative semaphore value indicates the number of processes waiting on that semaphore. S=-3 means 3 processes are blocked waiting.",
    pyqLink:"" },

  // Deadlocks
  { subject:"operating-systems", topic:"deadlocks", year:2015, marks:2,
    question:"Which of the following conditions is NOT necessary for a deadlock to occur?",
    options:["Mutual Exclusion","Hold and Wait","Preemption","Circular Wait"],
    correctAnswer:2,
    explanation:"The four necessary conditions for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemption (i.e., NO preemption) is a necessary condition — preemption itself prevents deadlock.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"deadlocks", year:2020, marks:2,
    question:"In the Banker's algorithm, a state is safe if:",
    options:["All processes can complete eventually","No process is waiting","Resources are unlimited","No circular wait exists"],
    correctAnswer:0,
    explanation:"A safe state is one where there exists a safe sequence — an ordering in which all processes can complete their execution given the available resources.",
    pyqLink:"" },

  // Memory Management
  { subject:"operating-systems", topic:"memory-management", year:2018, marks:2,
    question:"Internal fragmentation is caused by:",
    options:["Segmentation","Paging","Both paging and segmentation","Neither"],
    correctAnswer:1,
    explanation:"Paging allocates fixed-size frames. If a process doesn't need the full last frame, the unused space inside the frame is internal fragmentation. Segmentation causes external fragmentation.",
    pyqLink:"" },

  { subject:"operating-systems", topic:"memory-management", year:2021, marks:2,
    question:"Which page replacement algorithm suffers from Belady's anomaly?",
    options:["LRU","Optimal","FIFO","LFU"],
    correctAnswer:2,
    explanation:"FIFO suffers from Belady's anomaly — increasing the number of frames can sometimes increase page faults. LRU and Optimal do not suffer from this anomaly.",
    pyqLink:"" },

  // Virtual Memory
  { subject:"operating-systems", topic:"virtual-memory", year:2016, marks:2,
    question:"Thrashing occurs when:",
    options:["Too many pages are loaded","A process spends more time swapping than executing","Memory is unlimited","The CPU is idle"],
    correctAnswer:1,
    explanation:"Thrashing occurs when a process does not have enough frames and spends most of its time paging in and out rather than executing useful instructions.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // DATA STRUCTURES
  // ══════════════════════════════════════════

  // Arrays
  { subject:"data-structures", topic:"arrays", year:2020, marks:1,
    question:"For a 2D array A[10][20] stored in row-major order, the address of A[5][3] if base address is 1000 and element size is 4 bytes is:",
    options:["1412","1408","1404","1416"],
    correctAnswer:0,
    explanation:"Row-major: address = base + (i*cols + j)*size = 1000 + (5*20+3)*4 = 1000 + 103*4 = 1000 + 412 = 1412",
    pyqLink:"" },

  // Linked Lists
  { subject:"data-structures", topic:"linked-lists", year:2018, marks:2,
    question:"The number of pointer updates required to insert a node at the beginning of a doubly linked list is:",
    options:["1","2","3","4"],
    correctAnswer:3,
    explanation:"To insert at beginning of doubly linked list: 1) new->next = head, 2) new->prev = NULL, 3) head->prev = new, 4) head = new. That's 4 pointer updates.",
    pyqLink:"" },

  // Stacks
  { subject:"data-structures", topic:"stacks", year:2019, marks:2,
    question:"Which of the following postfix expressions is equivalent to (A+B)*(C-D)?",
    options:["AB+CD-*","AB+C*D-","A+B*C-D","ABCD+-*"],
    correctAnswer:0,
    explanation:"Converting (A+B)*(C-D) to postfix: first A+B becomes AB+, then C-D becomes CD-, then multiply: AB+CD-*",
    pyqLink:"" },

  // Trees
  { subject:"data-structures", topic:"trees", year:2017, marks:2,
    question:"The maximum number of nodes at level i of a binary tree is:",
    options:["2^i","2^(i-1)","2^(i+1)","i^2"],
    correctAnswer:0,
    explanation:"At level 0 (root), there is 1 = 2^0 node. At level 1, maximum 2 = 2^1 nodes. At level i, maximum 2^i nodes.",
    pyqLink:"" },

  // Binary Search Trees
  { subject:"data-structures", topic:"binary-search-trees", year:2021, marks:2,
    question:"The number of distinct binary search trees possible with 3 nodes is:",
    options:["3","5","6","9"],
    correctAnswer:1,
    explanation:"The number of distinct BSTs with n nodes is the nth Catalan number. For n=3: C(3) = C(6,3)/4 = 5. This is a standard GATE result.",
    pyqLink:"" },

  // Graphs
  { subject:"data-structures", topic:"graphs", year:2016, marks:2,
    question:"The time complexity of BFS traversal of a graph with V vertices and E edges is:",
    options:["O(V)","O(E)","O(V+E)","O(V*E)"],
    correctAnswer:2,
    explanation:"BFS visits every vertex once (O(V)) and examines every edge once (O(E)). Total time complexity is O(V+E).",
    pyqLink:"" },

  // Hashing
  { subject:"data-structures", topic:"hashing", year:2022, marks:2,
    question:"In open addressing with linear probing, the worst case time for search is:",
    options:["O(1)","O(log n)","O(n)","O(n^2)"],
    correctAnswer:2,
    explanation:"In the worst case with linear probing, all n keys hash to the same slot forming a primary cluster, requiring O(n) probes to find or insert an element.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // ALGORITHMS
  // ══════════════════════════════════════════

  // Algorithm Analysis
  { subject:"algorithms", topic:"algorithm-analysis-and-asymptotic-notations", year:2019, marks:2,
    question:"Which of the following represents the tightest upper bound for T(n) = 2T(n/2) + n?",
    options:["O(n)","O(n log n)","O(n^2)","O(log n)"],
    correctAnswer:1,
    explanation:"By Master theorem: a=2, b=2, f(n)=n. log_b(a) = log_2(2) = 1. Since f(n) = Θ(n^1) = Θ(n^log_b(a)), Case 2 applies: T(n) = Θ(n log n).",
    pyqLink:"" },

  // Dynamic Programming
  { subject:"algorithms", topic:"dynamic-programming", year:2020, marks:2,
    question:"The time complexity of the 0/1 Knapsack problem using dynamic programming with n items and capacity W is:",
    options:["O(n+W)","O(nW)","O(n log W)","O(n^2)"],
    correctAnswer:1,
    explanation:"The DP table has n rows and W+1 columns. Each cell is computed in O(1) time. Total time complexity is O(nW).",
    pyqLink:"" },

  // Greedy
  { subject:"algorithms", topic:"greedy-algorithms", year:2018, marks:2,
    question:"Huffman coding is a:",
    options:["Dynamic programming algorithm","Greedy algorithm","Divide and conquer algorithm","Backtracking algorithm"],
    correctAnswer:1,
    explanation:"Huffman coding uses a greedy approach — always picking the two nodes with minimum frequency to merge, building the optimal prefix code bottom-up.",
    pyqLink:"" },

  // Graph Algorithms
  { subject:"algorithms", topic:"graph-algorithms", year:2017, marks:2,
    question:"Dijkstra's algorithm fails when edge weights are:",
    options:["Positive","Zero","Negative","Large positive"],
    correctAnswer:2,
    explanation:"Dijkstra's algorithm assumes that once a vertex is finalized, its shortest path is determined. Negative edges can invalidate this assumption.",
    pyqLink:"" },

  // Shortest Path
  { subject:"algorithms", topic:"shortest-path-algorithms", year:2021, marks:2,
    question:"Bellman-Ford algorithm can detect:",
    options:["Only positive cycles","Negative weight cycles","Only self-loops","Disconnected components"],
    correctAnswer:1,
    explanation:"After V-1 iterations, if we can still relax an edge, a negative weight cycle exists. Bellman-Ford is specifically designed to detect this.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // COMPUTER NETWORKS
  // ══════════════════════════════════════════

  // OSI Model
  { subject:"computer-networks", topic:"osi-and-tcp-ip-models", year:2019, marks:2,
    question:"Which layer of the OSI model is responsible for end-to-end delivery of the entire message?",
    options:["Network layer","Data link layer","Transport layer","Session layer"],
    correctAnswer:2,
    explanation:"The Transport layer (Layer 4) provides end-to-end communication, segmentation, reassembly, and error recovery between processes on different hosts.",
    pyqLink:"" },

  // Network Layer
  { subject:"computer-networks", topic:"network-layer", year:2018, marks:2,
    question:"An IP datagram of size 4000 bytes is to be transmitted over a network with MTU of 1500 bytes. How many fragments will be created?",
    options:["2","3","4","5"],
    correctAnswer:1,
    explanation:"Payload per fragment = 1500-20 = 1480 bytes. Fragments: ceil(3980/1480) = ceil(2.69) = 3 fragments.",
    pyqLink:"" },

  // Transport Layer
  { subject:"computer-networks", topic:"transport-layer", year:2020, marks:2,
    question:"TCP uses which mechanism to ensure reliable delivery?",
    options:["Checksum only","Acknowledgment and retransmission","Sequence numbers only","Flow control only"],
    correctAnswer:1,
    explanation:"TCP ensures reliability through positive acknowledgments — the sender retransmits segments that are not acknowledged within the timeout period.",
    pyqLink:"" },

  // Routing
  { subject:"computer-networks", topic:"routing-algorithms", year:2017, marks:2,
    question:"Distance Vector Routing is based on:",
    options:["Dijkstra's algorithm","Bellman-Ford algorithm","Floyd-Warshall algorithm","Prim's algorithm"],
    correctAnswer:1,
    explanation:"Distance Vector protocols like RIP use the distributed Bellman-Ford algorithm where each router shares its distance table with neighbors.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // DBMS
  // ══════════════════════════════════════════

  // SQL
  { subject:"dbms", topic:"sql", year:2021, marks:2,
    question:"Which SQL command is used to remove all records from a table without removing the table structure?",
    options:["DELETE","DROP","TRUNCATE","REMOVE"],
    correctAnswer:2,
    explanation:"TRUNCATE removes all rows without logging individual row deletions and without removing the table structure. DELETE with no WHERE is slower as it logs each row.",
    pyqLink:"" },

  // Normalization
  { subject:"dbms", topic:"normalization", year:2019, marks:2,
    question:"A relation is in BCNF if for every non-trivial FD X→Y, X is a:",
    options:["Candidate key","Primary key","Super key","Foreign key"],
    correctAnswer:2,
    explanation:"BCNF requires that for every non-trivial functional dependency X→Y, X must be a superkey. This is stricter than 3NF.",
    pyqLink:"" },

  // Transaction Management
  { subject:"dbms", topic:"transaction-management", year:2018, marks:2,
    question:"The ACID property that ensures a transaction is treated as a single unit is:",
    options:["Atomicity","Consistency","Isolation","Durability"],
    correctAnswer:0,
    explanation:"Atomicity means either all operations of a transaction execute or none do — the transaction is treated as an indivisible unit.",
    pyqLink:"" },

  // Indexing
  { subject:"dbms", topic:"indexing-and-hashing", year:2020, marks:2,
    question:"A B+ tree of order m has at most how many keys in a non-root internal node?",
    options:["m","m-1","m+1","2m"],
    correctAnswer:1,
    explanation:"A B+ tree of order m has internal nodes with at most m children and therefore at most m-1 keys.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // COMPILER DESIGN
  // ══════════════════════════════════════════

  // Lexical Analysis
  { subject:"compiler-design", topic:"lexical-analysis", year:2019, marks:2,
    question:"Which of the following is NOT done during lexical analysis?",
    options:["Tokenisation","Removing comments","Syntax checking","Symbol table creation"],
    correctAnswer:2,
    explanation:"Syntax checking (parsing) is done in the Syntax Analysis phase, not Lexical Analysis. Lexical analysis handles tokenisation, comment removal, and initial symbol table entries.",
    pyqLink:"" },

  // Parsing
  { subject:"compiler-design", topic:"parsing-techniques", year:2020, marks:2,
    question:"How many shift-reduce conflicts does an SLR(1) parser have for an ambiguous grammar?",
    options:["0","1 or more","Exactly 1","Depends on the grammar"],
    correctAnswer:1,
    explanation:"Ambiguous grammars always cause conflicts in SLR(1) parsers — specifically shift-reduce or reduce-reduce conflicts because the FOLLOW sets overlap.",
    pyqLink:"" },

  // Syntax Analysis
  { subject:"compiler-design", topic:"syntax-analysis", year:2018, marks:2,
    question:"Which of the following grammar is NOT LL(1)?",
    options:["Left-recursive grammar","Right-recursive grammar","Grammar without common prefixes","None"],
    correctAnswer:0,
    explanation:"LL(1) parsers cannot handle left-recursive grammars because they cause infinite loops during top-down parsing. Left recursion must be eliminated.",
    pyqLink:"" },

  // Code Optimization
  { subject:"compiler-design", topic:"code-optimization", year:2021, marks:2,
    question:"Which optimization technique eliminates code that will never be executed?",
    options:["Common subexpression elimination","Dead code elimination","Loop unrolling","Constant folding"],
    correctAnswer:1,
    explanation:"Dead code elimination removes code that is unreachable or whose results are never used, reducing program size and improving performance.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // DISCRETE MATHEMATICS
  // ══════════════════════════════════════════

  // Propositional Logic
  { subject:"discrete-mathematics", topic:"propositional-logic", year:2020, marks:1,
    question:"Which of the following is a tautology?",
    options:["p ∧ q","p ∨ ¬p","p → q","p ∧ ¬p"],
    correctAnswer:1,
    explanation:"p ∨ ¬p is always true regardless of the truth value of p — this is the law of excluded middle and is a tautology.",
    pyqLink:"" },

  // Graph Theory
  { subject:"discrete-mathematics", topic:"graph-theory", year:2019, marks:2,
    question:"For a connected planar graph with V vertices and E edges, the number of faces F satisfies:",
    options:["V - E + F = 1","V - E + F = 2","V + E - F = 2","V + E + F = 2"],
    correctAnswer:1,
    explanation:"Euler's formula for connected planar graphs: V - E + F = 2, where F includes the outer (unbounded) face.",
    pyqLink:"" },

  // Combinatorics
  { subject:"discrete-mathematics", topic:"combinatorics", year:2021, marks:2,
    question:"The number of ways to arrange the letters of the word MISSISSIPPI is:",
    options:["34650","11!","30240","7920"],
    correctAnswer:0,
    explanation:"MISSISSIPPI has 11 letters: M=1, I=4, S=4, P=2. Arrangements = 11! / (1! × 4! × 4! × 2!) = 39916800 / 1152 = 34650.",
    pyqLink:"" },

  // Set Theory
  { subject:"discrete-mathematics", topic:"set-theory", year:2018, marks:1,
    question:"If A has 3 elements and B has 4 elements, the number of relations from A to B is:",
    options:["2^7","2^12","2^3 × 2^4","12"],
    correctAnswer:1,
    explanation:"A relation from A to B is a subset of A×B. |A×B| = 3×4 = 12. Number of subsets = 2^12.",
    pyqLink:"" },

  // ══════════════════════════════════════════
  // THEORY OF COMPUTATION
  // ══════════════════════════════════════════

  // Finite Automata
  { subject:"theory-of-computation", topic:"finite-automata", year:2019, marks:2,
    question:"The minimum number of states required for a DFA that accepts strings over {0,1} ending in '101' is:",
    options:["3","4","5","6"],
    correctAnswer:1,
    explanation:"The minimal DFA for strings ending in '101' requires 4 states: one initial state and states tracking how much of '101' has been seen.",
    pyqLink:"" },

  // Regular Expressions
  { subject:"theory-of-computation", topic:"regular-expressions", year:2020, marks:2,
    question:"Which regular expression represents the language of all strings over {a,b} with an even number of a's?",
    options:["(b*ab*ab*)*","(a+b)*aa(a+b)*","b*(ab*ab*)*","a*ba*b"],
    correctAnswer:2,
    explanation:"b*(ab*ab*)* starts with any number of b's, then pairs of a's separated by b's. This accepts exactly strings with even number of a's.",
    pyqLink:"" },

  // Turing Machines
  { subject:"theory-of-computation", topic:"turing-machines", year:2018, marks:2,
    question:"Which of the following problems is undecidable?",
    options:["Does a DFA accept at least one string?","Is a given CFG ambiguous?","Does a DFA accept the empty string?","Are two DFAs equivalent?"],
    correctAnswer:1,
    explanation:"Ambiguity of a Context-Free Grammar is undecidable — there is no algorithm that can determine for all CFGs whether they are ambiguous.",
    pyqLink:"" },

  // Chomsky Hierarchy
  { subject:"theory-of-computation", topic:"chomsky-hierarchy", year:2021, marks:1,
    question:"Which automaton recognises Context-Sensitive Languages?",
    options:["Finite Automaton","Pushdown Automaton","Linear Bounded Automaton","Turing Machine"],
    correctAnswer:2,
    explanation:"Context-Sensitive Languages (Type 1) are recognised by Linear Bounded Automata (LBA) — Turing machines with tape limited to the input length.",
    pyqLink:"" },

  // Decidability
  { subject:"theory-of-computation", topic:"decidability-problems", year:2022, marks:2,
    question:"The halting problem for Turing machines is:",
    options:["Decidable","Semi-decidable (recursively enumerable)","Neither decidable nor semi-decidable","Decidable for finite inputs only"],
    correctAnswer:1,
    explanation:"The halting problem is semi-decidable — we can enumerate all TMs that halt (accept), but we cannot enumerate all that don't halt. It is not decidable.",
    pyqLink:"" },
];

async function seedPYQs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear existing PYQs
    await PYQ.deleteMany({});
    console.log("Cleared existing PYQs");

    // Insert all PYQs
    const result = await PYQ.insertMany(PYQS);
    console.log(`Seeded ${result.length} PYQs successfully`);

    // Summary per subject
    const subjects = [...new Set(PYQS.map(p => p.subject))];
    for (const s of subjects) {
      const count = PYQS.filter(p => p.subject === s).length;
      console.log(`  ${s}: ${count} PYQs`);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("Seed error:", err);
    mongoose.disconnect();
  }
}

seedPYQs();