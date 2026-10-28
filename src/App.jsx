import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Search, Heart, MapPin, Clock3, ArrowRight, Sparkles,
  TicketCheck, X, CheckCircle2, Menu, Users, Compass, ChevronDown,
  GraduationCap, PartyPopper, Code2, Music2, Trophy, SlidersHorizontal
} from "lucide-react";

const EVENTS = [
  {
    id: "ev1", title: "CodeStorm Hackathon", category: "Technical",
    date: "2026-11-12T09:00:00", endDate: "2026-11-12T18:00:00",
    venue: "Innovation Lab", fee: 0, seats: 120, host: "Coding Club",
    description: "Bring your ideas to life in a fast-paced team coding challenge. Build a prototype, learn from mentors, and present your solution.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=85",
    tag: "POPULAR", accent: "violet"
  },
  {
    id: "ev2", title: "Campus Vibes Fest", category: "Cultural",
    date: "2026-11-15T16:00:00", endDate: "2026-11-15T21:00:00",
    venue: "Main Auditorium", fee: 0, seats: 300, host: "Cultural Committee",
    description: "An evening of music, dance, performances, and creative expression by students across campus.",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=85",
    tag: "CAMPUS FAVOURITE", accent: "pink"
  },
  {
    id: "ev3", title: "AI & Future Tech Workshop", category: "Workshop",
    date: "2026-11-20T10:00:00", endDate: "2026-11-20T13:00:00",
    venue: "Seminar Hall 2", fee: 99, seats: 80, host: "AI/ML Club",
    description: "Explore practical AI concepts, prompt design, and small hands-on activities guided by student mentors.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=85",
    tag: "LIMITED SEATS", accent: "blue"
  },
  {
    id: "ev4", title: "Inter-Branch Sports Meet", category: "Sports",
    date: "2026-11-24T08:30:00", endDate: "2026-11-24T17:00:00",
    venue: "College Sports Ground", fee: 0, seats: 200, host: "Sports Club",
    description: "Represent your branch, meet new teammates, and compete in a friendly day of campus sports.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=85",
    tag: "REGISTRATION OPEN", accent: "green"
  },
  {
    id: "ev5", title: "Design Thinking Sprint", category: "Workshop",
    date: "2026-12-02T11:00:00", endDate: "2026-12-02T15:00:00",
    venue: "Project Studio", fee: 49, seats: 60, host: "Innovation Club",
    description: "Work in small groups to identify a campus problem, sketch solutions, and pitch a simple prototype.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=85",
    tag: "HANDS-ON", accent: "orange"
  },
  {
    id: "ev6", title: "Photography Walk", category: "Cultural",
    date: "2026-12-06T07:00:00", endDate: "2026-12-06T10:00:00",
    venue: "Central Library Gate", fee: 0, seats: 40, host: "Photography Club",
    description: "Discover composition, lighting, and storytelling on a relaxed photo walk around campus.",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1000&q=85",
    tag: "ALL LEVELS", accent: "pink"
  }
];

const categories = ["All events", "Technical", "Workshop", "Cultural", "Sports"];
const clubs = [
  { name: "Coding Club", description: "Build, hack, and learn together.", className: "club-violet", icon: Code2, matches: event => event.host === "Coding Club" },
  { name: "Cultural Club", description: "Make some noise. Make memories.", className: "club-pink", icon: Music2, matches: event => event.category === "Cultural" },
  { name: "Sports Club", description: "Play hard. Grow together.", className: "club-blue", icon: Trophy, matches: event => event.host === "Sports Club" },
  { name: "Innovation Club", description: "Turn ideas into impact.", className: "club-orange", icon: GraduationCap, matches: event => event.host === "Innovation Club" }
];
const money = (fee) => fee === 0 ? "Free" : `₹${fee}`;
const dateLabel = (date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const timeLabel = (date) => new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const readStorage = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};

