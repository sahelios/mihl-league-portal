import { useState } from "react";

// Theme constants — Navy Blue + Light Silver
const NAVY = "#1a1f3a";
const SILVER = "#c0c5d0";

const REGISTRATION_TYPES = [
  { id: "individual", label: "Individual" },
  { id: "team", label: "Team (10–15 players)" },
  { id: "spare", label: "Spare" },
  { id: "referee", label: "Referee" },
  { id: "scorekeeper", label: "Scorekeeper" },
];

const POSITIONS = ["Forward", "Defenseman", "Goalie"];
const TEAMS = ["Northstars", "Phantoms", "Ironworks", "Voltage"];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

const blankPlayer = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  rating: 5,
});

const blankFriend = () => ({ firstName: "", lastName: "" });

const blankEmergency = () => ({
  name: "",
  relationship: "",
  phone: "",
  altPhone: "",
});

const blankAvailability = () => {
  const grid = {};
  DAYS_OF_WEEK.forEach((d) => {
    grid[d] = {};
    TIME_SLOTS.forEach((t) => (grid[d][t] = false));
  });
  return grid;
};

const initialFormState = () => ({
  registrationType: "",
  // Primary registrant (used for individual / spare / referee / scorekeeper / team captain)
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  rating: 5,
  position: "",
  preferredTeam: "",
  wantsCaptain: false,
  friends: [blankFriend(), blankFriend(), blankFriend()],
  // Team-specific
  teamName: "",
  teamPlayers: Array.from({ length: 10 }, blankPlayer),
  // Officials
  availability: blankAvailability(),
  // Emergency
  emergency: blankEmergency(),
  // Waiver
  waiverChecked: false,
  waiverSignature: "",
});

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v) => /^[\d\s\-+().]{10,}$/.test(v.trim());

