import bcrypt from "bcryptjs";

import { logger } from "../config/logger.js";
import { Note } from "../models/note.model.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { connectDB, disconnectDB } from "./init.js";

const SEED_PASSWORD = "Password123!";

const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Ethan",
  "Fatima",
  "George",
  "Hana",
  "Ivan",
  "Julia",
  "Kabir",
  "Lina",
  "Mohammed",
  "Nina",
  "Omar",
  "Priya",
  "Quinn",
  "Rahul",
  "Sara",
  "Tomas",
];
const LAST_NAMES = [
  "Ahmed",
  "Brown",
  "Chen",
  "Das",
  "Evans",
  "Garcia",
  "Hossain",
  "Islam",
  "Kim",
  "Lopez",
  "Miller",
  "Nguyen",
  "Patel",
  "Rahman",
  "Smith",
  "Tanaka",
  "Wilson",
];
const INTERESTS = [
  "technology",
  "reading",
  "music",
  "travel",
  "sports",
  "cooking",
  "photography",
  "art",
  "fitness",
  "gaming",
  "movies",
  "history",
  "science",
  "writing",
  "gardening",
];
const NOTE_TITLES = [
  "Shopping list",
  "Meeting notes",
  "Book ideas",
  "Weekend plan",
  "Workout routine",
  "Recipe to try",
  "Project todo",
  "Travel checklist",
  "Learning goals",
  "Random thoughts",
  "Bug to fix",
  "Gift ideas",
  "Movie watchlist",
  "Budget for the month",
  "Call mom",
];
const POST_TITLES = [
  "My first post",
  "Thoughts on productivity",
  "A trip I loved",
  "Favourite books this year",
  "What I learned this week",
  "Tips for beginners",
  "Weekend recap",
  "An unpopular opinion",
];
const NOTE_LINES = [
  "Remember to follow up on this tomorrow.",
  "This needs more research before deciding.",
  "Ask the team for feedback on the draft.",
  "Buy milk, eggs, bread and coffee.",
  "Try to finish this before the end of the week.",
  "Interesting idea, worth exploring further.",
  "Keep this short and simple.",
  "Check the documentation for details.",
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T => items[randomInt(0, items.length - 1)];
const pickMany = <T>(items: readonly T[], count: number): T[] =>
  [...items].sort(() => Math.random() - 0.5).slice(0, count);

const seed = async (userCount: number) => {
  await connectDB();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const candidates = [
    {
      name: "Admin User",
      email: "admin@example.com",
      role: "admin" as const,
      interests: pickMany(INTERESTS, 3),
    },
    ...Array.from({ length: userCount }, (_, i) => {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      return {
        name: `${first} ${last}`,
        email: `${first}.${last}.${i + 1}@example.com`.toLowerCase(),
        role: "user" as const,
        interests: pickMany(INTERESTS, randomInt(0, 5)),
      };
    }),
  ];

  const existing = await User.find({ email: { $in: candidates.map((c) => c.email) } }, "email");
  const existingEmails = new Set(existing.map((u) => u.email));
  const toInsert = candidates.filter((c) => !existingEmails.has(c.email));

  const users = await User.insertMany(toInsert.map((c) => ({ ...c, password: passwordHash })));

  const notes = users.flatMap((user) =>
    Array.from({ length: randomInt(0, 8) }, () => ({
      userId: user._id,
      title: pick(NOTE_TITLES),
      content: pickMany(NOTE_LINES, randomInt(1, 3)).join("\n"),
    })),
  );
  await Note.insertMany(notes);

  const posts = users.flatMap((user) =>
    Array.from({ length: randomInt(0, 6) }, () => ({
      userId: user._id,
      title: pick(POST_TITLES),
      content: pickMany(NOTE_LINES, randomInt(1, 3)).join("\n"),
    })),
  );
  await Post.insertMany(posts);

  logger.info(
    `🌱 Seeded ${users.length} users (${existingEmails.size} already existed), ${notes.length} notes and ${posts.length} posts. ` +
      `Password for all seeded users: ${SEED_PASSWORD}`,
  );
};

const count = Number(process.argv[2] ?? 20);
if (!Number.isInteger(count) || count < 1) {
  logger.error("User count must be a positive whole number");
  process.exit(1);
}

seed(count)
  .catch((err) => {
    logger.error({ err }, "Seeding failed");
    process.exitCode = 1;
  })
  .finally(disconnectDB);
