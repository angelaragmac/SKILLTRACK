/* SkillTrack content: topics, quiz bank, learning resources (IT / Computing track) */
const ST_TOPICS = [
  {id:'intro', name:'Introduction to Computing', icon:'bi-pc-display', wiki:'Computer'},
  {id:'systems', name:'Computer Systems', icon:'bi-cpu', wiki:'Computer_architecture'},
  {id:'prog', name:'Programming Fundamentals', icon:'bi-code-slash', wiki:'Computer_programming'},
  {id:'problem', name:'Problem Solving', icon:'bi-puzzle', wiki:'Algorithm'},
  {id:'data', name:'Data & Databases', icon:'bi-database', wiki:'Database'}
];
// q: question, o: options, a: index of correct answer, d: difficulty 0-1
const ST_QUESTIONS = {
 intro:[
  {q:'Which of these is an INPUT device?',o:['Monitor','Keyboard','Printer','Speaker'],a:1,d:.2},
  {q:'What does "CPU" stand for?',o:['Central Processing Unit','Computer Personal Unit','Central Program Utility','Control Processing Union'],a:0,d:.2},
  {q:'Which is an example of system software?',o:['Microsoft Word','Operating system','A video game','A web page'],a:1,d:.3},
  {q:'1 byte is equal to how many bits?',o:['4','8','16','1024'],a:1,d:.4},
  {q:'Which of the following is permanent (non-volatile) storage?',o:['RAM','Cache','Solid-state drive','CPU register'],a:2,d:.5},
  {q:'What is the main function of an operating system?',o:['Edit photos','Manage hardware and software resources','Browse the internet','Create documents'],a:1,d:.6}],
 systems:[
  {q:'Which component temporarily holds data the CPU is actively using?',o:['Hard disk','RAM','Power supply','Motherboard'],a:1,d:.3},
  {q:'The "brain" that executes instructions is the:',o:['GPU fan','CPU','Router','BIOS battery'],a:1,d:.2},
  {q:'Which number system do computers use internally?',o:['Decimal','Octal only','Binary','Roman'],a:2,d:.3},
  {q:'What is the binary number 101 in decimal?',o:['3','4','5','6'],a:2,d:.5},
  {q:'Which part of the CPU performs arithmetic and logic operations?',o:['Control Unit','ALU','Cache','Bus'],a:1,d:.6},
  {q:'The fetch–decode–execute cycle describes:',o:['How a CPU processes instructions','How data is encrypted','How Wi-Fi connects','How files are compressed'],a:0,d:.7}],
 prog:[
  {q:'What is a variable?',o:['A named storage location for data','A type of loop','A syntax error','A computer brand'],a:0,d:.2},
  {q:'Which structure repeats a block of code?',o:['Loop','Comment','Variable','Header'],a:0,d:.3},
  {q:'What does this output? x = 2; y = 3; print(x + y)',o:['23','5','x + y','Error'],a:1,d:.3},
  {q:'Which statement lets a program choose between actions?',o:['if / else','print','import','return only'],a:0,d:.4},
  {q:'A function is best described as:',o:['A reusable block of code that performs a task','A hardware part','A type of file','A virus'],a:0,d:.5},
  {q:'How many times does this run? for i in range(0,4): print(i)',o:['3','4','5','Infinite'],a:1,d:.7}],
 problem:[
  {q:'What is an algorithm?',o:['A step-by-step procedure to solve a problem','A programming language','A computer brand','A type of memory'],a:0,d:.3},
  {q:'Breaking a big problem into smaller parts is called:',o:['Decomposition','Compilation','Encryption','Formatting'],a:0,d:.4},
  {q:'Which tool shows an algorithm as a diagram?',o:['Flowchart','Spreadsheet','Firewall','Compiler'],a:0,d:.3},
  {q:'What is the first step of problem solving?',o:['Write code immediately','Understand the problem','Test the program','Deploy the app'],a:1,d:.4},
  {q:'Finding and fixing errors in a program is called:',o:['Debugging','Compiling','Hosting','Indexing'],a:0,d:.5},
  {q:'To find the largest of 3 numbers, the minimum number of comparisons needed is:',o:['1','2','3','4'],a:1,d:.8}],
 data:[
  {q:'What does "SQL" stand for?',o:['Structured Query Language','Simple Question Logic','System Quality Level','Sequential Query Link'],a:0,d:.3},
  {q:'In a table, a single row is usually called a:',o:['Record','Field','Key only','Schema'],a:0,d:.3},
  {q:'A primary key:',o:['Uniquely identifies each record','Encrypts the table','Is always a number between 1–10','Deletes duplicates automatically'],a:0,d:.5},
  {q:'Which SQL command retrieves data?',o:['SELECT','INSERT','DROP','UPDATE'],a:0,d:.3},
  {q:'Which data type is best for a student\'s name?',o:['Text / string','Boolean','Integer','Date'],a:0,d:.2},
  {q:'A foreign key is used to:',o:['Link two tables together','Speed up the CPU','Backup the database','Hide a column'],a:0,d:.7}]
};
// type: video | read | practice ; d: difficulty 0-1 (matched to student mastery)
const ST_RESOURCES = (()=>{
  const yt=s=>'https://www.youtube.com/results?search_query='+encodeURIComponent(s);
  const wk=s=>'https://en.wikipedia.org/wiki/'+s;
  const meta={
   intro:[['Computer basics for beginners','video',.2,yt('computer basics for beginners')],['What is a computer? Overview','read',.3,wk('Computer')],['Hardware vs software explained','video',.45,yt('hardware vs software explained')],['Operating systems in depth','read',.7,wk('Operating_system')]],
   systems:[['How a CPU works (simple)','video',.25,yt('how a cpu works explained simply')],['Binary numbers made easy','video',.4,yt('binary numbers explained')],['Computer architecture overview','read',.7,wk('Computer_architecture')],['Instruction cycle (fetch-decode-execute)','read',.8,wk('Instruction_cycle')]],
   prog:[['Programming basics for beginners','video',.2,yt('programming fundamentals for beginners')],['Variables, loops and conditions','video',.45,yt('variables loops conditionals python beginners')],['Computer programming overview','read',.5,wk('Computer_programming')],['Functions and recursion','read',.8,wk('Subroutine')]],
   problem:[['Intro to algorithms & flowcharts','video',.25,yt('what is an algorithm flowchart beginners')],['Algorithm (reference)','read',.5,wk('Algorithm')],['Decomposition & computational thinking','video',.5,yt('computational thinking decomposition')],['Debugging strategies','read',.7,wk('Debugging')]],
   data:[['Databases explained simply','video',.25,yt('what is a database explained')],['SQL tutorial for beginners','video',.45,yt('sql tutorial for beginners')],['Relational database (reference)','read',.7,wk('Relational_database')],['Keys and relationships','read',.8,wk('Foreign_key')]]
  };
  const out=[];
  ST_TOPICS.forEach(t=>{
    meta[t.id].forEach((m,i)=>out.push({id:t.id+'-'+i,topic:t.id,title:m[0],type:m[1],d:m[2],url:m[3]}));
    out.push({id:t.id+'-p1',topic:t.id,title:t.name+' – Practice set (easier)',type:'practice',d:.3,url:'quiz.html?topic='+t.id+'&mode=practice'});
    out.push({id:t.id+'-p2',topic:t.id,title:t.name+' – Practice set (challenge)',type:'practice',d:.75,url:'quiz.html?topic='+t.id+'&mode=practice'});
  });
  return out;
})();
