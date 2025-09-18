import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS members (
    enrollmentNumber TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    program TEXT NOT NULL,
    gmail TEXT NOT NULL,
    hackathonName TEXT NOT NULL,
    semester TEXT,
    teamName TEXT,
    teamMembers TEXT
  )`);
  return db;
}

const db = ensureDb();

export function getAllMembers() {
  const rows = db.prepare('SELECT * FROM members').all();
  return rows.map(r => ({
    name: r.name,
    enrollmentNumber: r.enrollmentNumber,
    program: r.program,
    gmail: r.gmail,
    hackathonName: r.hackathonName,
    semester: r.semester ?? undefined,
    teamName: r.teamName ?? undefined,
    teamMembers: r.teamMembers ? JSON.parse(r.teamMembers) : undefined,
  }));
}

export function replaceAllMembers(members) {
  const insert = db.prepare(`INSERT INTO members (
    enrollmentNumber, name, program, gmail, hackathonName, semester, teamName, teamMembers
  ) VALUES (@enrollmentNumber, @name, @program, @gmail, @hackathonName, @semester, @teamName, @teamMembers)`);
  const replaceTx = db.transaction((list) => {
    db.exec('DELETE FROM members');
    for (const m of list) insert.run(m);
  });

  const normalized = members.map(m => ({
    enrollmentNumber: String(m.enrollmentNumber).trim(),
    name: String(m.name || '').trim(),
    program: String(m.program || '').trim(),
    gmail: String(m.gmail || '').trim(),
    hackathonName: 'Glitch 1.0',
    semester: m.semester ? String(m.semester).trim() : null,
    teamName: m.teamName ? String(m.teamName).trim() : null,
    teamMembers: m.teamMembers ? JSON.stringify(m.teamMembers) : null,
  }));

  replaceTx(normalized);
}

export function clearMembers() {
  db.exec('DELETE FROM members');
}
