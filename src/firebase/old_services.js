import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp,
  writeBatch
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { db, auth, getSecondaryAuth } from "./config";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ─── Teachers Management (Admin) ──────────────────────────────────────────────
export const createTeacher = async ({ name, email, password, className }) => {
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role: "teacher",
    className,
    createdAt: serverTimestamp(),
  });
  await secondaryAuth.signOut();
  return cred.user.uid;
};

export const updateTeacher = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), data);
};

export const deleteTeacher = async (uid) => {
  await deleteDoc(doc(db, "users", uid));
};

export const getAllTeachers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.role === "teacher");
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const getCategories = async () => {
  const q = query(collection(db, "categories"), orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addCategory = async ({ name, icon, order }) => {
  return await addDoc(collection(db, "categories"), {
    name, icon, order: order ?? Date.now(),
    createdAt: serverTimestamp(),
  });
};

export const updateCategory = async (catId, data) => {
  await updateDoc(doc(db, "categories", catId), data);
};

export const deleteCategory = async (catId) => {
  // Delete all items and their classStatus subcollections first
  const items = await getItems(catId);
  const batch = writeBatch(db);
  for (const item of items) {
    // Delete classStatus docs
    const statuses = await getDocs(
      collection(db, "categories", catId, "items", item.id, "classStatus")
    );
    statuses.docs.forEach(s => batch.delete(s.ref));
    batch.delete(doc(db, "categories", catId, "items", item.id));
  }
  batch.delete(doc(db, "categories", catId));
  await batch.commit();
};

// ─── Items ────────────────────────────────────────────────────────────────────
export const getItems = async (catId) => {
  const q = query(
    collection(db, "categories", catId, "items"),
    orderBy("order")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addItem = async (catId, { name, details, totalCount, order }) => {
  return await addDoc(collection(db, "categories", catId, "items"), {
    name,
    details:    details    || "",
    totalCount: totalCount ?? null,
    order:      order      ?? Date.now(),
    createdAt:  serverTimestamp(),
  });
};

export const updateItem = async (catId, itemId, data) => {
  await updateDoc(doc(db, "categories", catId, "items", itemId), data);
};

export const deleteItem = async (catId, itemId) => {
  // Delete classStatus subcollection first
  const statuses = await getDocs(
    collection(db, "categories", catId, "items", itemId, "classStatus")
  );
  const batch = writeBatch(db);
  statuses.docs.forEach(s => batch.delete(s.ref));
  batch.delete(doc(db, "categories", catId, "items", itemId));
  await batch.commit();
};

// ─── Class Status ─────────────────────────────────────────────────────────────
export const getClassStatus = async (catId, itemId) => {
  const snap = await getDocs(
    collection(db, "categories", catId, "items", itemId, "classStatus")
  );
  const result = {};
  snap.docs.forEach(d => { result[d.id] = { id: d.id, ...d.data() }; });
  return result;
};

export const getAllStatusForCategory = async (catId, items) => {
  const result = {};
  await Promise.all(
    items.map(async (item) => {
      const statusMap = await getClassStatus(catId, item.id);
      result[item.id] = statusMap;
    })
  );
  return result;
};

export const setClassStatus = async (catId, itemId, classId, data) => {
  await setDoc(
    doc(db, "categories", catId, "items", itemId, "classStatus", classId),
    {
      available:   data.available   ?? null,
      issuesCount: data.issuesCount ?? null,
      flags: data.flags || { broken: false, missing: false, paint: false, purchase: false, repair: false },
      notes: data.notes || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const deleteClassStatus = async (catId, itemId, classId) => {
  await deleteDoc(
    doc(db, "categories", catId, "items", itemId, "classStatus", classId)
  );
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getIssuesForClass = async (classId) => {
  const cats = await getCategories();
  const issues = [];
  for (const cat of cats) {
    const items = await getItems(cat.id);
    for (const item of items) {
      const snap = await getDoc(
        doc(db, "categories", cat.id, "items", item.id, "classStatus", classId)
      );
      if (snap.exists()) {
        const data = snap.data();
        const activeFlags = Object.entries(data.flags || {})
          .filter(([, v]) => v)
          .map(([k]) => k);
        if (activeFlags.length > 0 || data.notes) {
          issues.push({
            category: cat.name, categoryIcon: cat.icon,
            item: item.name, itemDetails: item.details,
            classId, flags: data.flags || {}, notes: data.notes || "",
            available: data.available,
          });
        }
      }
    }
  }
  return issues;
};

export const getAllIssues = async () => {
  const CLASSES = ["PP-1","PP-2","PP-3","PP-4","PP-5","PP-6","PP-7","PP-8","PP-9","PP-10","Store","KK"];
  const cats = await getCategories();
  const issues = [];
  for (const cat of cats) {
    const items = await getItems(cat.id);
    for (const item of items) {
      for (const classId of CLASSES) {
        const snap = await getDoc(
          doc(db, "categories", cat.id, "items", item.id, "classStatus", classId)
        );
        if (snap.exists()) {
          const data = snap.data();
          const activeFlags = Object.entries(data.flags || {})
            .filter(([, v]) => v)
            .map(([k]) => k);
          if (activeFlags.length > 0) {
            issues.push({
              category: cat.name, categoryIcon: cat.icon,
              categoryId: cat.id, itemId: item.id,
              item: item.name, itemDetails: item.details,
              classId, flags: data.flags || {}, notes: data.notes || "",
              available: data.available,
            });
          }
        }
      }
    }
  }
  return issues;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_CATEGORIES = [
  { id: "sensorial",        name: "Sensorial",          icon: "🔷", order: 1 },
  { id: "arithmetic",       name: "Arithmetic",         icon: "🔢", order: 2 },
  { id: "language",         name: "Language",           icon: "🔤", order: 3 },
  { id: "epl",              name: "EPL",                icon: "🪴", order: 4 },
  { id: "culture",          name: "Culture",            icon: "🌍", order: 5 },
  { id: "class-furniture",  name: "Class Furniture",    icon: "🪑", order: 6 },
  { id: "mat-furniture",    name: "Material Furniture", icon: "🗄️", order: 7 },
  { id: "stationary",       name: "Stationary",         icon: "✏️", order: 8 },
  { id: "tamil",            name: "Tamil",              icon: "🅣", order: 9 },
];

const SEED_ITEMS = {
  "sensorial": [
    { name: "Cylinder Block (4 sets)", details: "4 sets per class" },
    { name: "Cylinder Block Indicator (1)", details: "1 per class" },
    { name: "Cylinder Block Tray", details: "1 per class" },
    { name: "Pink Tower", details: "10 cubes" },
    { name: "10 Cubes in Size Gradation", details: "10 pieces" },
    { name: "Broad Stairs (10)", details: "10 pieces" },
    { name: "Long Rods (10)", details: "10 rods" },
    { name: "Colour Tablets Box 1 - Red", details: "2 tablets" },
    { name: "Colour Tablets Box 1 - Blue", details: "2 tablets" },
    { name: "Colour Tablets Box 1 - Yellow", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Red", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Yellow", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Orange", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - White", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Blue", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Black", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Pink", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Grey", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Brown", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Green", details: "2 tablets" },
    { name: "Colour Tablets Box 2 - Violet", details: "2 tablets" },
    { name: "Colour Tablets Box 3", details: "63 tablets; 7 shades of 9 colours" },
  ],
  "arithmetic": [
    { name: "Number Rods", details: "10 rods" },
    { name: "Number Rods with Cards", details: "1 set" },
    { name: "Sand Paper Figures (0-9)", details: "10 pieces" },
    { name: "Spindle Box", details: "2 boxes" },
    { name: "Spindles", details: "45 nos" },
    { name: "Small Number Cards 1 to 10", details: "10 cards" },
    { name: "Counters", details: "55 nos" },
    { name: "Indicator", details: "1 no" },
    { name: "Decimal Beads 1's (Static)", details: "9 nos" },
    { name: "Decimal Beads 10's (Static)", details: "9 nos" },
    { name: "Decimal Beads 100's (Static)", details: "9 nos" },
    { name: "Decimal Beads 1000's (Static)", details: "1 no" },
    { name: "Cards Static 1's", details: "1-9 cards (9 cards)" },
    { name: "Cards Static 10's", details: "10-90 cards (9 cards)" },
    { name: "Cards Static 100's", details: "100-900 (9 cards)" },
    { name: "Cards Static 1000's", details: "1000 card (1 card)" },
    { name: "Golden Bead 1's (Dynamic)", details: "45 nos" },
    { name: "Golden Bead 10's (Dynamic)", details: "45 nos" },
    { name: "Golden Bead 100's (Dynamic)", details: "45 nos" },
    { name: "Golden Bead 1000's (Dynamic)", details: "1 no" },
    { name: "Golden Bead Tray", details: "1 no" },
    { name: "Green Bowl", details: "1 no" },
    { name: "Teen Board", details: "1 set" },
  ],
  "language": [
    { name: "Sandpaper Letters - Phonetic", details: "1 set" },
    { name: "Sandpaper Letters - Phonogram", details: "1 set" },
    { name: "Movable Alphabets (Big)", details: "1 set" },
    { name: "Small Movable Alphabets", details: "1 set" },
    { name: "Movable Alphabet Box", details: "1 box" },
    { name: "Classified Cards - Things in Classroom", details: "6-8 pictures with/without name & slips" },
    { name: "Classified Cards - Type of Rooms", details: "6-8 pictures" },
    { name: "Classified Cards - Things in Bathroom", details: "6-8 pictures" },
    { name: "Classified Cards - Things in Kitchen", details: "6-8 pictures" },
    { name: "Classified Cards - Musical Instruments", details: "6-8 pictures" },
    { name: "Classified Cards - Birds", details: "6-8 pictures" },
    { name: "Classified Cards - Hospital", details: "6-8 pictures" },
    { name: "Classified Cards - Games", details: "6-8 pictures" },
    { name: "Classified Cards - Communication", details: "6-8 pictures" },
    { name: "Classified Cards - Seasons", details: "6-8 pictures" },
    { name: "Classified Cards - Parts of Body", details: "6-8 pictures" },
    { name: "Classified Cards - Land Transport", details: "6-8 pictures" },
    { name: "Classified Cards - Water Transport", details: "6-8 pictures" },
    { name: "Classified Cards - Air Transport", details: "6-8 pictures" },
  ],
  "epl": [
    { name: "Play Dough / Clay", details: "Clay - 2 boxes" },
    { name: "Sorting Tray", details: "1 tray with 3 partitions + beads" },
    { name: "Threading Beads (Big)", details: "Thread + 8 beads + bowl" },
    { name: "Inserting Token / Counters", details: "Box + 6 tokens" },
    { name: "Clipping", details: "Bowl + 6 clips" },
    { name: "Open and Close Lid / Water Bottle", details: "5 different boxes with lid" },
    { name: "Kolam Board with Buttons", details: "Square board with dot kolam + seeds" },
    { name: "Silver Bucket (Carrying)", details: "1 silver bucket" },
    { name: "Funneling (1+1)", details: "1 tray + 2 beakers + 1 funnel + napkin" },
    { name: "Ink Filler / Liquid Transfer (1+1)", details: "1 tray + 2 small glass + 1 ink filler + napkin" },
    { name: "Dot Painting", details: "Tray + bowl + paint + bud" },
    { name: "Chapathi Pressing", details: "Aluminium tray + rolling board + rolling pin + bowl + mould" },
    { name: "Pounding (Wood)", details: "1 mortar & pestle + 1 tray + 2 containers + 1 spoon" },
    { name: "Spooning (1+1 Transferring)", details: "Tray + 2 identical bowls + 1 spoon + grain" },
    { name: "Sponging", details: "Sponge + tray + 2 bowls + napkin" },
    { name: "Pin Punching", details: "Pin punching board + pins in box + tray" },
    { name: "Chair Activity", details: "Adult chair + child size chair" },
    { name: "Chandan Pasting", details: "1 tray + 2 bowls + 1 pasting stone + sandalwood + 1 spoon" },
    { name: "Mat (Big + Small + Sitting)", details: "Big mat 13 + Small mat 8 + Sitting mat 9" },
    { name: "Chowki EPL", details: "12 nos" },
    { name: "Threading Beads (Plastic)", details: "Thread + bowl + 8 beads + tray" },
    { name: "Bell", details: "1 no" },
    { name: "Grain Pouring (1+1)", details: "Silver + 2 identical tumblers + 1 jug" },
    { name: "Oil Cloth", details: "5 oil cloths" },
    { name: "Dressing Frame (Coat Button)", details: "1 coat button frame" },
    { name: "Combing Hair / Dress Up", details: "1 mirror + 1 comb + powder & puff + small tray" },
    { name: "Nuts and Bolts", details: "4 old + 2 new sets + 1 tray" },
    { name: "Medians (4)", details: "4 medians stitched along the median" },
    { name: "Peeler Set", details: "Small tray + 2 bowls + 1 peeler" },
  ],
  "culture": [
    { name: "Classified Cards - Fruits", details: "With name 8 + Without name 8 + name slips 8" },
    { name: "Body Parts Puzzle", details: "Parts of body puzzle" },
    { name: "Classified Cards - Parts of Body", details: "With name 8 + Without name 8 + name slips 8" },
    { name: "Botany Cabinet (Inset & Card)", details: "1 set" },
    { name: "World Puzzle Map", details: "7 continents + name slips" },
    { name: "Classified Cards - Vegetables", details: "With name 8 + Without name 8 + name slips 8" },
    { name: "Sandpaper Globe", details: "1 globe" },
    { name: "Air Pump + Balloon", details: "1 air pump + balloons" },
    { name: "Land & Water Forms (Lake/Island/Strait/Isthmus/Gulf/Peninsula/Cape/Bay)", details: "1 set" },
    { name: "Continent Globe", details: "1 globe" },
    { name: "Magnet Sorting (Magnetic / Non-magnetic)", details: "1 set objects + magnet" },
    { name: "Life Cycle Puzzles (Frog / Hen / Butterfly)", details: "3 puzzles" },
    { name: "Classified Cards - Transport", details: "Land + Water + Air" },
    { name: "Classified Cards - Stages of Leaves", details: "With name 4 + Without name 4 + slips 4" },
    { name: "Parts of a Plant (Nomenclature)", details: "With name 6 + Without name 6 + slips 6" },
    { name: "Parts of Reptile (Nomenclature)", details: "With name + Without name + slips" },
    { name: "Leaves Absorb Water Experiment", details: "Bowl + food colour + leaf" },
    { name: "Parts of Fish / Tortoise / Snail / Spider / Bee / Butterfly Puzzle", details: "Assorted puzzles" },
    { name: "India Puzzle Map", details: "1 puzzle" },
    { name: "Indian Flag", details: "1 flag" },
    { name: "Rigidity and Elasticity Sorting", details: "Rigid + elastic objects set" },
    { name: "Soluble and Insoluble Experiment", details: "Tray + 3 glasses + spoon + 3 containers" },
    { name: "Atlas Map", details: "1 atlas" },
    { name: "Sorting Objects by Materials", details: "Wooden + plastic + metal objects set" },
    { name: "Classified Cards - Domestic Animals", details: "With name 8 + Without name 8 + slips 8" },
    { name: "Classified Cards - Types of Reptiles", details: "With name 6 + Without name 6 + slips 6" },
    { name: "Parts of the Tree Puzzle", details: "1 puzzle" },
    { name: "Days of the Week (Reading & Matching)", details: "1 set" },
    { name: "Classified Cards - Wild Animals", details: "With name 6 + Without name 6 + slips 6" },
  ],
  "class-furniture": [
    { name: "Fans", details: "6 per class" },
    { name: "TV", details: "1 per class" },
    { name: "Remote", details: "1 per class" },
    { name: "Laptop / Tab & Charger", details: "1 per class" },
    { name: "Tube Lights", details: "6 per class" },
    { name: "Window", details: "4 windows per class" },
    { name: "Door Keys", details: "2 nos" },
    { name: "Steel Rack (Outside)", details: "1 no" },
    { name: "Shoe Rack", details: "1 no" },
    { name: "Broom", details: "1 no" },
    { name: "Dust Pan and Brush", details: "1 set" },
    { name: "Door Mat", details: "1 no" },
    { name: "Clock", details: "1 no" },
    { name: "Brown Shelf", details: "18 shelves" },
    { name: "Yellow Back Open Shelf", details: "1 no" },
    { name: "4 Tier Shelf", details: "1 no" },
    { name: "Brown Chowki (Teacher)", details: "2 nos" },
    { name: "Writing Chowki (Medium)", details: "13 nos" },
    { name: "Writing Chowki (Small)", details: "3 nos" },
    { name: "Soft Board", details: "2 nos" },
    { name: "Teacher's Table (Big)", details: "1 no" },
    { name: "Teacher's Desk and Chair", details: "1 set" },
    { name: "Duster Stand", details: "1 no" },
    { name: "Wooden Book Rack", details: "1 no" },
    { name: "Steel Cupboard (Big)", details: "1 no" },
    { name: "Steel Cupboard Stand", details: "2 nos" },
    { name: "Dust Bin", details: "1 no" },
    { name: "Wash Basin / Drum / Bucket", details: "1 set" },
    { name: "Material Duster", details: "1 no" },
    { name: "Sitting Mat (Numbers)", details: "13 nos" },
    { name: "Medium Size Mats", details: "8 nos" },
  ],
  "mat-furniture": [
    { name: "Mat Box (Sitting)", details: "1 no" },
    { name: "Mat Box (Medium)", details: "1 no" },
    { name: "Mat Box (Big)", details: "1 no" },
    { name: "Dressing Frame Stand", details: "1 no" },
    { name: "Cylinder Block Stand", details: "1 no" },
    { name: "Pink Tower Table", details: "1 no" },
    { name: "Broad Stairs Table", details: "1 no" },
    { name: "Long Rod Table", details: "1 no" },
    { name: "Touch Board Stand", details: "1 no" },
    { name: "Yellow Shelf", details: "1 no" },
    { name: "Drawing Inset Stand", details: "1 no" },
    { name: "Constructive Triangle Stand", details: "1 no" },
    { name: "Movable Chowki (Big White)", details: "1 no" },
    { name: "Number Rod Table", details: "1 no" },
    { name: "Map Stand", details: "1 no" },
    { name: "Black Board", details: "1 no" },
    { name: "Drawing Inset Pencil Holder", details: "1 no" },
    { name: "Drawing Inset Pencil Stand", details: "1 no" },
  ],
  "stationary": [
    { name: "Marker", details: "1 box" },
    { name: "Stapler", details: "1 no" },
    { name: "Stapler Pin Box", details: "1 no" },
    { name: "Duster", details: "1 no" },
    { name: "White Chalk Box", details: "1 box" },
    { name: "Colour Chalk Box", details: "1 box" },
    { name: "Board Pin", details: "1 box" },
    { name: "Cello Tape", details: "1 no (thin & thick)" },
    { name: "Rubber Band Packet", details: "1 pkt" },
    { name: "Scissors", details: "1 no" },
    { name: "Zigzag Scissors", details: "1 no" },
    { name: "Long Scale", details: "1 no" },
    { name: "Punching Machine", details: "1 no (shared 2 classes)" },
    { name: "Charts", details: "As needed" },
    { name: "Fevicol", details: "1 bottle" },
    { name: "Fevistick", details: "2 nos" },
    { name: "Cotton Roll", details: "1 roll" },
    { name: "Activity Sheet", details: "1 book" },
    { name: "Sketch Packet", details: "1 pkt" },
    { name: "Pen", details: "As needed" },
    { name: "Thread", details: "1 roll" },
    { name: "Colour Papers", details: "5 nos in each colour" },
    { name: "Glue Drops", details: "2 nos" },
    { name: "Jump Clip", details: "2 boxes" },
    { name: "Colour Pencils", details: "10 boxes" },
    { name: "Satin Ribbon", details: "2 rolls" },
    { name: "Slate Pencil", details: "1 box" },
    { name: "Pouch Stand", details: "2 nos" },
    { name: "Colour Palette", details: "1 no" },
  ],
  "tamil": [
    { name: "கண்டொலி ஆட்டப் பெட்டி 1 (அ-ஔ உயிர் எழுத்து)", details: "1 set - 12 objects" },
    { name: "கண்டொலி ஆட்டப் பெட்டி 2 (க்-ன் மெய்யெழுத்து)", details: "1 set - 18 objects" },
    { name: "உப்புத்தாள் எழுத்துகள் (அ-ஔ) 12 எழுத்துகள்", details: "1 set (12 letters)" },
    { name: "உப்புத்தாள் எழுத்துகள் (க்-ன்) 18 எழுத்துகள்", details: "1 set (18 letters)" },
    { name: "மின்னனு அட்டைகள் (அ-ஔ) 12 எழுத்துகள்", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் (க்-ன்) 18 எழுத்துகள்", details: "1 set (18 letter cards)" },
    { name: "மின்னனு அட்டைகள் க-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ம-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ச-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ந-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் வ-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ப-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் த-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ட-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ற-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ல-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ய-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ண-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ழ-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ள-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ன-வரிசை", details: "1 set (12 letter cards)" },
    { name: "மின்னனு அட்டைகள் ர-வரிசை", details: "1 set (12 letter cards)" },
    { name: "படவரிசைகள் (அ-ஔ) 12 உறைகள்", details: "5 pictures per pouch" },
  ],
};

export const seedDatabase = async () => {
  console.log("🌱 Starting seed...");
  const batch = writeBatch(db);

  for (const cat of SEED_CATEGORIES) {
    const catRef = doc(db, "categories", cat.id);
    batch.set(catRef, { name: cat.name, icon: cat.icon, order: cat.order, createdAt: serverTimestamp() });
    const items = SEED_ITEMS[cat.id] || [];
    for (let i = 0; i < items.length; i++) {
      const itemRef = doc(collection(db, "categories", cat.id, "items"));
      batch.set(itemRef, {
        name: items[i].name,
        details: items[i].details || "",
        order: (i + 1) * 10,
        createdAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
  console.log("✅ Seed complete!");
};

// Make seedDatabase available in browser console
if (typeof window !== "undefined") {
  window.seedDatabase = seedDatabase;
}