function getDeviceId() {
  let id;
  try { id = localStorage.getItem("cc_device_id"); } catch { /* Storage can be disabled by the browser. */ }
  if (!id) id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try { localStorage.setItem("cc_device_id", id); } catch { /* The current page can still use this demo ID. */ }
  return id;
}

async function readApiResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}

const cleanErrorMessage = (error) => String(error?.message || "Unexpected error").replace(/[.!?\s]+$/, "");

function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const distance = Math.max(0, new Date(target).getTime() - now);
  const units = [
    ["Days", Math.floor(distance / 86400000)],
    ["Hours", Math.floor((distance / 3600000) % 24)],
    ["Mins", Math.floor((distance / 60000) % 60)],
    ["Secs", Math.floor((distance / 1000) % 60)]
  ];
  return <div className="countdown">{units.map(([label, value]) =>
    <div className="countdown-unit" key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
  )}</div>;
}

function RegistrationModal({ event, onClose, onRegistered, registrations, studentId }) {
  const [deviceId] = useState(() => getDeviceId());
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", rollNumber: studentId, mobile: "", section: "", year: "2nd Year", branch: "CSE" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);

  if (!event) return null;
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Please enter your full name.";
    if (!form.rollNumber.trim()) nextErrors.rollNumber = "Please enter your student roll number.";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) nextErrors.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (!form.section.trim()) nextErrors.section = "Please enter your section.";
    if (!form.year) nextErrors.year = "Choose your year.";
    if (!form.branch) nextErrors.branch = "Choose your branch.";
    const duplicate = registrations.some(r => r.eventId === event.id && r.rollNumber?.toUpperCase() === form.rollNumber.trim().toUpperCase());
    if (duplicate) nextErrors.form = "This student is already registered for this event.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, eventId: event.id, eventTitle: event.title, eventDate: event.date,
          eventVenue: event.venue, name: form.name.trim(), rollNumber: form.rollNumber.trim().toUpperCase(),
          mobile: form.mobile.trim(), section: form.section.trim(), year: form.year, branch: form.branch, fee: event.fee })
      });
      const result = await readApiResponse(response);
      onRegistered(result);
      setDone(result);
    } catch (err) {
      const message = err instanceof TypeError
        ? "Cannot reach the backend. Start it with npm run dev:full, then retry."
        : /^Request failed \(5\d\d\)/.test(err.message || "")
          ? "The backend returned a server error. Check its terminal for details, then retry."
        : cleanErrorMessage(err);
      setErrors(prev => ({ ...prev, form: `Registration was not saved: ${message}` }));
    } finally { setSubmitting(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      {done ? <div className="success-state">
        <div className="success-icon"><CheckCircle2 size={34}/></div>
        <p className="eyebrow">REGISTRATION SAVED</p>
        <h2>You're on the list, {done.name.split(" ")[0]}!</h2>
        <p className="muted">Your registration was saved by the CampusConnect server.</p>
        <div className="receipt">
          <div><span>Event</span><strong>{done.eventTitle}</strong></div>
          <div><span>Registration ID</span><strong>{done.registrationId}</strong></div>
          <div><span>Roll number</span><strong>{done.rollNumber}</strong></div>
          <div><span>Section</span><strong>{done.section || done.className}</strong></div>
          <div><span>Payment</span><strong>{done.paymentStatus}</strong></div>
        </div>
        {event.fee > 0 && <p className="notice">This is a demo only. No payment was collected. Add a verified payment provider before accepting real fees.</p>}
        <button className="button button-primary button-full" onClick={onClose}>Done</button>
      </div> : <>
        <p className="eyebrow">EVENT REGISTRATION</p>
        <h2 id="registration-title">Save your spot</h2>
        <div className="selected-event">
          <img src={event.image} alt="" />
          <div><strong>{event.title}</strong><span>{dateLabel(event.date)} · {event.venue}</span><span className="event-fee">{money(event.fee)}</span></div>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <label className="field field-wide">Full name <b>*</b>
              <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Enter your full name" autoFocus />
              {errors.name && <small className="error">{errors.name}</small>}
            </label>
            <label className="field field-wide">Student roll number <b>*</b>
              <input value={form.rollNumber} onChange={e => update("rollNumber", e.target.value)} placeholder="Enter your roll number" maxLength={40} autoComplete="username" />
              {errors.rollNumber && <small className="error">{errors.rollNumber}</small>}
            </label>
            <label className="field">Mobile number <b>*</b>
              <input inputMode="numeric" maxLength={10} value={form.mobile} onChange={e => update("mobile", e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile number" />
              {errors.mobile && <small className="error">{errors.mobile}</small>}
            </label>
            <label className="field">Branch <b>*</b>
              <select value={form.branch} onChange={e => update("branch", e.target.value)}>
                <option value="CSE">CSE</option><option value="CSE (AI & ML)">CSE (AI &amp; ML)</option>
                <option value="CSE (Data Science)">CSE (Data Science)</option><option value="IT">IT</option>
                <option value="ECE">ECE</option><option value="EEE">EEE</option><option value="Other">Other</option>
              </select>
              {errors.branch && <small className="error">{errors.branch}</small>}
            </label>
            <label className="field">Year <b>*</b>
              <select value={form.year} onChange={e => update("year", e.target.value)}>
                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
              </select>
              {errors.year && <small className="error">{errors.year}</small>}
            </label>
            <label className="field">Section <b>*</b>
              <input value={form.section} onChange={e => update("section", e.target.value)} placeholder="e.g. A" maxLength={30} />
              {errors.section && <small className="error">{errors.section}</small>}
            </label>
          </div>
          {errors.form && <p className="error">{errors.form}</p>}
          <div className="payment-summary"><span>Registration fee</span><strong>{money(event.fee)}</strong></div>
          {event.fee > 0 && <p className="notice">Demo mode: paid-event registration is recorded as unpaid. No QR payment is collected.</p>}
          <button className="button button-primary button-full" type="submit" disabled={submitting}>{submitting ? "Saving registration…" : "Confirm registration"} <ArrowRight size={17}/></button>
          <p className="form-footnote">Fields marked * are required. Student IDs are entered by the user and are not verified against college records.</p>
        </form>
      </>}
    </section>
  </div>;
}

function StudentLogin({ onLogin }) {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const id = studentId.trim();
    if (id.length < 2 || id.length > 40) {
      setError("Enter a student ID between 2 and 40 characters.");
      return;
    }
    onLogin(id);
  };

  return <main className="student-login-page">
    <section className="student-login-card">
      <span className="brand-mark"><CalendarDays size={22}/></span>
      <p className="eyebrow">STUDENT ENTRY</p>
      <h1>Welcome to CampusConnect</h1>
      <p className="section-subtitle">Enter your student ID or roll number to explore campus events.</p>
      <form onSubmit={submit}>
        <label className="field">Student ID / Roll number <b>*</b>
          <input autoFocus value={studentId} onChange={event => setStudentId(event.target.value)} placeholder="Enter your ID" maxLength={40} autoComplete="username" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button button-primary button-full" type="submit">Continue <ArrowRight size={17}/></button>
      </form>
      <p className="login-disclaimer">Demo entry only. This project does not verify IDs with college records and is not secure authentication.</p>
    </section>
  </main>;
}

function EventCard({ event, favorite, onFavorite, onDetails, onRegister }) {
  return <article className="event-card">
    <div className="event-image-wrap">
      <img className="event-image" src={event.image} alt={event.title} loading="lazy"
        onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.classList.add("image-fallback"); }} />
      <span className={`event-tag tag-${event.accent}`}>{event.tag}</span>
      <button className={`favorite-button ${favorite ? "is-favorite" : ""}`} aria-label={favorite ? "Remove favorite" : "Add favorite"} onClick={() => onFavorite(event.id)}>
        <Heart size={18} fill={favorite ? "currentColor" : "none"}/>
      </button>
      <span className="image-date"><strong>{new Date(event.date).getDate()}</strong><span>{new Date(event.date).toLocaleDateString("en-IN", { month: "short" })}</span></span>
    </div>
    <div className="event-card-body">
      <div className="event-meta-top"><span className="category-label">{event.category}</span><span className="fee-label">{money(event.fee)}</span></div>
      <h3>{event.title}</h3>
      <p className="event-description">{event.description}</p>
      <div className="event-info"><span><Clock3 size={15}/>{timeLabel(event.date)}</span><span><MapPin size={15}/>{event.venue}</span></div>
      <div className="event-card-bottom">
        <button className="text-button" onClick={() => onDetails(event)}>Details <ArrowRight size={15}/></button>
        <button className="button button-small button-primary" onClick={() => onRegister(event)}>Register</button>
      </div>
    </div>
  </article>;
}

