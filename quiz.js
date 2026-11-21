/* ============================================================
   DOXILO NOVA — Quiz Arena 2.0 (nova/quiz.js)

   Complete redesign of the Quiz Arena page. Replaces the legacy
   PAGES.quiz renderer while keeping every data contract:
     - XP: localStorage vq_xp + account XP users/<uid>/xp (transaction)
     - history: localStorage vq_history
     - stats: vq_played_count / vq_best_pct / vq_best_streak
     - leaderboard: Firebase quizResults (same record shape)

   Modes: Classic (category + difficulty), Quick 10, Daily
   Challenge (seeded, once/day), Multiplayer Battle (real-time,
   over NovaMatch / Firebase).

   All questions are original well-known-fact packs — no runtime
   scraping. The Geography category additionally mixes in the
   base app's ALL_COUNTRIES capital/flag data when available.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { return v === undefined ? null : v; }
  }
  function lsN(k) { return parseInt(ls(k) || "0", 10) || 0; }

  /* ============================================================
     Question packs — original, verifiable general-knowledge facts
     ============================================================ */
  var PACKS = {
    gk: {
      n: "General Knowledge", ic: "🌍", c: "#38BDF8",
      d: "A bit of everything — the classic warm-up.",
      qs: [
        { q: "How many continents are there on Earth?", a: ["7", "5", "6", "8"], c: 0 },
        { q: "Which is the largest ocean on Earth?", a: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], c: 0 },
        { q: "What currency is used in Japan?", a: ["Yen", "Won", "Yuan", "Ringgit"], c: 0 },
        { q: "How many colors are in a rainbow?", a: ["7", "5", "9", "12"], c: 0 },
        { q: "Which language has the most native speakers worldwide?", a: ["Mandarin Chinese", "English", "Spanish", "Hindi"], c: 0 },
        { q: "What is the tallest animal in the world?", a: ["Giraffe", "Elephant", "Ostrich", "Camel"], c: 0 },
        { q: "How many minutes are in a full day?", a: ["1440", "1200", "960", "2400"], c: 0 },
        { q: "Which sport uses a shuttlecock?", a: ["Badminton", "Squash", "Table tennis", "Padel"], c: 0 },
        { q: "What does 'www' stand for in a website address?", a: ["World Wide Web", "World Web Wire", "Wide World Web", "Web World Wide"], c: 0 },
        { q: "Which is the smallest country in the world by area?", a: ["Vatican City", "Monaco", "Nauru", "San Marino"], c: 0 },
        { q: "How many strings does a standard guitar have?", a: ["6", "4", "5", "7"], c: 0 },
        { q: "What is the hardest natural substance on Earth?", a: ["Diamond", "Quartz", "Steel", "Granite"], c: 0 },
        { q: "Which bird is famous for mimicking sounds, including speech?", a: ["Parrot", "Penguin", "Owl", "Sparrow"], c: 0 },
        { q: "In which city is the famous Eiffel Tower?", a: ["Paris", "Rome", "Madrid", "Vienna"], c: 0 },
        { q: "How many days are in a leap year?", a: ["366", "365", "364", "367"], c: 0 },
        { q: "What is the main ingredient in guacamole?", a: ["Avocado", "Pea", "Cucumber", "Zucchini"], c: 0 }
      ]
    },
    science: {
      n: "Science & Nature", ic: "🔬", c: "#34D399",
      d: "Planets, cells, elements and the natural world.",
      qs: [
        { q: "What is the chemical symbol for gold?", a: ["Au", "Ag", "Go", "Gd"], c: 0 },
        { q: "Which planet is known as the Red Planet?", a: ["Mars", "Venus", "Jupiter", "Mercury"], c: 0 },
        { q: "What gas do plants absorb from the air for photosynthesis?", a: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], c: 0 },
        { q: "How many bones does an adult human have?", a: ["206", "186", "226", "250"], c: 0 },
        { q: "What is the speed of light approximately?", a: ["300,000 km/s", "150,000 km/s", "1,000,000 km/s", "30,000 km/s"], c: 0 },
        { q: "Which organ pumps blood around the human body?", a: ["Heart", "Lungs", "Liver", "Kidneys"], c: 0 },
        { q: "What is the largest planet in our solar system?", a: ["Jupiter", "Saturn", "Neptune", "Earth"], c: 0 },
        { q: "Water boils at what temperature at sea level?", a: ["100°C", "90°C", "80°C", "120°C"], c: 0 },
        { q: "Which force keeps planets in orbit around the Sun?", a: ["Gravity", "Magnetism", "Friction", "Tension"], c: 0 },
        { q: "What is the most abundant gas in Earth's atmosphere?", a: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"], c: 0 },
        { q: "Which blood type is known as the universal donor?", a: ["O negative", "AB positive", "A positive", "B negative"], c: 0 },
        { q: "What do bees collect to make honey?", a: ["Nectar", "Pollen", "Sap", "Dew"], c: 0 },
        { q: "Which metal is liquid at room temperature?", a: ["Mercury", "Lead", "Tin", "Zinc"], c: 0 },
        { q: "The study of fossils is called…", a: ["Paleontology", "Geology", "Archaeology", "Zoology"], c: 0 },
        { q: "How many legs does a spider have?", a: ["8", "6", "10", "4"], c: 0 },
        { q: "What is the powerhouse of the cell?", a: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], c: 0 }
      ]
    },
    geo: {
      n: "Geography", ic: "🗺️", c: "#FBBF24",
      d: "Capitals and world facts — powered by the country database.",
      qs: [] /* capitals injected from ALL_COUNTRIES at runtime */
    },
    history: {
      n: "History", ic: "📜", c: "#F472B6",
      d: "Empires, inventions and world-changing moments.",
      qs: [
        { q: "In which year did World War II end?", a: ["1945", "1939", "1918", "1950"], c: 0 },
        { q: "Who was the first person to walk on the Moon?", a: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "Michael Collins"], c: 0 },
        { q: "The Great Wall is located in which country?", a: ["China", "Japan", "Mongolia", "Korea"], c: 0 },
        { q: "Who painted the Mona Lisa?", a: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], c: 0 },
        { q: "Which ancient civilization built the pyramids of Giza?", a: ["Egyptians", "Romans", "Greeks", "Persians"], c: 0 },
        { q: "The Titanic sank in which year?", a: ["1912", "1905", "1920", "1898"], c: 0 },
        { q: "Who was the first President of the United States?", a: ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"], c: 0 },
        { q: "Which empire was ruled by Julius Caesar?", a: ["Roman Empire", "Greek Empire", "Persian Empire", "Ottoman Empire"], c: 0 },
        { q: "In which year did the Berlin Wall fall?", a: ["1989", "1979", "1991", "1995"], c: 0 },
        { q: "Who invented the first practical printing press in Europe?", a: ["Johannes Gutenberg", "Leonardo da Vinci", "Galileo Galilei", "Isaac Newton"], c: 0 },
        { q: "The ancient Olympic Games were held in which country?", a: ["Greece", "Egypt", "Italy", "France"], c: 0 },
        { q: "Who drafted the United States Declaration of Independence?", a: ["Thomas Jefferson", "Benjamin Franklin", "John Adams", "Alexander Hamilton"], c: 0 },
        { q: "Which ship carried the Pilgrims to America in 1620?", a: ["Mayflower", "Santa Maria", "Endeavour", "Beagle"], c: 0 },
        { q: "Who was the British prime minister for most of World War II?", a: ["Winston Churchill", "Neville Chamberlain", "Clement Attlee", "Anthony Eden"], c: 0 },
        { q: "Which wall divided a European capital until 1989?", a: ["Berlin Wall", "Hadrian's Wall", "Great Wall", "Western Wall"], c: 0 },
        { q: "The Renaissance began in which country?", a: ["Italy", "France", "England", "Spain"], c: 0 }
      ]
    },
    sport: {
      n: "Sport", ic: "⚽", c: "#60A5FA",
      d: "Rules, records and legendary moments.",
      qs: [
        { q: "How many players from one football (soccer) team are on the pitch?", a: ["11", "9", "10", "12"], c: 0 },
        { q: "How often are the Summer Olympic Games held?", a: ["Every 4 years", "Every 2 years", "Every 3 years", "Every 5 years"], c: 0 },
        { q: "In tennis, what is a score of zero called?", a: ["Love", "Nil", "Duck", "Blank"], c: 0 },
        { q: "How many rings are on the Olympic flag?", a: ["5", "4", "6", "7"], c: 0 },
        { q: "Which country has won the most FIFA World Cups?", a: ["Brazil", "Germany", "Italy", "Argentina"], c: 0 },
        { q: "In basketball, how many points is a free throw worth?", a: ["1", "2", "3", "0"], c: 0 },
        { q: "What sport is played at Wimbledon?", a: ["Tennis", "Cricket", "Rugby", "Golf"], c: 0 },
        { q: "How long is a marathon race?", a: ["42.195 km", "40 km", "50 km", "38 km"], c: 0 },
        { q: "In cricket, what is a batter's score of zero called?", a: ["Duck", "Goose", "Egg", "Nil"], c: 0 },
        { q: "How many players are on a volleyball team on court?", a: ["6", "5", "7", "8"], c: 0 },
        { q: "Which sport uses the terms 'strike' and 'spare'?", a: ["Bowling", "Golf", "Darts", "Snooker"], c: 0 },
        { q: "The Tour de France is a competition in which sport?", a: ["Cycling", "Running", "Swimming", "Sailing"], c: 0 },
        { q: "In golf, what is one stroke under par on a hole called?", a: ["Birdie", "Eagle", "Bogey", "Albatross"], c: 0 },
        { q: "How many minutes is a standard football (soccer) match?", a: ["90", "80", "100", "60"], c: 0 },
        { q: "In which country did the sport of golf originate?", a: ["Scotland", "England", "Ireland", "USA"], c: 0 },
        { q: "What is the maximum break in a single frame of snooker?", a: ["147", "120", "155", "100"], c: 0 }
      ]
    },
    media: {
      n: "Movies & Music", ic: "🎬", c: "#C084FC",
      d: "Screens, stages and iconic hits.",
      qs: [
        { q: "Which movie features the quote 'May the Force be with you'?", a: ["Star Wars", "Star Trek", "Dune", "Avatar"], c: 0 },
        { q: "Who directed the movie 'Jurassic Park' (1993)?", a: ["Steven Spielberg", "James Cameron", "Ridley Scott", "George Lucas"], c: 0 },
        { q: "How many strings does a violin have?", a: ["4", "5", "6", "3"], c: 0 },
        { q: "Which animated film features a snow queen named Elsa?", a: ["Frozen", "Moana", "Tangled", "Brave"], c: 0 },
        { q: "What is the famous gold statuette award in film called?", a: ["Oscar", "Grammy", "Emmy", "Tony"], c: 0 },
        { q: "Which instrument does a pianist play?", a: ["Piano", "Harp", "Organ", "Accordion"], c: 0 },
        { q: "In 'The Lion King', what kind of animal is Timon?", a: ["Meerkat", "Warthog", "Mongoose", "Lemur"], c: 0 },
        { q: "Which band released the album 'Abbey Road'?", a: ["The Beatles", "The Rolling Stones", "Queen", "Pink Floyd"], c: 0 },
        { q: "In the 'Harry Potter' title, what do the initials 'HP' name?", a: ["Harry Potter", "Henry Prewett", "Hogwarts Prefect", "Harold Potter"], c: 0 },
        { q: "How many keys does a standard full-size piano have?", a: ["88", "76", "92", "61"], c: 0 },
        { q: "Which series features a girl called 'Eleven' with powers?", a: ["Stranger Things", "Dark", "The Umbrella Academy", "Riverdale"], c: 0 },
        { q: "Who is known as the 'King of Pop'?", a: ["Michael Jackson", "Elvis Presley", "Prince", "David Bowie"], c: 0 },
        { q: "What genre is the movie 'The Shining'?", a: ["Horror", "Comedy", "Romance", "Documentary"], c: 0 },
        { q: "Which film industry is based in Mumbai, India?", a: ["Bollywood", "Nollywood", "Hollywood", "Lollywood"], c: 0 },
        { q: "In music notation, what does 'forte' mean?", a: ["Loud", "Soft", "Fast", "Slow"], c: 0 },
        { q: "Which film trilogy features Frodo Baggins?", a: ["The Lord of the Rings", "The Hobbit", "Harry Potter", "Pirates of the Caribbean"], c: 0 }
      ]
    },
    tech: {
      n: "Technology", ic: "💻", c: "#A78BFA",
      d: "Computers, the web and modern gadgets.",
      qs: [
        { q: "What does 'CPU' stand for?", a: ["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Core Processing Uplink"], c: 0 },
        { q: "Who co-founded Apple with Steve Jobs?", a: ["Steve Wozniak", "Bill Gates", "Jeff Bezos", "Elon Musk"], c: 0 },
        { q: "What does 'HTTP' stand for?", a: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transport Path", "Host Transfer Text Protocol"], c: 0 },
        { q: "Which company develops the Android operating system?", a: ["Google", "Apple", "Microsoft", "Samsung"], c: 0 },
        { q: "In common usage, what does 'Wi-Fi' relate to?", a: ["Wireless networking", "Wired telephone lines", "Cable television", "Satellite radio"], c: 0 },
        { q: "How many bits are in a byte?", a: ["8", "4", "16", "32"], c: 0 },
        { q: "Which language is primarily used to style web pages?", a: ["CSS", "HTML", "SQL", "JSON"], c: 0 },
        { q: "Which computer component is called its 'brain'?", a: ["Processor", "Hard drive", "RAM", "Power supply"], c: 0 },
        { q: "What does 'AI' stand for?", a: ["Artificial Intelligence", "Automatic Input", "Advanced Interface", "Applied Informatics"], c: 0 },
        { q: "Which company created the PlayStation console?", a: ["Sony", "Microsoft", "Nintendo", "Sega"], c: 0 },
        { q: "What does 'USB' stand for?", a: ["Universal Serial Bus", "United System Board", "Universal System Backup", "User Serial Bus"], c: 0 },
        { q: "In programming, what does 'bug' mean?", a: ["An error in code", "A virus", "A feature", "A plugin"], c: 0 },
        { q: "Which of these is a version control system?", a: ["Git", "Linux", "Apache", "Nginx"], c: 0 },
        { q: "What does 'PDF' stand for?", a: ["Portable Document Format", "Printed Document File", "Public Data File", "Portable Data Frame"], c: 0 },
        { q: "Which storage device keeps data when powered off?", a: ["SSD", "RAM", "CPU cache", "Registers"], c: 0 },
        { q: "What does 'open source' mean?", a: ["Source code is publicly available", "Software is always free of charge", "No license exists", "It runs on any device"], c: 0 }
      ]
    }
  };

  var DIFFS = [
    { id: "easy", n: "Easy", d: "25s per question · relaxed", t: 25, mult: 0.8 },
    { id: "normal", n: "Normal", d: "20s per question · balanced XP", t: 20, mult: 1 },
    { id: "hard", n: "Hard", d: "14s per question · 1.4× XP", t: 14, mult: 1.4 }
  ];

  /* ---------- deterministic helpers ---------- */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, seed) {
    var rnd = mulberry(seed), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function shuffle(arr) { return seededShuffle(arr, (Math.random() * 1e9) | 0); }

  /* ---------- geography pack from the base country database ---------- */
  function geoQuestions(count) {
    var out = [];
    try {
      var AC = (typeof ALL_COUNTRIES !== "undefined" && ALL_COUNTRIES) || window.ALL_COUNTRIES;
      if (AC && AC.length) {
        var pick = shuffle(AC).slice(0, count);
        pick.forEach(function (x) {
          var wrongs = shuffle(AC.filter(function (y) { return y.capital && y.capital !== x.capital; })).slice(0, 3);
          if (wrongs.length < 3 || !x.capital) return;
          var opts = [x.capital, wrongs[0].capital, wrongs[1].capital, wrongs[2].capital];
          var shuffled = shuffle(opts);
          out.push({ q: "What is the capital of " + x.country + "?", a: shuffled, c: shuffled.indexOf(x.capital) });
        });
      }
    } catch (e) {}
    if (out.length < count) out = out.concat(shuffle(PACKS.gk.qs).slice(0, count - out.length));
    return out;
  }
  function packQuestions(catId, count, seed) {
    var qs;
    if (catId === "geo") qs = geoQuestions(40);
    else if (catId === "mixed") {
      var pool = [];
      Object.keys(PACKS).forEach(function (k) {
        pool = pool.concat(k === "geo" ? geoQuestions(20) : PACKS[k].qs);
      });
      qs = pool;
    }
    else qs = (PACKS[catId] || PACKS.gk).qs;
    var list = seed ? seededShuffle(qs, seed) : shuffle(qs);
    return list.slice(0, count).map(function (q, i) {
      /* shuffle the four options (seed-stable so both battle clients match) */
      var perm = seed ? seededShuffle([0, 1, 2, 3], seed + i * 7919) : shuffle([0, 1, 2, 3]);
      var a = perm.map(function (j) { return q.a[j]; });
      return { id: i, q: q.q, a: a, c: perm.indexOf(q.c) };
    });
  }

  /* ---------- state ---------- */
  var S = {
    view: "home", // home | play | result
    cat: "gk", diff: "normal", count: 10, gMode: "classic",
    questions: [], cur: 0, answers: {}, correct: 0, wrong: 0, streak: 0, bestStreak: 0,
    xp: 0, timeLeft: 0, timer: null, startTs: 0, qStartTs: 0, finished: false,
    lbFilter: "week", lbSearch: "", seed: 0, battle: null, pendingBattle: null
  };

  function myName() {
    try { return (typeof MY !== "undefined" && MY && MY.name) || "Player"; } catch (e) { return "Player"; }
  }
  function myUid() {
    try { return (typeof MY !== "undefined" && MY && MY.uid) || "guest"; } catch (e) { return "guest"; }
  }
  function getDb() {
    try { return (typeof db !== "undefined" && db) || window.db || null; } catch (e) { return null; }
  }
  function toast(msg, kind) {
    try { if (typeof window.toast === "function") { window.toast(msg, kind); return; } } catch (e) {}
    try { if (typeof window.t2 === "function") window.t2(msg, kind); } catch (e) {}
  }
  function flyXP(n) { try { if (typeof window.flyXP === "function") window.flyXP(n); } catch (e) {} }

  /* ============================================================
     Page rendering
     ============================================================ */
  function pageHTML(sub) {
    if (S.view === "play") return playHTML();
    if (S.view === "result") return resultHTML();
    if (sub === "leaderboard") return lbHTML();
    if (sub === "verify" && typeof quizRenderVerify === "function") return quizRenderVerify();
    try {
      if (sub === "review" && typeof quizRenderReview === "function") return quizRenderReview();
      if (sub === "revision" && typeof quizRenderRevision === "function") return quizRenderRevision();
      if (sub === "admin" && typeof quizRenderAdmin === "function") return quizRenderAdmin();
      if (sub === "settings" && typeof quizRenderSettings === "function") return quizRenderSettings();
    } catch (_e) {}    if (sub === "history") return historyHTML();
    return homeHTML();
  }

  function fmtN(n) { return String(Math.floor(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function homeHTML() {
    var xp = lsN("vq_xp");
    var played = lsN("vq_played_count");
    var bestPct = lsN("vq_best_pct");
    var nm = (typeof MY !== "undefined" && MY && MY.name) ? MY.name : (ls("vq_last_name") || "Player");
    var av = (typeof MY !== "undefined" && MY && MY.avatar) ? MY.avatar : "";
    var dailyKey = "vq_daily_done_" + new Date().toISOString().split("T")[0];
    var daily = ls(dailyKey) === "1";
    var cats = Object.keys(PACKS).concat(["mixed"]).map(function (k) {
      var p = k === "mixed" ? { n: "Mixed Bag", ic: "🎰", c: "#F43F5E", d: "Questions from every category" } : PACKS[k];
      return '<button type="button" class="nq-cat" data-nq="cat" data-v="' + k + '" style="--qc:' + p.c + '">' +
        '<span class="nq-cat-ic">' + p.ic + "</span><b>" + esc(p.n) + "</b><span>" + esc(p.d) + "</span></button>";
    }).join("");
    return (
      '<div class="nq-wrap">' +
        '<section class="nq-hero" style="padding:20px 14px 16px">' +
          (av ? '<img src="' + esc(av) + '" alt="" onerror="this.style.display=\'none\'" style="width:74px;height:74px;border-radius:50%;object-fit:cover;border:3px solid #A855F7;box-shadow:0 0 28px -4px rgba(168,85,247,.9)">' : '<div style="width:74px;height:74px;border-radius:50%;display:grid;place-items:center;font:900 26px Sora,system-ui;color:#fff;background:linear-gradient(135deg,#A855F7,#6366F1);margin:0 auto;box-shadow:0 0 28px -4px rgba(168,85,247,.9)">' + esc(nm.charAt(0).toUpperCase()) + "</div>") +
          '<h1 style="margin-top:12px;font-size:clamp(20px,5.4vw,27px)">' + esc(nm) + "</h1>" +
          '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:9px">' +
            '<span class="nq-chip">⚡ ' + fmtN(xp) + " XP</span>" +
            '<span class="nq-chip">🎮 ' + fmtN(played) + " played</span>" +
            '<span class="nq-chip">🏅 ' + bestPct + "% best</span>" +
          "</div>" +
          '<div class="nq-hero-btns" style="margin-top:15px">' +
            '<button type="button" class="nq-cta" data-nq="quick">⚡ Quick 10</button>' +
            '<button type="button" class="nq-cta ghost" data-nq="daily">' + (daily ? "✅ Daily done" : "📅 Daily challenge") + "</button>" +
            '<button type="button" class="nq-cta ghost" data-nq="battle">⚔️ Battle a friend</button>' +
          "</div>" +
          '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:430px;margin:16px auto 0">' +
            '<button type="button" class="nq-tool" data-nq="nav" data-v="leaderboard">🏆<span>Leaderboard</span></button>' +
            '<button type="button" class="nq-tool" data-nq="nav" data-v="history">🕘<span>History</span></button>' +
            '<button type="button" class="nq-tool" data-nq="nav" data-v="verify">🎓<span>Check Certificate</span></button>' +
            '<button type="button" class="nq-tool" data-nq="more">🎯<span>Categories</span></button>' +
          "</div>" +
          '<section class="nq-extra" hidden style="margin-top:16px">' +
            '<h3 style="margin-bottom:8px">🎯 Pick a category</h3><div class="nq-cats-grid">' + cats + "</div>" +
            '<div class="nq-setup" style="margin-top:12px">' +
              "<h3>Build your quiz</h3>" +
              '<div class="nq-setup-row">' +
                '<label>Difficulty<select data-nq="diff">' +
                  DIFFS.map(function (d) { return '<option value="' + d.id + '"' + (S.diff === d.id ? " selected" : "") + ">" + esc(d.n) + " — " + esc(d.d) + "</option>"; }).join("") +
                "</select></label>" +
                '<label>Length<select data-nq="count"><option value="5"" + (S.count === 5 ? " selected" : "") + ">5 questions</option><option value="10"" + (S.count === 10 ? " selected" : "") + ">10 questions</option><option value="15"" + (S.count === 15 ? " selected" : "") + ">15 questions</option></select></label>' +
                '<button type="button" class="nq-cta" data-nq="start">▶ Start solo quiz</button>' +
              "</div>" +
            "</div>" +
          "</section>" +
        "</section>" +
      "</div>"
    );
  }

  function playHTML() {
    var q = S.questions[S.cur];
    if (!q) return resultHTML();
    var total = S.questions.length;
    var pct = Math.round((S.cur / total) * 100);
    var opts = q.a.map(function (t, i) {
      return '<button type="button" class="nq-opt" data-nq="opt" data-v="' + i + '"><i>' + "ABCD".charAt(i) + "</i>" + esc(t) + "</button>";
    }).join("");
    var battleBar = "";
    if (S.battle) {
      var opp = S.battle.opp;
      battleBar = '<div class="nq-battlebar"><span>You · ' + S.correct + "/" + total + "</span>" +
        '<span class="nq-vs">VS</span>' +
        "<span>" + esc((opp && opp.name) || "Friend") + " · " + ((opp && opp.correct) || 0) + "/" + total + "</span></div>";
    }
    return (
      '<div class="nq-wrap nq-play">' +
        '<div class="nq-prog"><i style="width:' + pct + '%"></i></div>' +
        battleBar +
        '<div class="nq-qhead"><span class="nq-qcount">Q' + (S.cur + 1) + " / " + total + "</span>" +
          '<span class="nq-timer" id="nq-timer" data-low="' + (S.timeLeft <= 5 ? "1" : "0") + '">⏱ ' + S.timeLeft + "s</span>" +
          '<span class="nq-streak' + (S.streak >= 3 ? " on" : "") + '">🔥 ' + S.streak + "</span></div>" +
        '<h2 class="nq-q">' + esc(q.q) + "</h2>" +
        '<div class="nq-opts">' + opts + "</div>" +
        '<div class="nq-status">Streak of 3+ earns combo XP · answers lock in instantly</div>' +
      "</div>"
    );
  }

  function resultHTML() {
    var total = S.questions.length;
    var pct = total ? Math.round((S.correct / total) * 100) : 0;
    var secs = Math.round((Date.now() - S.startTs) / 1000);
    var grade = pct >= 90 ? "S" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D";
    var rows = S.questions.map(function (q, i) {
      var picked = S.answers[i];
      var ok = picked === q.c;
      return '<div class="nq-rev-row ' + (ok ? "ok" : picked == null ? "skip" : "bad") + '">' +
        "<span>" + (ok ? "✔" : picked == null ? "–" : "✕") + "</span><b>" + esc(q.q) + "</b>" +
        "<em>" + (ok ? "Correct" : picked == null ? "Skipped" : "Answer: " + esc(q.a[q.c])) + "</em></div>";
    }).join("");
    var battleBlock = "";
    if (S.battle) {
      var opp = S.battle.opp || {};
      var oppScore = opp.correct || 0;
      var won = S.correct > oppScore;
      var draw = S.correct === oppScore;
      battleBlock = '<div class="nq-battle-result">' +
        "<b>" + (draw ? "It's a draw!" : won ? "🏆 You win the battle!" : "💀 Your friend wins this one") + "</b>" +
        "<span>You " + S.correct + " — " + oppScore + " " + esc(opp.name || "Friend") + "</span></div>";
    }
    return (
      '<div class="nq-wrap nq-result">' +
        '<div class="nq-scorecard grade-' + grade + '">' +
          '<span class="nq-grade">' + grade + "</span>" +
          "<h2>" + S.correct + " / " + total + " correct</h2>" +
          "<p>" + pct + "% · " + secs + "s · best streak " + S.bestStreak + " · <b>+" + S.xp + " XP</b></p>" +
          battleBlock +
          '<div class="nq-result-btns">' +
            '<button type="button" class="nq-cta" data-nq="again">↻ Play again</button>' +
            '<button type="button" class="nq-cta ghost" data-nq="home">Home</button>' +
          "</div>" +
        "</div>" +
        '<section class="nq-review"><h3>Answer review</h3>' + rows + "</section>" +
      "</div>"
    );
  }

  function lbHTML() {
    return '<div class="nq-wrap"><section class="nq-lb"><h3>🏆 Global leaderboard</h3>' +
      '<div class="nq-lb-filters">' +
        ["all", "week", "today"].map(function (f) {
          return '<button type="button" class="nq-chip' + (S.lbFilter === f ? " on" : "") + '" data-nq="lbf" data-v="' + f + '">' + f.toUpperCase() + "</button>";
        }).join("") +
        '<input data-nq="lbsearch" placeholder="Search player…" value="' + esc(S.lbSearch) + '">' +
      "</div>" +
      '<div class="nq-lb-list" id="nq-lb-list"><div class="nq-lb-empty">Loading leaderboard…</div></div></section></div>';
  }

  function historyHTML() {
    var h = [];
    try { h = JSON.parse(ls("vq_history") || "[]") || []; } catch (e) {}
    var rows = h.slice(0, 30).map(function (r) {
      return '<div class="nq-hrow"><b>' + esc(r.mode === "geo" ? "Geography" : r.mode || "Quiz") + "</b>" +
        "<span>" + r.score + "/" + r.total + " · " + r.percentage + "% · +" + (r.xpEarned || 0) + " XP</span>" +
        "<i>" + esc(r.dateKey || "") + "</i></div>";
    }).join("");
    return '<div class="nq-wrap"><section class="nq-hist"><h3>🕘 My quiz history</h3>' +
      (rows || '<div class="nq-lb-empty">No quizzes yet — play your first one!</div>') + "</section></div>";
  }

  /* ============================================================
     Game flow
     ============================================================ */
  function startQuiz(catId, mode, count, seed) {
    S.cat = catId || S.cat;
    S.gMode = mode || "classic";
    S.count = count || S.count;
    S.seed = seed || 0;
    S.questions = packQuestions(S.cat, S.count, S.seed || undefined);
    if (!S.questions.length) { toast("No questions available", "error"); return; }
    S.cur = 0; S.answers = {}; S.correct = 0; S.wrong = 0; S.streak = 0; S.bestStreak = 0;
    S.xp = 0; S.finished = false; S.startTs = Date.now();
    S.view = "play";
    armTimer();
    rerender();
  }
  function armTimer() {
    var d = DIFFS.filter(function (x) { return x.id === S.diff; })[0] || DIFFS[1];
    S.timeLeft = d.t;
    if (S.timer) clearInterval(S.timer);
    S.qStartTs = Date.now();
    S.timer = setInterval(function () { try { if (!document.getElementById("nq-timer")) { clearInterval(S.timer); return; } } catch (_e) {}
      S.timeLeft--;
      var t = document.getElementById("nq-timer");
      if (t) { t.textContent = "⏱ " + S.timeLeft + "s"; t.setAttribute("data-low", S.timeLeft <= 5 ? "1" : "0"); }
      if (S.timeLeft <= 0) answer(-1);
    }, 1000);
  }
  function answer(opt) {
    if (S.finished || S.cur >= S.questions.length) return;
    var q = S.questions[S.cur];
    if (S.answers[S.cur] !== undefined) return;
    S.answers[S.cur] = opt;
    if (S.timer) { clearInterval(S.timer); S.timer = null; }
    var d = DIFFS.filter(function (x) { return x.id === S.diff; })[0] || DIFFS[1];
    if (opt === q.c) {
      S.correct++;
      S.streak++;
      if (S.streak > S.bestStreak) S.bestStreak = S.streak;
      var combo = S.streak >= 5 ? 6 : S.streak >= 3 ? 3 : 0;
      var speed = Math.max(0, Math.round((d.t - (Date.now() - S.qStartTs) / 1000) * 0.4));
      S.xp += Math.round((10 + combo + speed) * d.mult);
      toast(combo ? "🔥 Combo ×" + S.streak + " (+" + combo + " XP)" : "+XP", "ok");
    } else {
      S.wrong++;
      S.streak = 0;
    }
    if (S.battle) {
      try { window.NovaMatch && NovaMatch.send({ t: "qz-ans", idx: S.cur, ok: opt === q.c, score: S.correct, xp: S.xp }); } catch (e) {}
    }
    S.cur++;
    if (S.cur >= S.questions.length) finish();
    else { armTimer(); rerender(); }
  }
  function finish() {
    S.finished = true;
    S.view = "result";
    S.justFinished = true;
    var total = S.questions.length;
    var pct = total ? Math.round((S.correct / total) * 100) : 0;
    var secs = Math.round((Date.now() - S.startTs) / 1000);
    var dateKey = new Date().toISOString().split("T")[0];
    /* persist XP + stats (compatible with the legacy quiz) */
    if (S.xp > 0) {
      ls("vq_xp", String(lsN("vq_xp") + S.xp));
      flyXP(S.xp);
      try {
        var m = (typeof MY !== "undefined" && MY) || window.MY;
        if (m && m.uid && getDb()) {
          getDb().ref("users/" + m.uid + "/xp").transaction(function (cur) { return (cur || 0) + S.xp; });
          m.xp = (m.xp || 0) + S.xp;
          try { if (typeof window.checkLevelUp === "function") window.checkLevelUp(m.xp - S.xp, m.xp); } catch (e) {}
        }
      } catch (e) {}
    }
    ls("vq_played_count", String(lsN("vq_played_count") + 1));
    if (pct > lsN("vq_best_pct")) ls("vq_best_pct", String(pct));
    var bs = lsN("vq_best_streak");
    if (S.bestStreak > bs) ls("vq_best_streak", String(S.bestStreak));
    if (S.gMode === "daily") ls("vq_daily_done_" + dateKey, "1");
    /* history + leaderboard record (same shape as the legacy quiz) */
    var rec = {
      name: myName(), uid: myUid(),
      score: S.correct, total: total, correct: S.correct, wrong: S.wrong,
      skipped: Math.max(0, total - S.correct - S.wrong),
      percentage: pct, mode: S.cat, timeTaken: secs, dateKey: dateKey, ts: Date.now(),
      grade: pct >= 90 ? "S" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D",
      difficulty: S.diff, gMode: S.gMode === "battle" ? "battle" : "classic",
      xpEarned: S.xp, coinsEarned: 0, bestStreak: S.bestStreak,
      avgTime: S.correct + S.wrong > 0 ? Math.round(secs / (S.correct + S.wrong)) : secs,
      daily: S.gMode === "daily", tournament: false
    };
    try {
      var h = JSON.parse(ls("vq_history") || "[]") || [];
      h.unshift(rec);
      if (h.length > 60) h.length = 60;
      ls("vq_history", JSON.stringify(h));
    } catch (e) {}
    try {
      if (getDb() && navigator.onLine) getDb().ref("quizResults").push(rec);
    } catch (e) {}
    if (pct >= 50) { try { if (typeof window.fireConfetti === "function") window.fireConfetti(); } catch (e) {} }
    endBattle();
    rerender();
  }
  function rerender() {
    try {
      var f = typeof render === "function" ? render : window.render;
      if (typeof f === "function") f();
      else if (typeof navTo === "function") navTo("quiz");
    } catch (e) {}
  }

  /* ============================================================
     Multiplayer battle (NovaMatch / Firebase)
     ============================================================ */
  function openBattle() {
    var M = window.NovaMatch;
    if (!M) { toast("Multiplayer layer missing", "error"); return; }
    if (!M.available()) {
      toast("Quiz battles need the Firebase backend — see DEPLOYMENT.md", "error");
      return;
    }
    S.view = "home";
    M.create({ game: "quiz", maxPlayers: 2 }).then(function (code) {
      S.pendingBattle = code;
      showBattleInvite(code);
      var un = M.onRoom(function (meta) {
        if (!meta || !meta.players) return;
        var ids = Object.keys(meta.players);
        if (ids.length >= 2 && !S.battle && S.pendingBattle === code) {
          M.startGame();
          beginBattle(code, "host");
          try { un(); } catch (e) {}
        }
      });
    });
  }
  function showBattleInvite(code) {
    var link = "";
    try { link = window.NovaMatch.linkFor(code, "quiz"); } catch (e) {}
    var el = document.getElementById("nq-battle-pop");
    if (el) el.remove();
    el = document.createElement("div");
    el.id = "nq-battle-pop";
    el.className = "nq-battle-pop";
    el.innerHTML = '<div class="nq-bp-card"><span class="nq-kicker">QUIZ BATTLE</span><h3>Waiting for your friend…</h3>' +
      '<div class="nq-code">' + esc(code) + "</div>" +
      '<label class="nva3-nl">Invite link<input readonly value="' + esc(link) + '"></label>' +
      '<div class="nq-bp-btns"><button type="button" data-nqb="copy">Copy code</button><button type="button" data-nqb="copylink">Copy link</button><button type="button" class="ghost" data-nqb="cancel">Cancel</button></div></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("on"); });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-nqb]");
      if (!b) return;
      var a = b.getAttribute("data-nqb");
      if (a === "copy") window.NovaMatch.copyText(code, "Battle code");
      if (a === "copylink") window.NovaMatch.copyText(link, "Invite link");
      if (a === "cancel") {
        el.classList.remove("on");
        setTimeout(function () { el.remove(); }, 200);
        S.pendingBattle = null;
        window.NovaMatch.leave();
      }
    });
  }
  function beginBattle(code, role) {
    try { var p = document.getElementById("nq-battle-pop"); if (p) { p.classList.remove("on"); setTimeout(function () { p.remove(); }, 200); } } catch (e) {}
    S.pendingBattle = null;
    S.battle = { code: code, role: role, opp: null };
    var M = window.NovaMatch;
    if (role === "host") {
      S.seed = (Math.random() * 1e9) | 0;
      M.send({ t: "qz-seed", seed: S.seed, cat: S.cat, diff: S.diff, count: S.count });
      setTimeout(function () { startQuiz(S.cat, "battle", S.count, S.seed); }, 400);
    } else {
      toast("Battle joined — waiting for questions…", "info");
    }
    if (M && !M._nqBound) {
      M._nqBound = true;
      M.onMessage(function (m) {
        if (!m || !m.t || String(m.t).indexOf("qz-") !== 0) return;
        if (m.t === "qz-seed" && S.battle && S.battle.role !== "host") {
          S.seed = m.seed; S.cat = m.cat || "gk"; S.diff = m.diff || "normal"; S.count = m.count || 10;
          S.battle.opp = { name: m.name || "Friend" };
          startQuiz(S.cat, "battle", S.count, S.seed);
          return;
        }
        if (m.t === "qz-ans" && S.battle) {
          S.battle.opp = S.battle.opp || { name: m.name || "Friend" };
          S.battle.opp.correct = m.score || 0;
          S.battle.opp.xp = m.xp || 0;
          var t = document.querySelector(".nq-battlebar span:last-child");
          if (t) t.textContent = (S.battle.opp.name || "Friend") + " · " + (m.score || 0) + "/" + S.questions.length;
          return;
        }
        if (m.t === "qz-done" && S.battle) {
          S.battle.opp = S.battle.opp || { name: m.name || "Friend" };
          S.battle.opp.correct = m.score || 0;
          S.battle.opp.xp = m.xp || 0;
          if (S.finished) rerender();
        }
      });
    }
  }
  function endBattle() {
    if (S.battle) {
      try { window.NovaMatch.send({ t: "qz-done", score: S.correct, xp: S.xp }); } catch (e) {}
      setTimeout(function () { try { window.NovaMatch.leave(); } catch (e) {} }, 1500);
    }
  }

  /* ============================================================
     Leaderboard (reads the shared quizResults node)
     ============================================================ */
  function loadLeaderboard() {
    var box = document.getElementById("nq-lb-list");
    if (!box) return;
    var d = getDb();
    if (!d) { box.innerHTML = '<div class="nq-lb-empty">Leaderboard needs the Firebase backend. Your local stats are safe.</div>'; return; }
    try {
      d.ref("quizResults").limitToLast(500).once("value").then(function (sn) {
        var rows = [];
        sn.forEach(function (c) {
          var r = c.val() || {};
          if (S.lbFilter === "today" && r.dateKey !== new Date().toISOString().split("T")[0]) return;
          if (S.lbFilter === "week" && (!r.ts || Date.now() - r.ts > 7 * 864e5)) return;
          if (S.lbSearch && String(r.name || "").toLowerCase().indexOf(S.lbSearch.toLowerCase()) < 0) return;
          rows.push(r);
        });
        rows.sort(function (a, b) {
          return (b.percentage || 0) - (a.percentage || 0) || (b.score || 0) - (a.score || 0) || (a.timeTaken || 0) - (b.timeTaken || 0);
        });
        rows = rows.slice(0, 25);
        if (!rows.length) { box.innerHTML = '<div class="nq-lb-empty">No results in this filter yet — be the first!</div>'; return; }
        box.innerHTML = rows.map(function (r, i) {
          var medal = ["🥇", "🥈", "🥉"][i] || '<i class="nq-lb-n">' + (i + 1) + "</i>";
          return '<div class="nq-lb-row' + (r.uid === myUid() ? " me" : "") + '"><span class="nq-lb-medal">' + medal + "</span>" +
            "<b>" + esc(r.name || "Player") + "</b><span>" + r.score + "/" + r.total + " · " + r.percentage + "%</span>" +
            "<i>" + esc((PACKS[r.mode] || {}).n || r.mode || "Quiz") + "</i></div>";
        }).join("");
      }).catch(function () {
        box.innerHTML = '<div class="nq-lb-empty">Could not load the leaderboard.</div>';
      });
    } catch (e) {
      box.innerHTML = '<div class="nq-lb-empty">Could not load the leaderboard.</div>';
    }
  }

  /* ============================================================
     Page mount + event wiring
     ============================================================ */
  function bindPage(rootEl) {
    if (!rootEl) return;
    rootEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-nq]");
      if (!b) return;
      var act = b.getAttribute("data-nq");
      var v = b.getAttribute("data-v");
      if (act === "cat") { startQuiz(v, "classic"); return; }
      if (act === "quick") { startQuiz("mixed", "classic", 10); return; }
      if (act === "daily") {
        var key = "vq_daily_done_" + new Date().toISOString().split("T")[0];
        if (ls(key) === "1") { toast("Daily already done — come back tomorrow!", "info"); return; }
        var seed = parseInt(new Date().toISOString().split("T")[0].replace(/-/g, ""), 10);
        startQuiz("mixed", "daily", 10, seed);
        return;
      }
      if (act === "battle") { openBattle(); return; }
      if (act === "start") { startQuiz(S.cat, "classic"); return; }
      if (act === "nav") {
        try { navTo("quiz", v); } catch (e) {}
        return;
      }
      if (act === "more") {
        var x = rootEl.querySelector(".nq-extra");
        if (x) x.hidden = !x.hidden;
        return;
      }      if (act === "opt") { answer(parseInt(v, 10)); return; }
      if (act === "again") { startQuiz(S.cat, S.gMode === "daily" ? "classic" : S.gMode, S.count, S.gMode === "battle" ? S.seed : undefined); return; }
      if (act === "home") { S.view = "home"; rerender(); return; }
      if (act === "lbf") { S.lbFilter = v; rerender(); return; }
    });
    var ds = rootEl.querySelector("select[data-nq='diff']");
    if (ds && !ds.__nq) {
      ds.__nq = 1;
      ds.addEventListener("change", function () { S.diff = ds.value; });
    }
    var dc = rootEl.querySelector("select[data-nq='count']");
    if (dc && !dc.__nq) {
      dc.__nq = 1;
      dc.addEventListener("change", function () { S.count = parseInt(dc.value, 10) || 10; });
    }
    var srch = rootEl.querySelector("input[data-nq='lbsearch']");
    if (srch && !srch.__nq) {
      srch.__nq = 1;
      srch.addEventListener("input", function () {
        S.lbSearch = srch.value;
        clearTimeout(srch.__t);
        srch.__t = setTimeout(loadLeaderboard, 250);
      });
    }
  }

  function mountQuizPage(sub) {
    if (S.view === "result" && (sub === "leaderboard" || sub === "history")) S.view = "home";
    /* a finished result is shown right after finishing; later visits go home */
    if (S.view === "result" && !S.justFinished) S.view = "home";
    S.justFinished = false;
    var html = pageHTML(sub);
    setTimeout(function () {
      var el = document.querySelector(".nq-wrap");
      if (el && !el.__nqBound) {
        el.__nqBound = true;
        bindPage(el);
      }
      if (sub === "leaderboard") loadLeaderboard();
    }, 80);
    return html;
  }

  /* ---------- override the legacy quiz page ---------- */
  function install() {
    try {
      if (typeof PAGES !== "undefined" && PAGES) {
        PAGES.quiz = function () { return mountQuizPage(typeof viewParam !== "undefined" && viewParam || null); };
      } else {
        var tries = 0;
        var iv = setInterval(function () {
          tries++;
          if (typeof PAGES !== "undefined" && PAGES) {
            clearInterval(iv);
            PAGES.quiz = function () { return mountQuizPage(typeof viewParam !== "undefined" && viewParam || null); };
          } else if (tries > 40) clearInterval(iv);
        }, 250);
      }
    } catch (e) {}
    /* ?view=quiz deep link (manifest shortcut) */
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("view") === "quiz") {
        setTimeout(function () {
          try { if (typeof navTo === "function") navTo("quiz"); } catch (e) {}
        }, 2200);
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();

  
})();