export default function PlayerRegistrationForm() {
  const [form, setForm] = useState(initialFormState());
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isOfficial =
    form.registrationType === "referee" ||
    form.registrationType === "scorekeeper";
  const isTeam = form.registrationType === "team";
  const isPlayerRole =
    form.registrationType === "individual" ||
    form.registrationType === "spare" ||
    form.registrationType === "team";

  // -- helpers ---------------------------------------------------------------
  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateFriend = (idx, field, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.friends[idx][field] = value;
      return next;
    });
  };

  const updateTeamPlayer = (idx, field, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.teamPlayers[idx][field] = value;
      return next;
    });
  };

  const addTeamPlayer = () => {
    if (form.teamPlayers.length >= 15) return;
    setForm((prev) => ({
      ...prev,
      teamPlayers: [...prev.teamPlayers, blankPlayer()],
    }));
  };

  const removeTeamPlayer = (idx) => {
    if (form.teamPlayers.length <= 10) return;
    setForm((prev) => ({
      ...prev,
      teamPlayers: prev.teamPlayers.filter((_, i) => i !== idx),
    }));
  };

  const toggleAvailability = (day, slot) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.availability[day][slot] = !next.availability[day][slot];
      return next;
    });
  };

  // -- validation ------------------------------------------------------------
  const validate = () => {
    const e = {};

    if (!form.registrationType) e.registrationType = "Select a registration type.";

    // Primary contact required for everyone
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    else if (!isPhone(form.phone)) e.phone = "Enter a valid phone number.";

    if (isPlayerRole) {
      if (!form.position) e.position = "Select a position.";
      if (!form.preferredTeam) e.preferredTeam = "Choose a preferred team.";
      if (form.rating < 1 || form.rating > 10)
        e.rating = "Rating must be between 1 and 10.";
    }

    if (isTeam) {
      if (!form.teamName.trim()) e.teamName = "Team name is required.";
      const playerErrors = [];
      form.teamPlayers.forEach((p, idx) => {
        const pe = {};
        if (!p.firstName.trim()) pe.firstName = "Required";
        if (!p.lastName.trim()) pe.lastName = "Required";
        if (!p.email.trim()) pe.email = "Required";
        else if (!isEmail(p.email)) pe.email = "Invalid";
        if (!p.position) pe.position = "Required";
        if (Object.keys(pe).length) playerErrors[idx] = pe;
      });
      if (playerErrors.length) e.teamPlayers = playerErrors;
      if (form.teamPlayers.length < 10 || form.teamPlayers.length > 15)
        e.teamRoster = "Team rosters must have between 10 and 15 players.";
    }

    if (isOfficial) {
      const anySelected = DAYS_OF_WEEK.some((d) =>
        TIME_SLOTS.some((t) => form.availability[d][t])
      );
      if (!anySelected) e.availability = "Select at least one availability slot.";
    }

    // Emergency contact
    if (!form.emergency.name.trim())
      e.emergencyName = "Emergency contact name is required.";
    if (!form.emergency.relationship.trim())
      e.emergencyRelationship = "Relationship is required.";
    if (!form.emergency.phone.trim())
      e.emergencyPhone = "Emergency contact phone is required.";
    else if (!isPhone(form.emergency.phone))
      e.emergencyPhone = "Enter a valid phone number.";

    // Waiver
    if (!form.waiverChecked) e.waiverChecked = "You must accept the waiver.";
    if (form.waiverSignature.trim().toLowerCase() !== "i agree")
      e.waiverSignature = 'Type "I agree" exactly to confirm.';

    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSubmitted(true);
      // In production: POST `form` to the registration endpoint.
      console.log("Registration payload:", form);
    } else {
      // Scroll to first error for usability
      const firstField = document.querySelector("[data-error='true']");
      if (firstField) firstField.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const resetForm = () => {
    setForm(initialFormState());
    setErrors({});
    setSubmitted(false);
  };

  // -- styles ----------------------------------------------------------------
  const labelClass = "block text-sm font-semibold mb-1";
  const inputBase =
    "w-full px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 transition";
  const inputClass = (hasError) =>
    `${inputBase} ${
      hasError
        ? "border-red-500 focus:ring-red-300"
        : "border-slate-300 focus:ring-slate-400"
    }`;
  const sectionClass =
    "rounded-lg border p-5 mb-6 shadow-sm";
  const sectionStyle = { borderColor: SILVER, backgroundColor: "#f8f9fb" };
  const sectionHeaderClass = "text-lg font-bold mb-4 pb-2 border-b";
  const sectionHeaderStyle = { color: NAVY, borderColor: SILVER };
  const errorText = "text-xs text-red-600 mt-1";

  // -- success view ----------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: SILVER }}>
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center" style={{ borderTop: `6px solid ${NAVY}` }}>
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: NAVY }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>
            Registration Submitted
          </h1>
          <p className="text-slate-700 mb-1">
            Thank you, <span className="font-semibold">{form.firstName} {form.lastName}</span>.
          </p>
          <p className="text-slate-600 mb-6 text-sm">
            A confirmation has been sent to <span className="font-medium">{form.email}</span>.
            Registration type: <span className="font-medium capitalize">{form.registrationType}</span>.
          </p>
          <button
            onClick={resetForm}
            className="px-6 py-2 rounded-md text-white font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: NAVY }}
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  // -- form view -------------------------------------------------------------
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: SILVER }}>
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6" style={{ backgroundColor: NAVY }}>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Player Registration
          </h1>
          <p className="text-sm mt-1" style={{ color: SILVER }}>
            Complete all required fields. Items marked with * are mandatory.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 md:p-8">
          {/* Registration Type */}
          <div className={sectionClass} style={sectionStyle}>
            <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
              1. Registration Type *
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2" data-error={!!errors.registrationType}>
              {REGISTRATION_TYPES.map((rt) => {
                const active = form.registrationType === rt.id;
                return (
                  <button
                    type="button"
                    key={rt.id}
                    onClick={() => update("registrationType", rt.id)}
                    className="px-3 py-3 rounded-md border text-sm font-medium transition"
                    style={{
                      backgroundColor: active ? NAVY : "white",
                      color: active ? "white" : NAVY,
                      borderColor: active ? NAVY : SILVER,
                    }}
                  >
                    {rt.label}
                  </button>
                );
              })}
            </div>
            {errors.registrationType && (
              <p className={errorText}>{errors.registrationType}</p>
            )}
          </div>

          {/* Personal Info */}
          <div className={sectionClass} style={sectionStyle}>
            <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
              2. {isTeam ? "Captain / Primary Contact" : "Personal Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-error={!!errors.firstName}>
                <label className={labelClass} style={{ color: NAVY }}>First Name *</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className={inputClass(!!errors.firstName)}
                />
                {errors.firstName && <p className={errorText}>{errors.firstName}</p>}
              </div>
              <div data-error={!!errors.lastName}>
                <label className={labelClass} style={{ color: NAVY }}>Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className={inputClass(!!errors.lastName)}
                />
                {errors.lastName && <p className={errorText}>{errors.lastName}</p>}
              </div>
              <div data-error={!!errors.email}>
                <label className={labelClass} style={{ color: NAVY }}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass(!!errors.email)}
                />
                {errors.email && <p className={errorText}>{errors.email}</p>}
              </div>
              <div data-error={!!errors.phone}>
                <label className={labelClass} style={{ color: NAVY }}>Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass(!!errors.phone)}
                  placeholder="(514) 555-0123"
                />
                {errors.phone && <p className={errorText}>{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Player-specific (individual / spare / team-captain) */}
          {isPlayerRole && (
            <div className={sectionClass} style={sectionStyle}>
              <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
                3. Player Profile
              </h2>

              <div className="mb-4" data-error={!!errors.rating}>
                <label className={labelClass} style={{ color: NAVY }}>
                  Player Rating: <span className="font-bold">{form.rating}</span> / 10
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.rating}
                  onChange={(e) => update("rating", Number(e.target.value))}
                  className="w-full accent-slate-700"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 — Beginner</span>
                  <span>5 — Intermediate</span>
                  <span>10 — Elite</span>
                </div>
                {errors.rating && <p className={errorText}>{errors.rating}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div data-error={!!errors.position}>
                  <label className={labelClass} style={{ color: NAVY }}>Position *</label>
                  <div className="flex gap-2">
                    {POSITIONS.map((p) => {
                      const active = form.position === p;
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => update("position", p)}
                          className="flex-1 px-3 py-2 rounded-md border text-sm font-medium transition"
                          style={{
                            backgroundColor: active ? NAVY : "white",
                            color: active ? "white" : NAVY,
                            borderColor: active ? NAVY : SILVER,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  {errors.position && <p className={errorText}>{errors.position}</p>}
                </div>
                <div data-error={!!errors.preferredTeam}>
                  <label className={labelClass} style={{ color: NAVY }}>Preferred Team *</label>
                  <select
                    value={form.preferredTeam}
                    onChange={(e) => update("preferredTeam", e.target.value)}
                    className={inputClass(!!errors.preferredTeam)}
                  >
                    <option value="">— Select —</option>
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.preferredTeam && <p className={errorText}>{errors.preferredTeam}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass} style={{ color: NAVY }}>
                  Friend Requests (up to 3 — players you'd like on your team)
                </label>
                <div className="space-y-2">
                  {form.friends.map((fr, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={`Friend ${idx + 1} — First Name`}
                        value={fr.firstName}
                        onChange={(e) => updateFriend(idx, "firstName", e.target.value)}
                        className={inputClass(false)}
                      />
                      <input
                        type="text"
                        placeholder={`Friend ${idx + 1} — Last Name`}
                        value={fr.lastName}
                        onChange={(e) => updateFriend(idx, "lastName", e.target.value)}
                        className={inputClass(false)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.wantsCaptain}
                  onChange={(e) => update("wantsCaptain", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium" style={{ color: NAVY }}>
                  I'd like to be considered for Captain
                </span>
              </label>
            </div>
          )}

          {/* Team Roster */}
          {isTeam && (
            <div className={sectionClass} style={sectionStyle}>
              <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
                4. Team Roster ({form.teamPlayers.length} / 15)
              </h2>
              <div className="mb-4" data-error={!!errors.teamName}>
                <label className={labelClass} style={{ color: NAVY }}>Team Name *</label>
                <input
                  type="text"
                  value={form.teamName}
                  onChange={(e) => update("teamName", e.target.value)}
                  className={inputClass(!!errors.teamName)}
                />
                {errors.teamName && <p className={errorText}>{errors.teamName}</p>}
              </div>

              {errors.teamRoster && (
                <p className="mb-3 text-sm text-red-600 font-medium">{errors.teamRoster}</p>
              )}

              <div className="space-y-3">
                {form.teamPlayers.map((p, idx) => {
                  const pErr = (errors.teamPlayers && errors.teamPlayers[idx]) || {};
                  return (
                    <div
                      key={idx}
                      className="bg-white border rounded-md p-3"
                      style={{ borderColor: SILVER }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: NAVY }}>
                          Player #{idx + 1}
                        </span>
                        {form.teamPlayers.length > 10 && (
                          <button
                            type="button"
                            onClick={() => removeTeamPlayer(idx)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="First Name *"
                          value={p.firstName}
                          onChange={(e) => updateTeamPlayer(idx, "firstName", e.target.value)}
                          className={inputClass(!!pErr.firstName)}
                        />
                        <input
                          type="text"
                          placeholder="Last Name *"
                          value={p.lastName}
                          onChange={(e) => updateTeamPlayer(idx, "lastName", e.target.value)}
                          className={inputClass(!!pErr.lastName)}
                        />
                        <input
                          type="email"
                          placeholder="Email *"
                          value={p.email}
                          onChange={(e) => updateTeamPlayer(idx, "email", e.target.value)}
                          className={inputClass(!!pErr.email)}
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={p.phone}
                          onChange={(e) => updateTeamPlayer(idx, "phone", e.target.value)}
                          className={inputClass(false)}
                        />
                        <select
                          value={p.position}
                          onChange={(e) => updateTeamPlayer(idx, "position", e.target.value)}
                          className={inputClass(!!pErr.position)}
                        >
                          <option value="">Position *</option>
                          {POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <span className="text-xs whitespace-nowrap" style={{ color: NAVY }}>
                            Rating: <strong>{p.rating}</strong>
                          </span>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={p.rating}
                            onChange={(e) => updateTeamPlayer(idx, "rating", Number(e.target.value))}
                            className="w-full accent-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.teamPlayers.length < 15 && (
                <button
                  type="button"
                  onClick={addTeamPlayer}
                  className="mt-3 px-4 py-2 rounded-md text-sm font-semibold border"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  + Add Player ({form.teamPlayers.length}/15)
                </button>
              )}
            </div>
          )}

          {/* Officials availability */}
          {isOfficial && (
            <div className={sectionClass} style={sectionStyle}>
              <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
                {isTeam ? 5 : 4}. Availability Calendar *
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                Select all blocks when you are available to officiate / score.
              </p>
              <div data-error={!!errors.availability} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left" style={{ backgroundColor: NAVY, color: "white", borderColor: SILVER }}>
                        Day
                      </th>
                      {TIME_SLOTS.map((t) => (
                        <th key={t} className="border p-2" style={{ backgroundColor: NAVY, color: "white", borderColor: SILVER }}>
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map((d) => (
                      <tr key={d}>
                        <td className="border p-2 font-semibold" style={{ color: NAVY, borderColor: SILVER }}>{d}</td>
                        {TIME_SLOTS.map((t) => {
                          const checked = form.availability[d][t];
                          return (
                            <td
                              key={t}
                              className="border p-2 text-center cursor-pointer transition"
                              onClick={() => toggleAvailability(d, t)}
                              style={{
                                borderColor: SILVER,
                                backgroundColor: checked ? NAVY : "white",
                                color: checked ? "white" : NAVY,
                              }}
                            >
                              {checked ? "✓" : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.availability && <p className={errorText}>{errors.availability}</p>}
            </div>
          )}

          {/* Emergency Contact */}
          <div className={sectionClass} style={sectionStyle}>
            <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-error={!!errors.emergencyName}>
                <label className={labelClass} style={{ color: NAVY }}>Full Name *</label>
                <input
                  type="text"
                  value={form.emergency.name}
                  onChange={(e) => update("emergency.name", e.target.value)}
                  className={inputClass(!!errors.emergencyName)}
                />
                {errors.emergencyName && <p className={errorText}>{errors.emergencyName}</p>}
              </div>
              <div data-error={!!errors.emergencyRelationship}>
                <label className={labelClass} style={{ color: NAVY }}>Relationship *</label>
                <input
                  type="text"
                  value={form.emergency.relationship}
                  onChange={(e) => update("emergency.relationship", e.target.value)}
                  className={inputClass(!!errors.emergencyRelationship)}
                  placeholder="Spouse, Parent, Sibling…"
                />
                {errors.emergencyRelationship && <p className={errorText}>{errors.emergencyRelationship}</p>}
              </div>
              <div data-error={!!errors.emergencyPhone}>
                <label className={labelClass} style={{ color: NAVY }}>Primary Phone *</label>
                <input
                  type="tel"
                  value={form.emergency.phone}
                  onChange={(e) => update("emergency.phone", e.target.value)}
                  className={inputClass(!!errors.emergencyPhone)}
                />
                {errors.emergencyPhone && <p className={errorText}>{errors.emergencyPhone}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: NAVY }}>Alternate Phone</label>
                <input
                  type="tel"
                  value={form.emergency.altPhone}
                  onChange={(e) => update("emergency.altPhone", e.target.value)}
                  className={inputClass(false)}
                />
              </div>
            </div>
          </div>

          {/* Waiver */}
          <div className={sectionClass} style={sectionStyle}>
            <h2 className={sectionHeaderClass} style={sectionHeaderStyle}>
              Waiver & Liability Release
            </h2>
            <div className="bg-white border rounded-md p-4 max-h-40 overflow-y-auto text-xs text-slate-700 mb-3" style={{ borderColor: SILVER }}>
              <p className="mb-2">
                I acknowledge that ice hockey is an inherently dangerous activity that
                involves risk of serious injury, including but not limited to bruises,
                fractures, concussions, and other physical harm. By participating in this
                league, I voluntarily assume all such risks.
              </p>
              <p className="mb-2">
                I release the league, its organizers, sponsors, officials, volunteers,
                rink operators, and other participants from any and all claims, demands,
                or causes of action arising from my participation, including those caused
                by negligence.
              </p>
              <p>
                I confirm that I am physically fit to participate, hold appropriate
                medical insurance, and agree to abide by league rules, codes of conduct,
                and the decisions of officials.
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mb-3" data-error={!!errors.waiverChecked}>
              <input
                type="checkbox"
                checked={form.waiverChecked}
                onChange={(e) => update("waiverChecked", e.target.checked)}
                className="w-4 h-4 mt-1"
              />
              <span className="text-sm" style={{ color: NAVY }}>
                I have read, understood, and accept the terms of the waiver above. *
              </span>
            </label>
            {errors.waiverChecked && <p className={errorText}>{errors.waiverChecked}</p>}

            <div data-error={!!errors.waiverSignature}>
              <label className={labelClass} style={{ color: NAVY }}>
                Type <span className="font-mono bg-slate-100 px-1">I agree</span> to confirm *
              </label>
              <input
                type="text"
                value={form.waiverSignature}
                onChange={(e) => update("waiverSignature", e.target.value)}
                className={inputClass(!!errors.waiverSignature)}
              />
              {errors.waiverSignature && <p className={errorText}>{errors.waiverSignature}</p>}
            </div>
          </div>

          {/* Submit */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 px-4 py-3 rounded-md border border-red-300 bg-red-50 text-sm text-red-700">
              Please correct the highlighted fields before submitting.
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-md font-semibold border"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-md text-white font-bold hover:opacity-90 transition"
              style={{ backgroundColor: NAVY }}
            >
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