function DetailsModal({ event, onClose, onRegister, favorite, onFavorite }) {
  if (!event) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal details-modal" role="dialog" aria-modal="true">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
      <img className="details-image" src={event.image} alt={event.title}/>
      <p className="eyebrow">{event.category} EVENT</p><h2>{event.title}</h2>
      <p className="details-description">{event.description}</p>
      <div className="detail-facts">
        <div><CalendarDays/><span><b>{dateLabel(event.date)}</b><small>{new Date(event.date).toLocaleDateString("en-IN", { weekday: "long" })}</small></span></div>
        <div><Clock3/><span><b>{timeLabel(event.date)}</b><small>Start time</small></span></div>
        <div><MapPin/><span><b>{event.venue}</b><small>Venue</small></span></div>
        <div><Users/><span><b>{event.seats} seats</b><small>Capacity (sample)</small></span></div>
      </div>
      <div className="details-bottom"><strong className="details-price">{money(event.fee)}</strong>
        <button className={`button ${favorite ? "button-soft" : "button-outline"}`} onClick={() => onFavorite(event.id)}><Heart size={16} fill={favorite ? "currentColor" : "none"}/> {favorite ? "Saved" : "Save event"}</button>
        <button className="button button-primary" onClick={() => onRegister(event)}>Register now <ArrowRight size={16}/></button>
      </div>
    </section>
  </div>;
}

export default function App() {
  const [studentId, setStudentId] = useState(() => {
    try { return localStorage.getItem("cc_student_id") || ""; } catch { return ""; }
  });
  const [activeCategory, setActiveCategory] = useState("All events");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("soonest");
  const [favorites, setFavorites] = useState(() => {
    const saved = readStorage("cc_favorites", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [registrations, setRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState("");
  const [registrationRefresh, setRegistrationRefresh] = useState(0);
  const [deviceId] = useState(() => getDeviceId());
  const [view, setView] = useState("explore");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeClub, setActiveClub] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const login = (id) => {
    const normalized = id.trim().toUpperCase();
    try { localStorage.setItem("cc_student_id", normalized); } catch { /* Keep this page session usable. */ }
    setStudentId(normalized);
  };
  const logout = () => {
    try { localStorage.removeItem("cc_student_id"); } catch { /* Continue with in-memory logout. */ }
    setStudentId("");
  };

  useEffect(() => {
    try { localStorage.setItem("cc_favorites", JSON.stringify(favorites)); } catch { /* Favorites remain available for this page session. */ }
  }, [favorites]);
  useEffect(() => {
    let active = true;
    setRegistrationsLoading(true);
    setRegistrationsError("");
    fetch(`/api/registrations?deviceId=${encodeURIComponent(deviceId)}&rollNumber=${encodeURIComponent(studentId)}`)
      .then(readApiResponse)
      .then(data => {
        if (!Array.isArray(data)) throw new Error("The server returned an invalid registrations list.");
        if (active) setRegistrations(data);
      })
      .catch(err => { if (active) setRegistrationsError(`Could not load your events: ${cleanErrorMessage(err)}`); })
      .finally(() => { if (active) setRegistrationsLoading(false); });
    return () => { active = false; };
  }, [deviceId, registrationRefresh, studentId]);

  const filteredEvents = useMemo(() => {
    let list = EVENTS.filter(e => {
      const matchesCategory = view === "my-events" || activeCategory === "All events" || e.category === activeCategory;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [e.title, e.category, e.venue, e.host, e.description].some(s => s.toLowerCase().includes(query));
      const matchesFavorite = !showFavoritesOnly || favorites.includes(e.id);
      const matchesRegistered = view !== "my-events" || registrations.some(r => r.eventId === e.id && r.rollNumber?.toUpperCase() === studentId);
      const club = clubs.find(item => item.name === activeClub);
      const matchesClub = !club || club.matches(e);
      return matchesCategory && matchesSearch && matchesFavorite && matchesRegistered && matchesClub;
    });
    if (sort === "soonest") list.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sort === "latest") list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sort === "fee-low") list.sort((a, b) => a.fee - b.fee);
    return list;
  }, [activeCategory, search, sort, showFavoritesOnly, favorites, view, registrations, activeClub, studentId]);

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const saveRegistration = (registration) => setRegistrations(prev => [registration, ...prev.filter(r => r.registrationId !== registration.registrationId)]);
  const openRegister = (event) => { setSelectedEvent(null); setRegisterEvent(event); };
  const registeredIds = new Set(registrations.map(r => r.eventId));
  const featured = EVENTS[0];

  const goToEvents = () => {
    setView("explore"); setShowFavoritesOnly(false); setActiveClub(null); setMobileNav(false);
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  const openClubEvents = (clubName) => {
    setView("explore");
    setShowFavoritesOnly(false);
    setActiveCategory("All events");
    setSearch("");
    setActiveClub(clubName);
    setMobileNav(false);
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  if (!studentId) return <StudentLogin onLogin={login} />;
  const studentRegistrations = registrations.filter(r => r.rollNumber?.toUpperCase() === studentId);
  return <div className="app-shell">
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => { setView("explore"); setShowFavoritesOnly(false); setActiveClub(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="CampusConnect home">
          <span className="brand-mark"><CalendarDays size={22}/></span><span>Campus<span className="brand-accent">Connect</span><small>YOUR CAMPUS, YOUR COMMUNITY</small></span>
        </button>
        <button className="mobile-menu icon-button" onClick={() => setMobileNav(v => !v)} aria-label="Toggle menu"><Menu/></button>
        <nav className={mobileNav ? "main-nav nav-open" : "main-nav"}>
          <button className={view === "explore" && !showFavoritesOnly && !activeClub ? "nav-link active" : "nav-link"} onClick={() => { setView("explore"); setShowFavoritesOnly(false); setActiveClub(null); setMobileNav(false); }}>Explore events</button>
          <button className={showFavoritesOnly ? "nav-link active" : "nav-link"} onClick={() => { setView("explore"); setShowFavoritesOnly(true); setActiveClub(null); setMobileNav(false); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}>Favorites <span className="nav-count">{favorites.length}</span></button>
          <button className={view === "my-events" ? "nav-link active" : "nav-link"} onClick={() => { setView("my-events"); setShowFavoritesOnly(false); setActiveClub(null); setMobileNav(false); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}>My events <span className="nav-count">{studentRegistrations.length}</span></button>
          <button className="button button-primary nav-cta" onClick={goToEvents}>Find an event <ArrowRight size={16}/></button>
          <button className="nav-link" onClick={logout}>Log out</button>
        </nav>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-glow glow-one"></div><div className="hero-glow glow-two"></div>
        <div className="hero-content">
          <div className="hero-pill"><Sparkles size={14}/> MAKE THE MOST OF CAMPUS LIFE</div>
          <h1>There's more to<br/>college than <span>classrooms.</span></h1>
          <p className="hero-copy">Discover workshops, hackathons, cultural fests and the people who make campus unforgettable.</p>
          <div className="hero-actions"><button className="button button-light" onClick={goToEvents}>Explore events <ArrowRight size={17}/></button><button className="hero-secondary" onClick={() => { setView("explore"); setShowFavoritesOnly(true); setActiveClub(null); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}><Heart size={16}/> Your saved events</button></div>
          <div className="hero-stats"><div><strong>06</strong><span>Upcoming events</span></div><i></i><div><strong>04</strong><span>Categories</span></div><i></i><div><strong>01</strong><span>Campus community</span></div></div>
        </div>
        <div className="hero-art">
          <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
          <div className="art-main-card"><img src={featured.image} alt="Students at a technology event"/><div className="art-card-gradient"></div><div className="art-card-content"><span className="art-kicker"><span className="live-dot"></span> FEATURED EVENT</span><h3>CodeStorm<br/>Hackathon</h3><p><CalendarDays size={14}/> Nov 12 · Innovation Lab</p></div></div>
          <div className="floating-card float-top"><span className="float-icon"><TicketCheck size={19}/></span><span><b>One campus.</b><small>Endless experiences.</small></span></div>
          <div className="floating-card float-bottom"><span className="avatar-stack"><i>✦</i><i>⚡</i><i>♫</i></span><span><b>Find your people</b><small>Discover clubs & events</small></span></div>
          <div className="art-sparkle sparkle-a">✳</div><div className="art-sparkle sparkle-b">✦</div>
        </div>
      </section>

      <section className="trust-strip">
        <div><span className="trust-icon"><Compass size={18}/></span><span><b>Discover</b><small>Find what interests you</small></span></div>
        <div><span className="trust-icon"><CalendarDays size={18}/></span><span><b>Stay updated</b><small>Never miss a date</small></span></div>
        <div><span className="trust-icon"><Users size={18}/></span><span><b>Get involved</b><small>Meet your community</small></span></div>
      </section>

      <section className="events-section section-wrap" id="events">
        <div className="section-heading">
          <div><p className="eyebrow">{view === "my-events" ? "YOUR CAMPUS CALENDAR" : showFavoritesOnly ? "YOUR SHORTLIST" : activeClub ? "CLUB EVENTS" : "WHAT'S HAPPENING ON CAMPUS"}</p>
            <h2>{view === "my-events" ? "My registered events" : showFavoritesOnly ? "Your saved events" : activeClub ? `${activeClub} events` : "Find your next thing."}</h2>
            <p className="section-subtitle">{view === "my-events" ? "All the events you've registered for, in one place." : showFavoritesOnly ? "The events you've saved for later." : activeClub ? `Upcoming events for ${activeClub}.` : "From big ideas to big nights — there's something for everyone."}</p>
          </div>
          {view !== "my-events" && <div className="sort-control"><SlidersHorizontal size={16}/><select aria-label="Sort events" value={sort} onChange={e => setSort(e.target.value)}><option value="soonest">Date: soonest</option><option value="latest">Date: latest</option><option value="fee-low">Fee: lowest</option></select><ChevronDown size={14}/></div>}
        </div>
        <div className="event-tools">
          <label className="search-box"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events, venues, categories..." /><kbd>⌘ K</kbd></label>
          {view !== "my-events" && <div className="category-list">{categories.map(cat => <button key={cat} className={`category-chip ${activeCategory === cat ? "selected" : ""}`} onClick={() => { setActiveCategory(cat); setActiveClub(null); }}>{cat}</button>)}</div>}
        </div>
        {view === "my-events" && registrationsLoading && <p className="section-subtitle" role="status">Loading your registrations…</p>}
        {view === "my-events" && registrationsError && <div className="empty-state" role="alert"><h3>Could not connect to your registrations</h3><p>{registrationsError}. Check that the backend is running, then retry.</p><button className="button button-primary" onClick={() => setRegistrationRefresh(value => value + 1)}>Retry</button></div>}
        <div className="results-line"><span>{filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found</span>{(search || activeCategory !== "All events" || showFavoritesOnly || activeClub) && <button onClick={() => { setSearch(""); setActiveCategory("All events"); setShowFavoritesOnly(false); setActiveClub(null); }}>Clear filters <X size={13}/></button>}</div>
        {view === "my-events" && (registrationsLoading || registrationsError) ? null : filteredEvents.length ? <div className="events-grid">{filteredEvents.map(event => <EventCard key={event.id} event={event} favorite={favorites.includes(event.id)} onFavorite={toggleFavorite} onDetails={setSelectedEvent} onRegister={openRegister}/>)}</div> :
          <div className="empty-state"><span><CalendarDays size={26}/></span><h3>No events found</h3><p>{view === "my-events" ? "Register for an event and it will appear here." : activeClub ? `There are no upcoming events listed for ${activeClub} yet.` : "Try another search or clear your filters."}</p><button className="button button-primary" onClick={() => { setView("explore"); setSearch(""); setActiveCategory("All events"); setShowFavoritesOnly(false); setActiveClub(null); }}>Explore all events</button></div>}
      </section>

      <section className="countdown-section">
        <div className="countdown-copy"><span className="countdown-label"><span className="live-dot"></span> COMING UP NEXT</span><h2>Ready to build<br/>something amazing?</h2><p>CodeStorm Hackathon is around the corner. Bring your ideas, find a team, and make something real.</p><div className="countdown-event-meta"><span><CalendarDays size={16}/> November 12, 2026</span><span><MapPin size={16}/> Innovation Lab</span></div><button className="button button-light" onClick={() => openRegister(featured)}>Save your spot <ArrowRight size={16}/></button></div>
        <div className="countdown-side"><p>THE COUNTDOWN IS ON</p><Countdown target={featured.date}/><div className="countdown-note"><Sparkles size={15}/> Your next campus story starts here.</div></div>
      </section>

      <section className="clubs-section section-wrap">
        <div className="section-heading club-heading"><div><p className="eyebrow">FIND YOUR COMMUNITY</p><h2>There's a club for that.</h2><p className="section-subtitle">Meet people who love what you love.</p></div></div>
        <div className="clubs-grid">
          {clubs.map(club => {
            const Icon = club.icon;
            return <button key={club.name} type="button" className={`club-card ${club.className}`} onClick={() => openClubEvents(club.name)} aria-label={`Explore ${club.name} events`} aria-pressed={activeClub === club.name}>
              <span><Icon size={23}/></span><div><h3>{club.name}</h3><p>{club.description}</p></div><b>Explore ↗</b>
            </button>;
          })}
        </div>
      </section>
    </main>

    <footer className="site-footer"><div className="footer-main"><div className="brand footer-brand"><span className="brand-mark"><CalendarDays size={21}/></span><span>Campus<span className="brand-accent">Connect</span><small>YOUR CAMPUS, YOUR COMMUNITY</small></span></div><p>Good things happen when you show up.<br/>Find your next campus experience.</p><button className="button button-light" onClick={goToEvents}>Explore events <ArrowRight size={16}/></button></div><div className="footer-bottom"><span>© 2026 CampusConnect · SDC Student Project</span><span>Built for campus life, with ♥</span></div></footer>

    <DetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onRegister={openRegister} favorite={selectedEvent ? favorites.includes(selectedEvent.id) : false} onFavorite={toggleFavorite}/>
    <RegistrationModal key={registerEvent?.id || "none"} event={registerEvent} onClose={() => setRegisterEvent(null)} onRegistered={saveRegistration} registrations={registrations}/>
  </div>;
}
